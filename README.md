# Marrions Pharmacy 2026

A fresh pharmacy POS app with product photo upload, built on React/Vite + Supabase.

## What's included
- Staff sign-in / sign-up (Supabase Auth). **The first person to sign up becomes Admin automatically; everyone after that joins as Cashier.**
- **Roles**: Admin sees Dashboard, Sales, Products, Orders, Expenses, Customers, Services, Vendors, Settings. Cashier sees Sales, their own "My Sales" dashboard, and can add Products.
- Bottom navigation bar (icons + labels), scrollable if it doesn't all fit.
- **Logo**: editable anytime from Settings → upload a new logo image. Shown on login, top bar, and receipts.
- **Dashboard** (Admin): total sales, gross/net profit (after expenses), cost of goods sold, stock value (cost & retail), a daily sales chart, and notices for expired **and** low-stock medicines, for Today / Week / Month / a custom range. Tap any sale in the list to see exactly what was sold.
- **"My Sales"** (Cashier): same date-range view, just their own totals — no cost/profit numbers.
- **Delete a sale**: from either dashboard — cashiers can delete their own, admins any. Deleting restores stock automatically.
- **Products**: photo, buying price, selling price, barcode (type or scan), expiry date, and a low-stock alert level. Anyone can add or restock (📦 icon); only Admin can edit or delete. Expired or out-of-stock items can't be sold — tapping one shows a clear message.
- **Barcode scanning**: on Sales, tap "📷 Scan item"; on Products, tap "Scan" while adding/editing.
- **Sales**: pick a customer from the existing list (it autocompletes as you type) or type a brand-new name — new customers are saved automatically. Cart blocks out-of-stock/expired items with a clear message, checkout reduces stock and prints a receipt.
- **Orders** (Admin): create a purchase order — pick a vendor, add products with quantity and cost, save to get an invoice you can Print, Save as PDF, or Send via WhatsApp (opens a chat with the vendor's saved phone number, prefilled with the order). Past orders are listed and can be reopened.
- **Expenses** (Admin): log rent, salaries, utilities, etc. by category and date — these feed into the Dashboard's net profit figure.
- Customers (Admin): add and delete records.
- Services, Vendors (Admin).
- Settings (Admin): pharmacy name, address, logo, and staff roles.

Note: camera scanning needs HTTPS (Vercel provides this automatically) and the browser will ask for camera permission the first time you scan. WhatsApp sending opens web.whatsapp.com or the WhatsApp app with the message pre-filled — you still tap Send yourself.

## Supabase project (already created for you)
- Project name: marrions-pharmacy-2026
- URL: https://exuepxjcqqqnukjujooi.supabase.co
- Tables: profiles, products (with image_url, cost_price, barcode, expiry_date, reorder_level), customers, sales (with created_by), sales_items (with created_by), services, vendors, pharmacy_settings (with logo_url), purchase_orders, purchase_order_items, expenses
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
