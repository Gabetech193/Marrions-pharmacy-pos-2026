import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Receipt from './Receipt'

export default function Sales() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([]) // { product, quantity }
  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [completedSale, setCompletedSale] = useState(null) // { sale, items }

  useEffect(() => {
    supabase.from('products').select('*').then(({ data }) => setProducts(data || []))
  }, [])

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id)
      if (existing) {
        return prev.map((c) => (c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c))
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  function removeFromCart(productId) {
    setCart((prev) => prev.filter((c) => c.product.id !== productId))
  }

  const total = cart.reduce((sum, c) => sum + c.product.price * c.quantity, 0)

  async function checkout() {
    if (cart.length === 0) return
    setSaving(true)
    setStatus('')
    try {
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({ customer_name: customerName || 'Walk-in', total, payment_method: paymentMethod, status: 'completed' })
        .select()
        .single()
      if (saleError) throw saleError

      const items = cart.map((c) => ({
        sale_id: sale.id,
        product_id: c.product.id,
        quantity: c.quantity,
        unit_price: c.product.price,
        subtotal: c.product.price * c.quantity,
      }))
      const { error: itemsError } = await supabase.from('sales_items').insert(items)
      if (itemsError) throw itemsError

      for (const c of cart) {
        await supabase
          .from('products')
          .update({ stock_quantity: Math.max(0, c.product.stock_quantity - c.quantity) })
          .eq('id', c.product.id)
      }

      setCompletedSale({ sale, items: cart })
      setCart([])
      setCustomerName('')
    } catch (err) {
      setStatus(`Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="content">
      {completedSale && (
        <Receipt sale={completedSale.sale} items={completedSale.items} onClose={() => setCompletedSale(null)} />
      )}
      <h2>New Sale</h2>
      {products.map((p) => (
        <div className="product-card" key={p.id} onClick={() => addToCart(p)} style={{ cursor: 'pointer' }}>
          {p.image_url ? <img src={p.image_url} alt={p.name} /> : <div className="product-thumb-placeholder">No photo</div>}
          <div className="product-info">
            <div className="name">{p.name}</div>
            <div className="meta">KES {p.price} • Stock: {p.stock_quantity}</div>
          </div>
        </div>
      ))}

      {cart.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3>Cart</h3>
          {cart.map((c) => (
            <div className="cart-row" key={c.product.id}>
              <span>{c.product.name} x{c.quantity}</span>
              <span>
                KES {(c.product.price * c.quantity).toFixed(2)}{' '}
                <a href="#" onClick={() => removeFromCart(c.product.id)} style={{ marginLeft: 8, fontSize: 12 }}>remove</a>
              </span>
            </div>
          ))}
          <div className="total-row"><span>Total</span><span>KES {total.toFixed(2)}</span></div>
          <div className="field">
            <label>Customer name (optional)</label>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div className="field">
            <label>Payment method</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="mpesa">M-Pesa</option>
              <option value="card">Card</option>
            </select>
          </div>
          {status && <p style={{ fontSize: 13 }}>{status}</p>}
          <button className="btn-primary" onClick={checkout} disabled={saving}>
            {saving ? 'Processing...' : 'Complete sale'}
          </button>
        </div>
      )}
    </div>
  )
}
