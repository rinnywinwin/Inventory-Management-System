# CSEB5233 Inventory Management System

A cloud-deployed inventory dashboard for managing products and stock levels, built for the **CSEB5233 Designing Applications on Cloud** project.

🔗 **Live app:** https://inventory-management-system-cloudclass.vercel.app

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14.x-black?style=for-the-badge&logo=nextdotjs" alt="Next.js">
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=for-the-badge&logo=supabase" alt="Supabase">
  <img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel" alt="Vercel">
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript">
</p>

---

## 👥 Team

| Name | Role |
| :--- | :--- |
| Nurin | Cloud & Deployment (Vercel, CI/CD, environment configuration) |
| Aliya | Database & Application (Supabase schema, RLS, features) |

---

## ✨ Features

- **Product management:** add, view, edit and delete products
- **Product photos:** upload JPEG, PNG, or WebP images directly to Supabase Storage (up to 5 MB)
- **Stock movements:** stock in/out with notes, timestamps, balances, and per-product history
- **Search and export:** search names/categories, filter by category, and export the matching inventory to CSV
- **Stock status badges:** In Stock, Low Stock and Out of Stock, colour-coded
- **API layer:** Next.js API routes between the frontend and the database
- **Responsive UI:** works on desktop, tablet and mobile

---

## ☁️ Cloud Architecture

```
User (browser)
     │
     ▼
Vercel ── Next.js frontend + API routes (serverless functions)
     │
     ▼
Supabase ── PostgreSQL database (Row Level Security enabled)

GitHub (main branch) ──push──▶ Vercel auto build & deploy (CI/CD)
```

| Service | Purpose |
| :--- | :--- |
| **GitHub** | Source code and version control |
| **Vercel** | Hosting, serverless API routes, automatic CI/CD and preview deployments |
| **Supabase** | Managed PostgreSQL database with Row Level Security |

> The project was originally planned for Google Cloud Platform. Due to a billing issue, deployment was moved to Vercel with the lecturer's approval.

---

## 🗄️ Database

Table `products`:

| Column | Type |
| :--- | :--- |
| `id` | UUID (primary key) |
| `name` | text |
| `price` | numeric(10,2) |
| `quantity` | integer |
| `category` | text |
| `image_url` | text (nullable) |
| `created_at` | timestamp with time zone |

---

## 🌐 API Endpoints

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/products` | List all products |
| `POST` | `/api/products` | Add a product |
| `PUT` | `/api/products/[id]` | Update a product |
| `DELETE` | `/api/products/[id]` | Delete a product |
| `GET` | `/api/stock-movements?product_id=UUID` | Latest 100 movements for a product |
| `POST` | `/api/stock-movements` | Record stock in/out atomically |

---

## 🚀 Deployment

1. Create a Supabase project and run the `products` table SQL in the SQL Editor, together with an RLS policy that lets the app read and write.
2. Import this repository into Vercel.
3. Add these environment variables in **Vercel → Settings → Environment Variables**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-publishable-key
   ```
4. Deploy. Every push to `main` then redeploys automatically, and pull requests get their own preview URL.

### Run locally

```bash
npm install
# create .env.local with the two variables above
npm run dev
```

Then open http://localhost:3000.

---

## 🙏 Credits

Based on the open-source [Inventory-Management-System](https://github.com/AaryaRai01/Inventory-Management-System) by AaryaRai01, used under the MIT License.

## Set up images and stock movements

For an existing installation, run [the migration](supabase/migrations/202611220001_inventory_features.sql) once in **Supabase Dashboard → SQL Editor** before using the updated app. It assumes the existing products table described above and its existing read/write RLS policies. No extra environment variables or service-role key are required.

The migration adds products.image_url, creates stock_movements, installs stock auditing and an atomic stock movement function, and creates a public product-images bucket with upload policies and 5 MB JPEG/PNG/WebP restrictions. The policies follow this app's existing anonymous-access model: visitors can upload images and record stock movements. Product photos are publicly viewable. Add authentication and restrict policies before using this for private inventory.

Each stock movement stores id, product_id, product_name, movement_type (in/out), quantity, balance_after, notes, and created_at. New products with opening stock and subsequent quantity changes are recorded automatically; existing quantities are kept and historical activity before the migration is not reconstructed. Deleting a product preserves its movement history with its name and a null product_id. The dashboard displays the latest 100 movements for each existing product.

Use **Stock in / out** on a product to adjust quantity. Product editing changes details and photos; quantity adjustments use the movement form. Stock out cannot exceed available quantity, and concurrent movements lock the product row inside one database transaction. Notes are optional (up to 1,000 characters).

Search matches product names and categories without regard to case. The category dropdown narrows the results. **Export CSV** downloads the currently matching products, including image URLs; values are escaped and spreadsheet formulas are neutralized.

Images upload from the browser directly into Storage when a product is saved. Replacing/removing a photo changes the database URL; old files are retained in Storage. A failed product save can leave an unused uploaded image, so unused files can be reviewed in the Supabase dashboard.

After applying the migration, verify: add a product with a photo and opening quantity; replace the photo; record stock in and out; confirm the balance/history; attempt an excessive stock out; search/filter and export CSV. Existing database rows must have nonnegative quantities for the migration constraint to succeed.

### Improved stock workflow

Open **Stock in / out** beside a product. Choose the movement type, enter a whole quantity, and check the projected balance before saving. Select a reason and optionally enter notes or an order/delivery reference. The reason is saved with the notes in the existing stock_movements table; no additional migration is required. Successful saves show the database-confirmed balance and refresh history while keeping the dialog open for another movement. Close the dialog to refresh the inventory table.

Movement history supports stock in/out filtering and searching reasons/references within the latest 100 records. Timestamps use Malaysia time. The form prevents invalid quantities and repeated submissions while saving; the database continues to enforce stock availability atomically.
