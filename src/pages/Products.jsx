import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import BarcodeScanner from './BarcodeScanner'

export default function Products() {
  const [products, setProducts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [barcode, setBarcode] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)

  async function loadProducts() {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts(data || [])
  }

  useEffect(() => {
    loadProducts()
  }, [])

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function handleScanResult(decodedText, err) {
    setScanning(false)
    if (decodedText) setBarcode(decodedText)
    else if (err) setError(err)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setUploading(true)

    let image_url = null
    try {
      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const fileName = `${crypto.randomUUID()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, imageFile)
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName)
        image_url = urlData.publicUrl
      }

      const { error: insertError } = await supabase.from('products').insert({
        name,
        category,
        cost_price: costPrice ? parseFloat(costPrice) : 0,
        price: parseFloat(price),
        stock_quantity: parseInt(stock || '0', 10),
        barcode: barcode || null,
        image_url,
      })
      if (insertError) throw insertError

      setName(''); setCategory(''); setCostPrice(''); setPrice(''); setStock(''); setBarcode('')
      setImageFile(null); setImagePreview(null)
      setShowForm(false)
      loadProducts()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="content">
      {scanning && (
        <BarcodeScanner onScan={handleScanResult} onClose={() => setScanning(false)} />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Products</h2>
        <button className="btn-secondary" onClick={() => setShowForm(!showForm)}>
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
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field">
            <label>Category</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div className="field">
            <label>Barcode</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Scan or type" style={{ flex: 1 }} />
              <button type="button" className="btn-secondary" onClick={() => setScanning(true)}>Scan</button>
            </div>
          </div>
          <div className="field">
            <label>Buying price / cost (KES)</label>
            <input type="number" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
          </div>
          <div className="field">
            <label>Selling price (KES)</label>
            <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
          </div>
          <div className="field">
            <label>Stock quantity</label>
            <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn-primary" type="submit" disabled={uploading}>
            {uploading ? 'Saving...' : 'Save product'}
          </button>
        </form>
      )}

      {products.map((p) => (
        <div className="product-card" key={p.id}>
          {p.image_url ? (
            <img src={p.image_url} alt={p.name} />
          ) : (
            <div className="product-thumb-placeholder">No photo</div>
          )}
          <div className="product-info">
            <div className="name">{p.name}</div>
            <div className="meta">{p.category || 'Uncategorized'} • Sell KES {p.price} • Cost KES {p.cost_price || 0} • Stock: {p.stock_quantity}</div>
          </div>
        </div>
      ))}
      {products.length === 0 && !showForm && <p style={{ color: '#6b6357' }}>No products yet. Add your first one.</p>}
    </div>
  )
}
