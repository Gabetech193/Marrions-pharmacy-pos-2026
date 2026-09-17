# Marrions Pharmacy 2026

A fresh pharmacy POS app with product photo upload, built on React/Vite + Supabase.

## What's included
- Staff sign-in / sign-up (Supabase Auth). **The first person to sign up becomes Admin automatically; everyone after that joins as Cashier.**
- **Roles**: Admin sees Dashboard, Sales, Products, Customers, Services, Vendors, Settings. Cashier sees Sales, their own "My Sales" dashboard, and can add Products (but not edit/delete them, and not view Customers/Services/Vendors/Settings).
- Bottom navigation bar (icons + labels), scrollable if it doesn't all fit.
- **Logo**: shown on login and the top bar, and watermarked on receipts. Editable anytime from Settings → upload a new logo image (stored in Supabase, so it no longer depends on the static file bundled in the repo).
- **Dashboard**: Admin gets full financials — total sales, profit, cost of goods sold, stock value (cost & retail), a daily sales chart, and an expired-medicines notice — for Today / Week / Month / a custom range. Cashier gets "My Sales" — just their own total sales and item count for the same date ranges, with no cost/profit figures.
- **Sales list with delete**: both dashboards list the sales in the selected period. Cashiers can delete their own sales (stock is restored); Admins can delete any sale.
- Products: photo, buying price, selling price, barcode (type or scan), expiry date. Anyone logged in can add a product; only Admin can edit or delete one. Expired items can't be sold and are flagged on the Admin dashboard.
- **Barcode scanning**: on Sales, tap "📷 Scan item" to scan a barcode and add that product to the cart; on Products, tap "Scan" while adding/editing an item.
- Sales page: cart-based checkout, blocks expired items, reduces stock automatically, then shows a printable receipt.
- Customers (Admin only): add and delete customer records.
- Services, Vendors (Admin only).
- Settings (Admin only): edit pharmacy name, address, and logo; manage staff roles.

Note: camera scanning needs HTTPS (Vercel provides this automatically) and the browser will ask for camera permission the first time you scan.

## Supabase project (already created for you)
- Project name: marrions-pharmacy-2026
- URL: https://exuepxjcqqqnukjujooi.supabase.co
- Tables: profiles, products (with image_url, cost_price, barcode, expiry_date), customers, sales (with created_by), sales_items (with created_by), services, vendors, pharmacy_settings (with logo_url)
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
