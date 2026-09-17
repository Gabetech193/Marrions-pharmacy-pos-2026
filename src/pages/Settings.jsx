import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Settings() {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [logoUrl, setLogoUrl] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [staff, setStaff] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const { data: settings } = await supabase.from('pharmacy_settings').select('*').eq('id', 1).single()
    if (settings) {
      setName(settings.name)
      setAddress(settings.address)
      setLogoUrl(settings.logo_url)
    }
    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: true })
    setStaff(profiles || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function handleLogoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  async function saveDetails(e) {
    e.preventDefault()
    setStatus('')
    setSaving(true)
    try {
      let newLogoUrl = logoUrl
      if (logoFile) {
        const ext = logoFile.name.split('.').pop()
        const fileName = `branding/logo-${crypto.randomUUID()}.${ext}`
        const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, logoFile)
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName)
        newLogoUrl = urlData.publicUrl
      }
      const { error } = await supabase.from('pharmacy_settings').update({ name, address, logo_url: newLogoUrl }).eq('id', 1)
      if (error) throw error
      setLogoUrl(newLogoUrl)
      setLogoFile(null)
      setLogoPreview(null)
      setStatus('Saved ✔')
    } catch (err) {
      setStatus(`Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
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
        <div className="image-upload-box">
          <img src={logoPreview || logoUrl || '/logo.jpg'} alt="Pharmacy logo" style={{ width: 90, height: 90, objectFit: 'contain', marginBottom: 8 }} />
          <input type="file" accept="image/*" onChange={handleLogoChange} />
          <p style={{ fontSize: 12, color: '#6b6357', margin: '4px 0 0' }}>Upload a new logo to replace the current one</p>
        </div>
        <div className="field">
          <label>Pharmacy name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label>Address</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} required />
        </div>
        {status && <p style={{ fontSize: 13 }}>{status}</p>}
        <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save details'}</button>
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
