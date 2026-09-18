import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const SUGGESTED_VENDORS = [
  { name: 'KEMSA (Kenya Medical Supplies Authority)', medicines_supplied: 'Essential medicines, public health commodities' },
  { name: 'Beta Healthcare International', medicines_supplied: 'Generic & branded pharmaceuticals' },
  { name: 'Surgipharm Ltd', medicines_supplied: 'Pharmaceuticals & surgical supplies' },
  { name: 'Cosmos Pharmaceuticals', medicines_supplied: 'Generic medicines' },
  { name: 'Universal Corporation Ltd', medicines_supplied: 'Generic pharmaceuticals' },
  { name: 'Philips Pharmaceuticals', medicines_supplied: 'Branded & generic drugs' },
]

const emptyForm = { name: '', contactPerson: '', phone: '', email: '', medicinesSupplied: '' }

export default function Vendors() {
  const [vendors, setVendors] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  async function loadVendors() {
    const { data } = await supabase.from('vendors').select('*').order('created_at', { ascending: false })
    setVendors(data || [])
  }

  useEffect(() => {
    loadVendors()
  }, [])

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function startEdit(v) {
    setEditingId(v.id)
    setForm({
      name: v.name,
      contactPerson: v.contact_person || '',
      phone: v.phone || '',
      email: v.email || '',
      medicinesSupplied: v.medicines_supplied || '',
    })
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const payload = {
      name: form.name,
      contact_person: form.contactPerson,
      phone: form.phone,
      email: form.email,
      medicines_supplied: form.medicinesSupplied,
    }
    const { error } = editingId
      ? await supabase.from('vendors').update(payload).eq('id', editingId)
      : await supabase.from('vendors').insert(payload)
    if (error) {
      setError(error.message)
      return
    }
    cancelForm()
    loadVendors()
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this vendor?')) return
    await supabase.from('vendors').delete().eq('id', id)
    loadVendors()
  }

  async function addSuggested(v) {
    await supabase.from('vendors').insert({ name: v.name, medicines_supplied: v.medicines_supplied })
    loadVendors()
  }

  return (
    <div className="content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Vendors</h2>
        <button className="btn-secondary" onClick={() => (showForm ? cancelForm() : setShowForm(true))}>
          {showForm ? 'Cancel' : '+ Add vendor'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
          <div className="field">
            <label>Vendor / company name</label>
            <input value={form.name} onChange={(e) => setField('name', e.target.value)} required />
          </div>
          <div className="field">
            <label>Contact person</label>
            <input value={form.contactPerson} onChange={(e) => setField('contactPerson', e.target.value)} />
          </div>
          <div className="field">
            <label>Phone</label>
            <input value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} />
          </div>
          <div className="field">
            <label>Medicines supplied</label>
            <input value={form.medicinesSupplied} onChange={(e) => setField('medicinesSupplied', e.target.value)} placeholder="e.g. antibiotics, painkillers" />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn-primary" type="submit">{editingId ? 'Update vendor' : 'Save vendor'}</button>
        </form>
      )}

      {vendors.map((v) => (
        <div className="product-card" key={v.id}>
          <div className="product-info">
            <div className="name">{v.name}</div>
            <div className="meta">{v.medicines_supplied}</div>
            <div className="meta">{v.contact_person} {v.phone}</div>
          </div>
          <div className="product-actions">
            <button className="icon-btn" onClick={() => startEdit(v)} title="Edit">✏️</button>
            <button className="icon-btn" onClick={() => handleDelete(v.id)} title="Delete">🗑️</button>
          </div>
        </div>
      ))}

      {vendors.length === 0 && !showForm && (
        <>
          <p style={{ color: '#6b6357' }}>No vendors added yet. Some known Kenyan pharmaceutical distributors to consider (verify current contacts before ordering):</p>
          {SUGGESTED_VENDORS.map((v) => (
            <div className="product-card" key={v.name}>
              <div className="product-info">
                <div className="name">{v.name}</div>
                <div className="meta">{v.medicines_supplied}</div>
              </div>
              <button className="btn-secondary" onClick={() => addSuggested(v)}>Add</button>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
