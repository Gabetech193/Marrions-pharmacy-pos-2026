import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Well-known Kenyan pharmaceutical distributors, offered as a starting point.
// Contact details vary by branch/region, so these are name-only suggestions —
// verify current contacts before relying on them.
const SUGGESTED_VENDORS = [
  { name: 'KEMSA (Kenya Medical Supplies Authority)', medicines_supplied: 'Essential medicines, public health commodities' },
  { name: 'Beta Healthcare International', medicines_supplied: 'Generic & branded pharmaceuticals' },
  { name: 'Surgipharm Ltd', medicines_supplied: 'Pharmaceuticals & surgical supplies' },
  { name: 'Cosmos Pharmaceuticals', medicines_supplied: 'Generic medicines' },
  { name: 'Universal Corporation Ltd', medicines_supplied: 'Generic pharmaceuticals' },
  { name: 'Philips Pharmaceuticals', medicines_supplied: 'Branded & generic drugs' },
]

export default function Vendors() {
  const [vendors, setVendors] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [medicinesSupplied, setMedicinesSupplied] = useState('')
  const [error, setError] = useState('')

  async function loadVendors() {
    const { data } = await supabase.from('vendors').select('*').order('created_at', { ascending: false })
    setVendors(data || [])
  }

  useEffect(() => {
    loadVendors()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.from('vendors').insert({
      name,
      contact_person: contactPerson,
      phone,
      email,
      medicines_supplied: medicinesSupplied,
    })
    if (error) {
      setError(error.message)
      return
    }
    setName(''); setContactPerson(''); setPhone(''); setEmail(''); setMedicinesSupplied('')
    setShowForm(false)
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
        <button className="btn-secondary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add vendor'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
          <div className="field">
            <label>Vendor / company name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field">
            <label>Contact person</label>
            <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
          </div>
          <div className="field">
            <label>Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Medicines supplied</label>
            <input value={medicinesSupplied} onChange={(e) => setMedicinesSupplied(e.target.value)} placeholder="e.g. antibiotics, painkillers" />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn-primary" type="submit">Save vendor</button>
        </form>
      )}

      {vendors.map((v) => (
        <div className="product-card" key={v.id}>
          <div className="product-info">
            <div className="name">{v.name}</div>
            <div className="meta">{v.medicines_supplied}</div>
            <div className="meta">{v.contact_person} {v.phone}</div>
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
