import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Receipt({ sale, items, onClose }) {
  const [pharmacy, setPharmacy] = useState({ name: 'Marrions Pharmacy', address: 'P.O. Box 15, Kamukuywa', logo_url: null })

  useEffect(() => {
    supabase
      .from('pharmacy_settings')
      .select('name, address, logo_url')
      .eq('id', 1)
      .single()
      .then(({ data }) => data && setPharmacy(data))
  }, [])

  const logoSrc = pharmacy.logo_url || '/logo.jpg'

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ background: '#fff', width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px 16px 0 0', padding: 20, position: 'relative' }}>
        <div
          id="receipt-printable"
          style={{
            position: 'relative',
            backgroundImage: `url(${logoSrc})`,
            backgroundSize: '65%',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <img src={logoSrc} alt={pharmacy.name} style={{ width: 70, height: 70, objectFit: 'contain' }} onError={(e) => (e.target.style.display = 'none')} />
              <h3 style={{ margin: '6px 0 0' }}>{pharmacy.name}</h3>
              <p style={{ fontSize: 12, color: '#6b6357', margin: 0 }}>{pharmacy.address}</p>
            </div>
            <p style={{ fontSize: 13 }}>Receipt #{sale.id.slice(0, 8).toUpperCase()}</p>
            <p style={{ fontSize: 13 }}>Customer: {sale.customer_name}</p>
            <p style={{ fontSize: 13 }}>Payment: {sale.payment_method}</p>
            <p style={{ fontSize: 13 }}>Date: {new Date(sale.created_at || Date.now()).toLocaleString()}</p>
            <hr />
            {items.map((it) => (
              <div key={it.product.id} className="cart-row">
                <span>{it.product.name} x{it.quantity}</span>
                <span>KES {(it.product.price * it.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="total-row"><span>Total</span><span>KES {sale.total.toFixed(2)}</span></div>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#6b6357', marginTop: 16 }}>We treat but God heals</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>Close</button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={() => window.print()}>Print</button>
        </div>
      </div>
    </div>
  )
}
