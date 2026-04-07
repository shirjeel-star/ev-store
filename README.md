# VoltStore — EV Ecommerce Platform

A production-ready, full-stack ecommerce platform for EV charging products (NEMA Splitters, Level 2 EV Chargers, and accessories). Built with Next.js, Node.js/Express, PostgreSQL, Stripe, and SendGrid.

---

## Architecture

```
ev-store/
├── backend/          # Node.js + Express + Prisma API
├── frontend/         # Next.js 14 (App Router) + Tailwind CSS
├── docker-compose.yml
└── .env.example
```

---

## Quick Start (Local Development)

### Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- Redis >= 6
- Stripe account
- SendGrid account (or SMTP)

### 1. Clone & Setup

```bash
git clone <repo-url>
cd ev-store
cp .env.example .env   # fill in your secrets
```

### 2. Backend Setup

```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
# API runs at http://localhost:4000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# App runs at http://localhost:3000
```

---

## Environment Variables

See `.env.example` in the root, `backend/.env.example`, and `frontend/.env.local.example`.

---

## API Reference

Base URL: `http://localhost:4000/api`

### Auth
- `POST /auth/register` — register user
- `POST /auth/login` — login, returns JWT
- `POST /auth/refresh` — refresh access token
- `POST /auth/logout` — invalidate refresh token

### Products
- `GET /products` — list products (filterable)
- `GET /products/:slug` — product detail
- `GET /products/:id/reviews` — product reviews
- `POST /products/:id/reviews` — submit review (auth)

### Cart
- `GET /cart` — get cart
- `POST /cart/items` — add item
- `PATCH /cart/items/:id` — update qty
- `DELETE /cart/items/:id` — remove item
- `DELETE /cart` — clear cart

### Orders
- `POST /orders` — create order / checkout
- `GET /orders` — list user orders (auth)
- `GET /orders/:id` — order detail (auth)

### Payments
- `POST /payments/intent` — create Stripe PaymentIntent
- `POST /payments/webhook` — Stripe webhook handler

### Partners
- `POST /partners/apply` — submit partner application
- `GET /partners/dashboard` — partner stats (auth partner)
- `GET /partners/referrals` — partner referrals

### Admin
- `GET /admin/dashboard` — analytics summary
- Full CRUD on all resources under `/admin/*`

---

## Deployment

### Docker (Recommended)

```bash
docker-compose up -d
```

### Manual Deployment

**Backend** — Deploy to Railway, Render, or EC2:
```bash
cd backend
npm run build  # if using TypeScript
npm start
```

**Frontend** — Deploy to Vercel:
```bash
cd frontend
npx vercel --prod
```

**Database** — Use Supabase, Railway Postgres, or managed RDS.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14. Tailwind CSS, Zustand, TanStack Query |
| Backend | Node.js, Express, Prisma ORM |
| Database | PostgreSQL |
| Cache | Redis |
| Auth | JWT (access + refresh tokens) |
| Payments | Stripe |
| Email | SendGrid / Nodemailer |
| Storage | Cloudinary (media uploads) |
| Deployment | Vercel (frontend) + Railway/Render (backend) |
