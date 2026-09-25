# Marrions Pharmacy POS – PWA / Offline-First Build

This build is prepared for PWA testing and later packaging with PWABuilder.

## Offline-first behavior

After the app has been opened while online and the signed-in user's data has loaded, the app keeps a local IndexedDB copy of the main application data. The following areas are designed to work while offline:

- Dashboard data
- Sales and sales items
- Products and stock changes
- Customers
- Services
- Vendors
- Purchase orders and order items
- Expenses
- Pharmacy settings and staff-role changes

New inserts, updates, and deletes made while offline are written to the phone immediately and placed in a sync queue. When connectivity returns, the queue is sent to Supabase automatically.

The app displays an offline banner while disconnected and a sync banner while pending changes are being synchronized.

### Important test requirement

Before testing airplane/offline mode for the first time, open the app while online and allow the data to load. This creates the local working copy. Authentication still needs to have been established while online so the existing Supabase session is available on the phone.

File/image uploads can be previewed and retained locally while offline. Cloud storage upload should be tested while online before publishing.

Staff account creation through the server function remains an online-only operation because it creates a real authentication account on Supabase.
