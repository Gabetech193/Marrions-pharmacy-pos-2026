import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import Login from './pages/Login'
import Products from './pages/Products'
import Sales from './pages/Sales'
import Customers from './pages/Customers'
import Services from './pages/Services'
import Vendors from './pages/Vendors'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'

const ADMIN_TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'sales', label: 'Sales', icon: '🛒' },
  { key: 'products', label: 'Products', icon: '💊' },
  { key: 'customers', label: 'Customers', icon: '👥' },
  { key: 'services', label: 'Services', icon: '🩺' },
  { key: 'vendors', label: 'Vendors', icon: '🚚' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
]
const CASHIER_TABS = [{ key: 'sales', label: 'Sales', icon: '🛒' }]

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [pharmacyName, setPharmacyName] = useState('Marrions Pharmacy')
  const [tab, setTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)

  async function loadProfileAndSettings(userId) {
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(prof || null)
    setTab(prof?.role === 'admin' ? 'dashboard' : 'sales')

    const { data: settings } = await supabase.from('pharmacy_settings').select('name').eq('id', 1).single()
    if (settings?.name) setPharmacyName(settings.name)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) loadProfileAndSettings(data.session.user.id)
      else setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession) loadProfileAndSettings(newSession.user.id)
      else setProfile(null)
      setLoading(false)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (loading) return <div className="app-shell content">Loading...</div>

  const isAdmin = profile?.role === 'admin'
  const tabs = isAdmin ? ADMIN_TABS : CASHIER_TABS

  return (
    <div className="app-shell">
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/logo.jpg" alt="logo" style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 4 }} />
          <h1>{pharmacyName}</h1>
        </div>
        {session && <button onClick={() => supabase.auth.signOut()}>Sign out</button>}
      </div>

      {!session ? (
        <Login />
      ) : (
        <>
          {tab === 'dashboard' && isAdmin && <Dashboard />}
          {tab === 'sales' && <Sales />}
          {tab === 'products' && isAdmin && <Products isAdmin={isAdmin} />}
          {tab === 'customers' && isAdmin && <Customers />}
          {tab === 'services' && isAdmin && <Services />}
          {tab === 'vendors' && isAdmin && <Vendors />}
          {tab === 'settings' && isAdmin && <Settings />}

          <div className="bottom-nav">
            {tabs.map((t) => (
              <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
                <span className="icon">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
