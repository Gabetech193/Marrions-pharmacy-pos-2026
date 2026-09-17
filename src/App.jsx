import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import Login from './pages/Login'
import Products from './pages/Products'
import Sales from './pages/Sales'
import Customers from './pages/Customers'
import Services from './pages/Services'
import Vendors from './pages/Vendors'
import Dashboard from './pages/Dashboard'

export default function App() {
  const [session, setSession] = useState(null)
  const [tab, setTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (loading) return <div className="app-shell content">Loading...</div>

  return (
    <div className="app-shell">
      <div className="top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/logo.jpg" alt="logo" style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 4 }} />
          <h1>Marrions Pharmacy</h1>
        </div>
        {session && <button onClick={() => supabase.auth.signOut()}>Sign out</button>}
      </div>

      {!session ? (
        <Login />
      ) : (
        <>
          <div className="tabs">
            <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>Dashboard</button>
            <button className={tab === 'sales' ? 'active' : ''} onClick={() => setTab('sales')}>Sales</button>
            <button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>Products</button>
          </div>
          <div className="tabs">
            <button className={tab === 'customers' ? 'active' : ''} onClick={() => setTab('customers')}>Customers</button>
            <button className={tab === 'services' ? 'active' : ''} onClick={() => setTab('services')}>Services</button>
            <button className={tab === 'vendors' ? 'active' : ''} onClick={() => setTab('vendors')}>Vendors</button>
          </div>
          {tab === 'dashboard' && <Dashboard />}
          {tab === 'sales' && <Sales />}
          {tab === 'products' && <Products />}
          {tab === 'customers' && <Customers />}
          {tab === 'services' && <Services />}
          {tab === 'vendors' && <Vendors />}
        </>
      )}
    </div>
  )
}
