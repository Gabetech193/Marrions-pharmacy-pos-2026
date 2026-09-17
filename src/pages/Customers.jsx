import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Customers() {
  const [customers, setCustomers] = useState([])

  useEffect(() => {
    supabase.from('customers').select('*').order('created_at', { ascending: false }).then(({ data }) => setCustomers(data || []))
  }, [])

  return (
    <div className="content">
      <h2>Customers</h2>
      {customers.map((c) => (
        <div className="product-card" key={c.id}>
          <div className="product-info">
            <div className="name">{c.name}</div>
            <div className="meta">{c.phone || c.email || ''} • Total spent: KES {c.total_spent}</div>
          </div>
        </div>
      ))}
      {customers.length === 0 && <p style={{ color: '#6b6357' }}>No customers recorded yet.</p>}
    </div>
  )
}
