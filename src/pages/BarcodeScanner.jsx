import { useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

export default function BarcodeScanner({ onScan, onClose }) {
  const containerId = 'barcode-scanner-region'
  const scannerRef = useRef(null)

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId)
    scannerRef.current = scanner
    let isRunning = false

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          if (isRunning) {
            isRunning = false
            scanner.stop().catch(() => {})
            onScan(decodedText)
          }
        },
        () => {} // ignore per-frame scan failures
      )
      .then(() => {
        isRunning = true
      })
      .catch((err) => {
        onScan(null, err?.message || 'Could not access camera')
      })

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 60, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#fff', fontSize: 14 }}>Point camera at barcode</span>
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
      </div>
      <div id={containerId} style={{ flex: 1 }} />
    </div>
  )
}
