import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Settings() {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [staff, setStaff] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data: settings } = await supabase.from('pharmacy_settings').select('*').eq('id', 1).single()
    if (settings) {
      setName(settings.name)
      setAddress(settings.address)
    }
    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: true })
    setStaff(profiles || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function saveDetails(e) {
    e.preventDefault()
    setStatus('')
    const { error } = await supabase.from('pharmacy_settings').update({ name, address }).eq('id', 1)
    setStatus(error ? `Error: ${error.message}` : 'Saved ✔')
  }

  async function changeRole(profileId, role) {
    await supabase.from('profiles').update({ role }).eq('id', profileId)
    load()
  }

  if (loading) return <div className="content">Loading...</div>

  return (
    <div className="content">
      <h2>Settings</h2>
      <form onSubmit={saveDetails} style={{ marginBottom: 24 }}>
        <div className="field">
          <label>Pharmacy name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label>Address</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} required />
        </div>
        {status && <p style={{ fontSize: 13 }}>{status}</p>}
        <button className="btn-primary" type="submit">Save details</button>
      </form>

      <h3>Staff & roles</h3>
      <p style={{ fontSize: 12, color: '#6b6357' }}>
        New staff should sign up from the login screen with their own email — they'll join as Cashier by default. Promote them to Admin here if needed.
      </p>
      {staff.map((s) => (
        <div className="product-card" key={s.id}>
          <div className="product-info">
            <div className="name">{s.name}</div>
            <div className="meta">{s.role}</div>
          </div>
          <select value={s.role} onChange={(e) => changeRole(s.id, e.target.value)}>
            <option value="admin">Admin</option>
            <option value="cashier">Cashier</option>
          </select>
        </div>
      ))}
    </div>
  )
}
