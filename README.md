# Marrions Pharmacy 2026

A fresh pharmacy POS app with product photo upload, built on React/Vite + Supabase.

## What's included
- Staff sign-in (Supabase Auth). **There is no self-signup anymore** — an Admin creates every login (including cashier accounts) from Settings → Staff & roles, using a secure Supabase Edge Function so the sensitive service key never sits in the browser code.
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
- Customers (Admin): add, edit, and delete records.
- Services (Admin): add, edit, and delete, with an optional photo per service — shown on the Sales screen too.
- Vendors (Admin): add, edit, and delete.
- **Orders**: now also editable and deletable from the Past Orders list, not just viewable.
- **Receipt**: shows Amount Paid and either Change (if overpaid) or Balance Due (if underpaid), based on what you enter at checkout — leave it blank to assume paid in full.
- **Scan sounds**: a short beep on a successful scan, a different low buzz if the camera fails or a scanned barcode doesn't match any product.
- **Receipt footer**: editable from Settings (defaults to "We treat but God heals").
- **Sales**: now lists Services below Products, so you can sell a consultation, vaccination, etc. alongside items. Cart is shown at the top of the screen instead of the bottom.
- **Dashboard**: adds a "Services sold" count, and the expense card is labeled "Cash left after expenses" (total sales revenue minus everything logged in Expenses — it does not include cost of goods, that's covered separately by Gross/Net profit). Cards now use distinct colors per metric for easier scanning at a glance.
- **Receipts** now show "You were served by [staff name]" and a scannable QR code encoding the receipt number, customer, total, and staff name.
- Settings (Admin): pharmacy name, address, logo, receipt footer, and creating/managing staff logins. An admin can't accidentally change their own role away from Admin (that's what caused the earlier lockout) — only another admin can do that.

Note: camera scanning needs HTTPS (Vercel provides this automatically) and the browser will ask for camera permission the first time you scan. WhatsApp sending opens web.whatsapp.com or the WhatsApp app with the message pre-filled — you still tap Send yourself.

## Supabase project (already created for you)
- Project name: marrions-pharmacy-2026
- URL: https://exuepxjcqqqnukjujooi.supabase.co
- Tables: profiles, products (with image_url, cost_price, barcode, expiry_date, reorder_level), customers, sales (with created_by), sales_items (with created_by), services, vendors, pharmacy_settings (with logo_url), purchase_orders, purchase_order_items, expenses
- Storage bucket: product-images (public read, authenticated upload)

## One-time database step for this update
Run this once in your Supabase SQL Editor (Supabase dashboard → SQL Editor → New query) before using the "Amount paid" feature — I couldn't reach Supabase directly this round:

```sql
alter table public.sales add column if not exists amount_paid numeric(12,2);
```

## Works on desktop too
This is a responsive web app, not a native mobile app — the same URL works in any browser. The layout widens and centers itself on tablet/desktop screens instead of staying a narrow mobile column, and receipts/invoices/dashboard cards adapt to the extra space.

## Bootstrapping a brand-new deployment
If you ever set up a fresh Supabase project for this app with zero accounts, there's a chicken-and-egg problem: Settings (where you'd create staff) is Admin-only, but no one is Admin yet. In that case, come back and ask for help creating the very first admin — it's a one-line SQL command against the new project.

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
