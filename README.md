# Marrions Pharmacy 2026

A fresh pharmacy POS app with product photo upload, built on React/Vite + Supabase.

## What's included
- Staff sign-in / sign-up (Supabase Auth — no plaintext passwords this time)
- Marrions Pharmacy logo shown on the login screen and top bar
- **Dashboard**: total sales, profit, cost of goods sold, and stock value (both at cost and retail) for Today / This Week / This Month / a custom date range, plus a daily sales chart
- Products page: add products with a photo, buying price, selling price, and barcode (type it or scan it with the camera)
- **Barcode scanning**: on the Sales page, tap "📷 Scan item" to scan a product's barcode with the phone camera and add it straight to the cart
- Sales page: cart-based checkout, reduces stock automatically, then shows a printable receipt with the logo as a watermark
- Customers page: view records
- Services page: log the services your pharmacy offers (with starter suggestions)
- Vendors page: track medicine suppliers (with a few known Kenyan distributors as starter suggestions — verify current contacts before ordering)

Note: camera scanning needs the site to be served over HTTPS (Vercel does this automatically) and the browser will ask for camera permission the first time you tap Scan.

## Supabase project (already created for you)
- Project name: marrions-pharmacy-2026
- URL: https://exuepxjcqqqnukjujooi.supabase.co
- Tables: profiles, products (with image_url), customers, sales, sales_items, services, vendors
- Storage bucket: product-images (public read, authenticated upload)

## Deploy steps (from your phone)

1. **Upload this whole folder to a new GitHub repo** called `marrions-pharmacy-2026`
   (GitHub web → New repository → "uploading an existing file" → select all files, keeping the folder structure).

2. **Create a new Vercel project**
   - Go to vercel.com → Add New → Project → Import the `marrions-pharmacy-2026` repo.
   - Framework preset: Vite.
   - Add Environment Variables (values are in `.env.example` in this folder):
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - Deploy.

3. **Create your first staff account** — once deployed, open the app, tap "Create one" on the sign-in screen, and sign up with your email/password. That becomes your first staff login.

That's it — no manual SQL needed, the database and storage bucket are already set up.
