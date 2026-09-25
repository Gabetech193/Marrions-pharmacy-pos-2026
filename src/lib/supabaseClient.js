import { createClient } from '@supabase/supabase-js'
import { getAll, putRows, putRow, removeRow, addQueue, getQueue, removeQueue, makeId, TABLES, saveBlob } from './offlineDb'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const remote = createClient(supabaseUrl, supabaseAnonKey)

const NETWORK_CODES = new Set(['PGRST301', 'PGRST302', '57014'])
const isOffline = () => typeof navigator !== 'undefined' && !navigator.onLine
const isNetworkError = (error) => isOffline() || error?.name === 'TypeError' || error?.message?.toLowerCase?.().includes('failed to fetch') || NETWORK_CODES.has(error?.code)

function applyFilters(rows, filters) {
  return rows.filter(row => filters.every(f => String(row?.[f.column]) === String(f.value)))
}

function selectColumns(rows, columns) {
  if (!columns || columns === '*') return rows
  const names = columns.split(',').map(s => s.trim()).filter(Boolean)
  return rows.map(row => Object.fromEntries(names.map(name => [name, row[name]])))
}

function sortRows(rows, orderings) {
  return [...rows].sort((a, b) => {
    for (const o of orderings) {
      const av = a?.[o.column]; const bv = b?.[o.column]
      if (av === bv) continue
      if (av == null) return o.ascending ? -1 : 1
      if (bv == null) return o.ascending ? 1 : -1
      return (av < bv ? -1 : 1) * (o.ascending ? 1 : -1)
    }
    return 0
  })
}

function enrichRows(payload) {
  const now = new Date().toISOString()
  const list = Array.isArray(payload) ? payload : [payload]
  return list.map(row => ({
    ...row,
    ...(row.id == null ? { id: makeId() } : {}),
    ...(row.created_at == null ? { created_at: now } : {}),
  }))
}

async function localQuery(table, columns, filters, orderings, single) {
  let rows = applyFilters(await getAll(table), filters)
  rows = sortRows(rows, orderings)
  rows = selectColumns(rows, columns)
  if (single) return rows[0] || null
  return rows
}

function localFrom(table) {
  const state = { op: 'select', payload: null, columns: '*', filters: [], orderings: [], single: false }

  const builder = {
    select(columns = '*') { state.columns = columns; return builder },
    eq(column, value) { state.filters.push({ column, value }); return builder },
    order(column, options = {}) { state.orderings.push({ column, ascending: options.ascending !== false }); return builder },
    single() { state.single = true; return builder },
    maybeSingle() { state.single = true; return builder },
    insert(payload) { state.op = 'insert'; state.payload = payload; return builder },
    update(payload) { state.op = 'update'; state.payload = payload; return builder },
    delete() { state.op = 'delete'; return builder },
    then(resolve, reject) { return execute(resolve, reject) },
  }

  async function execute(resolve, reject) {
    try {
      if (state.op === 'select') {
        if (!isOffline()) {
          const q = remote.from(table).select(state.columns)
          state.filters.forEach(f => q.eq(f.column, f.value))
          state.orderings.forEach(o => q.order(o.column, { ascending: o.ascending }))
          const result = state.single ? await q.single() : await q
          if (!result.error) {
            if (state.single) { if (result.data) await putRow(table, result.data) }
            else if (result.data) await putRows(table, result.data)
            return resolve(result)
          }
          if (!isNetworkError(result.error)) return resolve(result)
        }
        const data = await localQuery(table, state.columns, state.filters, state.orderings, state.single)
        return resolve({ data, error: null })
      }

      if (state.op === 'insert') {
        const rows = enrichRows(state.payload)
        if (!isOffline()) {
          const q = remote.from(table).insert(rows)
          if (state.columns !== '*' || state.single) q.select(state.columns)
          const result = state.single ? await q.single() : await q
          if (!result.error) {
            const returned = result.data || rows
            await putRows(table, Array.isArray(returned) ? returned : [returned])
            return resolve(result.data ? result : { data: null, error: null })
          }
          if (!isNetworkError(result.error)) return resolve(result)
        }
        await putRows(table, rows)
        await addQueue({ type: 'insert', table, rows })
        const data = state.single ? rows[0] : null
        return resolve({ data, error: null, offline: true })
      }

      if (state.op === 'update') {
        const current = applyFilters(await getAll(table), state.filters)
        const updated = current.map(row => ({ ...row, ...state.payload }))
        if (!isOffline()) {
          const q = remote.from(table).update(state.payload)
          state.filters.forEach(f => q.eq(f.column, f.value))
          const result = state.columns !== '*' || state.single ? await q.select(state.columns) : await q
          if (!result.error) {
            await putRows(table, result.data || updated)
            return resolve(result)
          }
          if (!isNetworkError(result.error)) return resolve(result)
        }
        await putRows(table, updated)
        await addQueue({ type: 'update', table, filters: state.filters, payload: state.payload })
        return resolve({ data: null, error: null, offline: true })
      }

      if (state.op === 'delete') {
        const current = applyFilters(await getAll(table), state.filters)
        if (!isOffline()) {
          const q = remote.from(table).delete()
          state.filters.forEach(f => q.eq(f.column, f.value))
          const result = await q
          if (!result.error) {
            for (const row of current) await removeRow(table, row.id)
            return resolve(result)
          }
          if (!isNetworkError(result.error)) return resolve(result)
        }
        for (const row of current) await removeRow(table, row.id)
        await addQueue({ type: 'delete', table, filters: state.filters })
        return resolve({ data: null, error: null, offline: true })
      }
    } catch (error) {
      reject(error)
    }
  }

  return builder
}

async function syncQueue() {
  if (isOffline()) return
  const queue = await getQueue()
  // Do not let one failed record block every later offline change.
  // Each queued operation is retried independently.
  for (const action of queue) {
    try {
      if (action.type === 'insert') {
        const result = await remote.from(action.table).insert(action.rows)
        if (result.error) {
          // A duplicate key means the original request probably reached the server before connectivity was lost.
          if (result.error.code !== '23505') throw result.error
        }
        await putRows(action.table, action.rows)
      } else if (action.type === 'update') {
        const q = remote.from(action.table).update(action.payload)
        action.filters.forEach(f => q.eq(f.column, f.value))
        const result = await q
        if (result.error) throw result.error
        const rows = applyFilters(await getAll(action.table), action.filters).map(r => ({ ...r, ...action.payload }))
        await putRows(action.table, rows)
      } else if (action.type === 'delete') {
        const q = remote.from(action.table).delete()
        action.filters.forEach(f => q.eq(f.column, f.value))
        const result = await q
        if (result.error && result.error.code !== 'PGRST116') throw result.error
      }
      await removeQueue(action.id)
    } catch (error) {
      // Keep this item queued and continue with the rest. A later automatic
      // retry will try this item again, while unrelated changes can sync now.
      continue
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', syncQueue)
  setInterval(syncQueue, 15000)
  syncQueue()
}

const auth = {
  getSession: (...args) => remote.auth.getSession(...args),
  onAuthStateChange: (...args) => remote.auth.onAuthStateChange(...args),
  signInWithPassword: (...args) => remote.auth.signInWithPassword(...args),
  signOut: (...args) => remote.auth.signOut(...args),
  async getUser() {
    const { data } = await remote.auth.getSession()
    return { data: { user: data?.session?.user || null }, error: null }
  },
}


const pendingObjectUrls = new Map()

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

const storage = {
  from(bucket) {
    const remoteBucket = remote.storage.from(bucket)
    return {
      async upload(path, file, options) {
        if (!isOffline()) {
          const result = await remoteBucket.upload(path, file, options)
          if (!result.error) return result
          if (!isNetworkError(result.error)) return result
        }
        try {
          const dataUrl = await fileToDataUrl(file)
          pendingObjectUrls.set(`${bucket}/${path}`, dataUrl)
          await saveBlob(`${bucket}/${path}`, file)
          return { data: { path }, error: null, offline: true }
        } catch (error) {
          return { data: null, error }
        }
      },
      getPublicUrl(path) {
        const local = pendingObjectUrls.get(`${bucket}/${path}`)
        if (local) return { data: { publicUrl: local } }
        return remoteBucket.getPublicUrl(path)
      },
    }
  },
}

export async function warmOfflineCache() {
  if (isOffline()) return
  await Promise.allSettled(TABLES.map(async table => {
    const { data, error } = await remote.from(table).select('*')
    if (!error && data) await putRows(table, data)
  }))
}

export const supabase = {
  from: localFrom,
  auth,
  storage,
  functions: remote.functions,
}

export { syncQueue }
