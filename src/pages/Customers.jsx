import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  async function load() {
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
    setCustomers(data || [])
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.from('customers').insert({ name, phone, email })
    if (error) {
      setError(error.message)
      return
    }
    setName(''); setPhone(''); setEmail('')
    setShowForm(false)
    load()
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this customer?')) return
    await supabase.from('customers').delete().eq('id', id)
    load()
  }

  return (
    <div className="content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Customers</h2>
        <button className="btn-secondary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add customer'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
          <div className="field">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field">
            <label>Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn-primary" type="submit">Save customer</button>
        </form>
      )}

      {customers.map((c) => (
        <div className="product-card" key={c.id}>
          <div className="product-info">
            <div className="name">{c.name}</div>
            <div className="meta">{c.phone || c.email || ''} • Total spent: KES {c.total_spent}</div>
          </div>
          <div className="product-actions">
            <button className="icon-btn" onClick={() => handleDelete(c.id)} title="Delete">🗑️</button>
          </div>
        </div>
      ))}
      {customers.length === 0 && !showForm && <p style={{ color: '#6b6357' }}>No customers recorded yet.</p>}
    </div>
  )
}
