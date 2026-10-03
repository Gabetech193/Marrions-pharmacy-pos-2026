const DB_NAME = 'marrions-pharmacy-offline-v1'
const DB_VERSION = 1
const TABLES = [
  'profiles', 'pharmacy_settings', 'products', 'services', 'customers', 'vendors',
  'sales', 'sales_items', 'purchase_orders', 'purchase_order_items', 'expenses'
]

let dbPromise
const uuid = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`)

function openDb() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('records')) db.createObjectStore('records', { keyPath: 'key' })
      if (!db.objectStoreNames.contains('queue')) db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true })
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' })
      if (!db.objectStoreNames.contains('blobs')) db.createObjectStore('blobs', { keyPath: 'path' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function request(store, mode, fn) {
  return openDb().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode)
    const objectStore = tx.objectStore(store)
    let result
    try { result = fn(objectStore) } catch (e) { reject(e); return }
    tx.oncomplete = () => resolve(result)
    tx.onerror = () => reject(tx.error)
  }))
}

export async function getAll(table) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('records', 'readonly')
    const req = tx.objectStore('records').getAll()
    req.onsuccess = () => resolve(req.result.filter(r => r.table === table).map(r => r.row))
    req.onerror = () => reject(req.error)
  })
}

export async function putRows(table, rows) {
  if (!rows?.length) return
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('records', 'readwrite')
    const store = tx.objectStore('records')
    rows.forEach(row => store.put({ key: `${table}:${row.id}`, table, row }))
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  })
}

export async function putRow(table, row) { return putRows(table, [row]) }

export async function removeRow(table, id) {
  return request('records', 'readwrite', store => store.delete(`${table}:${id}`))
}

export async function clearTable(table) {
  const rows = await getAll(table)
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('records', 'readwrite')
    const store = tx.objectStore('records')
    rows.forEach(row => store.delete(`${table}:${row.id}`))
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  })
}

export async function addQueue(action) {
  return request('queue', 'readwrite', store => store.add({ ...action, createdAt: Date.now() }))
}

export async function getQueue() {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('queue', 'readonly')
    const req = tx.objectStore('queue').getAll()
    req.onsuccess = () => resolve(req.result.sort((a, b) => a.id - b.id))
    req.onerror = () => reject(req.error)
  })
}

export async function removeQueue(id) { return request('queue', 'readwrite', store => store.delete(id)) }

export async function saveMeta(key, value) { return request('meta', 'readwrite', store => store.put({ key, value })) }
export async function getMeta(key) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('meta', 'readonly')
    const req = tx.objectStore('meta').get(key)
    req.onsuccess = () => resolve(req.result?.value)
    req.onerror = () => reject(req.error)
  })
}

export async function saveBlob(path, blob) { return request('blobs', 'readwrite', store => store.put({ path, blob })) }
export async function getBlob(path) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('blobs', 'readonly')
    const req = tx.objectStore('blobs').get(path)
    req.onsuccess = () => resolve(req.result?.blob || null)
    req.onerror = () => reject(req.error)
  })
}

export function makeId() { return uuid() }
export { TABLES }
