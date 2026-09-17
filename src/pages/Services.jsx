import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const SUGGESTED_SERVICES = [
  { name: 'Prescription dispensing', description: 'Filling doctor-prescribed medication' },
  { name: 'Over-the-counter consultation', description: 'Advice on non-prescription remedies' },
  { name: 'Blood pressure check', description: 'Quick BP screening' },
  { name: 'Blood sugar / glucose test', description: 'Diabetes screening' },
  { name: 'Vaccination / immunization', description: 'e.g. flu, tetanus, travel vaccines' },
  { name: 'Wound dressing & first aid', description: 'Minor injury care' },
  { name: 'Family planning advice', description: 'Contraceptive counseling and supply' },
  { name: 'Health & wellness advice', description: 'General health consultations' },
  { name: 'Home delivery of medicine', description: 'Deliver orders to customers nearby' },
  { name: 'HIV testing & counseling', description: 'Confidential testing services' },
]

export default function Services() {
  const [services, setServices] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState('')

  async function loadServices() {
    const { data } = await supabase.from('services').select('*').order('created_at', { ascending: false })
    setServices(data || [])
  }

  useEffect(() => {
    loadServices()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.from('services').insert({
      name,
      description,
      price: price ? parseFloat(price) : null,
    })
    if (error) {
      setError(error.message)
      return
    }
    setName(''); setDescription(''); setPrice('')
    setShowForm(false)
    loadServices()
  }

  async function addSuggested(s) {
    await supabase.from('services').insert({ name: s.name, description: s.description })
    loadServices()
  }

  return (
    <div className="content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Services</h2>
        <button className="btn-secondary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add service'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
          <div className="field">
            <label>Service name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field">
            <label>Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="field">
            <label>Price (KES, optional)</label>
            <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn-primary" type="submit">Save service</button>
        </form>
      )}

      {services.map((s) => (
        <div className="product-card" key={s.id}>
          <div className="product-info">
            <div className="name">{s.name}</div>
            <div className="meta">{s.description}{s.price ? ` • KES ${s.price}` : ''}</div>
          </div>
        </div>
      ))}

      {services.length === 0 && !showForm && (
        <>
          <p style={{ color: '#6b6357' }}>No services added yet. Common pharmacy services you could offer:</p>
          {SUGGESTED_SERVICES.map((s) => (
            <div className="product-card" key={s.name}>
              <div className="product-info">
                <div className="name">{s.name}</div>
                <div className="meta">{s.description}</div>
              </div>
              <button className="btn-secondary" onClick={() => addSuggested(s)}>Add</button>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
