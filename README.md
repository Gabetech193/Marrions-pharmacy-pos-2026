# Marrions Pharmacy 2026

A fresh pharmacy POS app with product photo upload, built on React/Vite + Supabase.

## What's included
- Staff sign-in / sign-up (Supabase Auth). **The first person to sign up becomes Admin automatically; everyone after that joins as Cashier.**
- **Roles**: Admin can access everything (Dashboard, Products, Customers, Services, Vendors, Settings, Sales). Cashier only sees the Sales screen. An Admin can promote/demote staff from Settings → Staff & roles.
- Bottom navigation bar (icons + labels), scrollable if it doesn't all fit.
- Marrions Pharmacy logo shown on the login screen and top bar
- **Dashboard** (Admin only): total sales, profit, cost of goods sold, and stock value (cost & retail) for Today / Week / Month / a custom date range, a daily sales chart, and a notice listing any expired medicines
- Products page (Admin only can add/edit/delete; visible to Admin): photo, buying price, selling price, barcode (type or scan), and **expiry date** — expired items are blocked from being sold and flagged on the dashboard
- **Barcode scanning**: on Sales, tap "📷 Scan item" to scan a barcode and add that product to the cart; on Products, tap "Scan" while adding/editing an item
- Sales page (everyone): cart-based checkout, blocks expired items, reduces stock automatically, then shows a printable receipt watermarked with the logo and pulling the pharmacy name/address from Settings
- Customers, Services, Vendors pages (Admin only)
- **Settings** (Admin only): edit pharmacy name & address (used in the top bar and on receipts), and manage staff roles

Note: camera scanning needs HTTPS (Vercel provides this automatically) and the browser will ask for camera permission the first time you scan.

## Supabase project (already created for you)
- Project name: marrions-pharmacy-2026
- URL: https://exuepxjcqqqnukjujooi.supabase.co
- Tables: profiles, products (with image_url, cost_price, barcode, expiry_date), customers, sales, sales_items, services, vendors, pharmacy_settings
- Storage bucket: product-images (public read, authenticated upload)

## If you already created a staff account before this update
The "first signup becomes Admin" logic only applies to brand-new signups. If you already signed up earlier, your account defaulted to the old "staff" role, which the new admin check won't recognize. Run this once in the Supabase SQL Editor (replace the email):

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'your@email.com');
```

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
