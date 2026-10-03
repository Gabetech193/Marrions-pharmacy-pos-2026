import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import BarcodeScanner from './BarcodeScanner'
import { playScanError } from '../lib/sound'

const emptyForm = { name: '', category: '', costPrice: '', price: '', stock: '', reorderLevel: '10', barcode: '', expiryDate: '', baseUnit: 'unit', purchaseUnit: 'unit', unitsPerPurchase: '1', purchaseCost: '', saleUnit: 'unit', saleStep: '1' }

export default function Products({ isAdmin }) {
  const [products, setProducts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)
  const [restockingId, setRestockingId] = useState(null)
  const [restockQty, setRestockQty] = useState('')

  async function loadProducts() {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts(data || [])
  }

  useEffect(() => {
    loadProducts()
  }, [])

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function handleScanResult(decodedText, err) {
    setScanning(false)
    if (decodedText) setField('barcode', decodedText)
    else if (err) {
      playScanError()
      setError(err)
    }
  }

  function startEdit(p) {
    setEditingId(p.id)
    setForm({
      name: p.name,
      category: p.category || '',
      costPrice: p.cost_price || '',
      price: p.price,
      stock: p.stock_quantity,
      reorderLevel: p.reorder_level ?? 10,
      barcode: p.barcode || '',
      expiryDate: p.expiry_date || '',
      baseUnit: p.base_unit || 'unit',
      purchaseUnit: p.purchase_unit || p.base_unit || 'unit',
      unitsPerPurchase: p.units_per_purchase ?? 1,
      purchaseCost: p.purchase_cost ?? '',
      saleUnit: p.sale_unit || p.base_unit || 'unit',
      saleStep: p.sale_step ?? 1,
    })
    setImagePreview(p.image_url || null)
    setImageFile(null)
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
    setImageFile(null)
    setImagePreview(null)
    setError('')
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this product? This cannot be undone.')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) setError(error.message)
    else loadProducts()
  }

  async function handleRestock(id) {
    const qty = Number(restockQty)
    if (!Number.isFinite(qty) || qty <= 0) return
    const product = products.find((p) => p.id === id)
    const conversion = Number(product?.units_per_purchase || 1)
    const addedBase = qty * conversion
    await supabase.from('products').update({ stock_quantity: Number(product?.stock_quantity || 0) + addedBase }).eq('id', id)
    setRestockingId(null)
    setRestockQty('')
    loadProducts()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setUploading(true)

    try {
      let image_url = editingId ? undefined : null
      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const fileName = `${crypto.randomUUID()}.${ext}`
        const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, imageFile)
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName)
        image_url = urlData.publicUrl
      }

      const payload = {
        name: form.name,
        category: form.category,
        cost_price: form.costPrice ? parseFloat(form.costPrice) : 0,
        price: parseFloat(form.price),
        stock_quantity: Number(form.stock || '0'),
        reorder_level: Number(form.reorderLevel || '10'),
        base_unit: form.baseUnit || 'unit',
        purchase_unit: form.purchaseUnit || form.baseUnit || 'unit',
        units_per_purchase: Number(form.unitsPerPurchase || 1),
        purchase_cost: form.purchaseCost === '' ? null : Number(form.purchaseCost),
        sale_unit: form.saleUnit || form.baseUnit || 'unit',
        sale_step: Number(form.saleStep || 1),
        barcode: form.barcode || null,
        expiry_date: form.expiryDate || null,
      }
      if (image_url !== undefined) payload.image_url = image_url

      if (editingId) {
        const { error: updateError } = await supabase.from('products').update(payload).eq('id', editingId)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from('products').insert(payload)
        if (insertError) throw insertError
      }

      cancelForm()
      loadProducts()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div className="content">
      {scanning && <BarcodeScanner onScan={handleScanResult} onClose={() => setScanning(false)} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Products</h2>
        <button className="btn-secondary" onClick={() => (showForm ? cancelForm() : setShowForm(true))}>
          {showForm ? 'Cancel' : '+ Add product'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
          <div className="image-upload-box">
            {imagePreview && <img src={imagePreview} className="image-preview" alt="preview" />}
            <input type="file" accept="image/*" onChange={handleFileChange} />
            <p style={{ fontSize: 12, color: '#6b6357', margin: '4px 0 0' }}>Optional — add a photo of the item</p>
          </div>
          <div className="field">
            <label>Name</label>
            <input value={form.name} onChange={(e) => setField('name', e.target.value)} required />
          </div>
          <div className="field">
            <label>Category</label>
            <input value={form.category} onChange={(e) => setField('category', e.target.value)} />
          </div>
          <div className="field">
            <label>Barcode</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={form.barcode} onChange={(e) => setField('barcode', e.target.value)} placeholder="Scan or type" style={{ flex: 1 }} />
              <button type="button" className="btn-secondary" onClick={() => setScanning(true)}>Scan</button>
            </div>
          </div>
          <div className="field">
            <label>Buying price / cost (KES)</label>
            <input type="number" step="0.01" value={form.costPrice} onChange={(e) => setField('costPrice', e.target.value)} />
          </div>
          <div className="field">
            <label>Selling price (KES)</label>
            <input type="number" step="0.01" value={form.price} onChange={(e) => setField('price', e.target.value)} required />
          </div>
          <div className="field">
            <label>Base / dispensing unit</label>
            <input value={form.baseUnit} onChange={(e) => setField('baseUnit', e.target.value)} placeholder="tablet, capsule, bottle, piece" />
            <small style={{ color: '#6b6357' }}>The smallest unit used to track stock.</small>
          </div>
          <div className="field">
            <label>Purchase unit</label>
            <input value={form.purchaseUnit} onChange={(e) => setField('purchaseUnit', e.target.value)} placeholder="box, strip, bottle" />
          </div>
          <div className="field">
            <label>Base units in one purchase unit</label>
            <input type="number" min="0.01" step="0.01" value={form.unitsPerPurchase} onChange={(e) => setField('unitsPerPurchase', e.target.value)} />
            <small style={{ color: '#6b6357' }}>Example: 1 box = 100 tablets, enter 100.</small>
          </div>
          <div className="field">
            <label>Purchase cost per {form.purchaseUnit || 'unit'} (KES)</label>
            <input type="number" min="0" step="0.01" value={form.purchaseCost} onChange={(e) => setField('purchaseCost', e.target.value)} placeholder="Optional" />
          </div>
          <div className="field">
            <label>Selling unit</label>
            <input value={form.saleUnit} onChange={(e) => setField('saleUnit', e.target.value)} placeholder="tablet, capsule, bottle" />
          </div>
          <div className="field">
            <label>Smallest sale quantity</label>
            <input type="number" min="0.01" step="0.01" value={form.saleStep} onChange={(e) => setField('saleStep', e.target.value)} />
            <small style={{ color: '#6b6357' }}>Use 0.25 for quarter, 0.5 for half, or 1 for whole units.</small>
          </div>
          <div className="field">
            <label>Opening stock ({form.baseUnit || 'base units'})</label>
            <input type="number" min="0" step="0.01" value={form.stock} onChange={(e) => setField('stock', e.target.value)} />
          </div>
          <div className="field">
            <label>Low stock alert level</label>
            <input type="number" value={form.reorderLevel} onChange={(e) => setField('reorderLevel', e.target.value)} />
          </div>
          <div className="field">
            <label>Expiry date</label>
            <input type="date" value={form.expiryDate} onChange={(e) => setField('expiryDate', e.target.value)} />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn-primary" type="submit" disabled={uploading}>
            {uploading ? 'Saving...' : editingId ? 'Update product' : 'Save product'}
          </button>
        </form>
      )}

      {products.map((p) => {
        const expired = p.expiry_date && p.expiry_date < todayStr
        const lowStock = !expired && p.stock_quantity > 0 && p.stock_quantity <= (p.reorder_level ?? 10)
        return (
          <div key={p.id}>
            <div className="product-card">
              {p.image_url ? <img src={p.image_url} alt={p.name} /> : <div className="product-thumb-placeholder">No photo</div>}
              <div className="product-info">
                <div className="name">
                  {p.name}{' '}
                  {expired && <span className="expired-badge">EXPIRED</span>}
                  {lowStock && <span className="expired-badge" style={{ color: '#a0680a' }}>LOW STOCK</span>}
                  {p.stock_quantity <= 0 && <span className="expired-badge">OUT OF STOCK</span>}
                </div>
                <div className="meta">{p.category || 'Uncategorized'} • Sell KES {p.price}/{p.sale_unit || p.base_unit || 'unit'} • Stock: {p.stock_quantity} {p.base_unit || 'units'} • 1 {p.purchase_unit || 'unit'} = {p.units_per_purchase || 1} {p.base_unit || 'units'}</div>
                {p.expiry_date && <div className="meta">Expires: {p.expiry_date}</div>}
              </div>
              <div className="product-actions">
                <button className="icon-btn" onClick={() => setRestockingId(restockingId === p.id ? null : p.id)} title="Restock">📦</button>
                {isAdmin && (
                  <>
                    <button className="icon-btn" onClick={() => startEdit(p)} title="Edit">✏️</button>
                    <button className="icon-btn" onClick={() => handleDelete(p.id)} title="Delete">🗑️</button>
                  </>
                )}
              </div>
            </div>
            {restockingId === p.id && (
              <div style={{ display: 'flex', gap: 8, padding: '0 0 12px' }}>
                <input
                  type="number"
                  step="0.01"
                  placeholder={`Quantity in ${p.purchase_unit || 'purchase units'}`}
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  style={{ flex: 1, padding: 8, border: '1px solid #d9d3c7', borderRadius: 6 }}
                />
                <button className="btn-primary" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => handleRestock(p.id)}>Add</button>
              </div>
            )}
          </div>
        )
      })}
      {products.length === 0 && !showForm && <p style={{ color: '#6b6357' }}>No products yet. Add your first one.</p>}
    </div>
  )
}
