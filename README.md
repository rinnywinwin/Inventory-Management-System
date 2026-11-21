# CSEB5233 Inventory Management System

A cloud-deployed inventory dashboard for managing products and stock levels, built for the **CSEB5233 Designing Applications on Cloud** project.

🔗 **Live app:** https://inventory-management-system-sage-kappa.vercel.app

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
| `created_at` | timestamp with time zone |

---

## 🌐 API Endpoints

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/products` | List all products |
| `POST` | `/api/products` | Add a product |
| `PUT` | `/api/products/[id]` | Update a product |
| `DELETE` | `/api/products/[id]` | Delete a product |

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
