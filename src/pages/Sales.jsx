import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Receipt from './Receipt'
import BarcodeScanner from './BarcodeScanner'

export default function Sales() {
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [cart, setCart] = useState([])
  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [completedSale, setCompletedSale] = useState(null)
  const [scanning, setScanning] = useState(false)

  async function loadProducts() {
    const { data } = await supabase.from('products').select('*')
    setProducts(data || [])
  }
  async function loadCustomers() {
    const { data } = await supabase.from('customers').select('*').order('name')
    setCustomers(data || [])
  }

  useEffect(() => {
    loadProducts()
    loadCustomers()
  }, [])

  function addToCart(product) {
    const todayStr = new Date().toISOString().slice(0, 10)
    if (product.expiry_date && product.expiry_date < todayStr) {
      setStatus(`${product.name} is expired and cannot be sold`)
      return
    }
    if (!product.stock_quantity || product.stock_quantity <= 0) {
      alert('This product is out of stock, please restock.')
      return
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id)
      if (existing) {
        if (existing.quantity + 1 > product.stock_quantity) {
          alert('Not enough stock available.')
          return prev
        }
        return prev.map((c) => (c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c))
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  function removeFromCart(productId) {
    setCart((prev) => prev.filter((c) => c.product.id !== productId))
  }

  function handleScanResult(decodedText, err) {
    setScanning(false)
    if (err) {
      setStatus(`Scan error: ${err}`)
      return
    }
    const match = products.find((p) => p.barcode === decodedText)
    if (match) {
      addToCart(match)
      setStatus(`Added ${match.name}`)
    } else {
      setStatus(`No product found with barcode ${decodedText}`)
    }
  }

  const total = cart.reduce((sum, c) => sum + c.product.price * c.quantity, 0)

  async function checkout() {
    if (cart.length === 0) return
    setSaving(true)
    setStatus('')
    try {
      const finalName = customerName.trim() || 'Walk-in'

      // Match an existing customer by name, or create a new one so the list grows over time
      let customer = customers.find((c) => c.name.toLowerCase() === finalName.toLowerCase())
      if (!customer && finalName !== 'Walk-in') {
        const { data: newCustomer, error: custError } = await supabase
          .from('customers')
          .insert({ name: finalName })
          .select()
          .single()
        if (custError) throw custError
        customer = newCustomer
      }

      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({ customer_name: finalName, total, payment_method: paymentMethod, status: 'completed' })
        .select()
        .single()
      if (saleError) throw saleError

      const items = cart.map((c) => ({
        sale_id: sale.id,
        product_id: c.product.id,
        quantity: c.quantity,
        unit_price: c.product.price,
        cost_price: c.product.cost_price || 0,
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

      if (customer) {
        await supabase.from('customers').update({ total_spent: Number(customer.total_spent || 0) + total }).eq('id', customer.id)
      }

      setCompletedSale({ sale, items: cart })
      setCart([])
      setCustomerName('')
      loadProducts()
      loadCustomers()
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
      {scanning && <BarcodeScanner onScan={handleScanResult} onClose={() => setScanning(false)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>New Sale</h2>
        <button className="btn-secondary" onClick={() => setScanning(true)}>📷 Scan item</button>
      </div>
      {status && <p style={{ fontSize: 13 }}>{status}</p>}

      {products.map((p) => {
        const expired = p.expiry_date && p.expiry_date < new Date().toISOString().slice(0, 10)
        const outOfStock = !p.stock_quantity || p.stock_quantity <= 0
        const disabled = expired || outOfStock
        return (
          <div
            className="product-card"
            key={p.id}
            onClick={() => addToCart(p)}
            style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}
          >
            {p.image_url ? <img src={p.image_url} alt={p.name} /> : <div className="product-thumb-placeholder">No photo</div>}
            <div className="product-info">
              <div className="name">
                {p.name}{' '}
                {expired && <span className="expired-badge">EXPIRED</span>}
                {!expired && outOfStock && <span className="expired-badge">OUT OF STOCK</span>}
              </div>
              <div className="meta">KES {p.price} • Stock: {p.stock_quantity}</div>
            </div>
          </div>
        )
      })}

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
            <label>Customer</label>
            <input
              list="customer-options"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Search or type a new customer"
            />
            <datalist id="customer-options">
              {customers.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </div>
          <div className="field">
            <label>Payment method</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="mpesa">M-Pesa</option>
              <option value="card">Card</option>
            </select>
          </div>
          <button className="btn-primary" onClick={checkout} disabled={saving}>
            {saving ? 'Processing...' : 'Complete sale'}
          </button>
        </div>
      )}
    </div>
  )
}
