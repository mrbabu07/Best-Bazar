# Best Bazar

Best Bazar is a Dubai-focused ecommerce project built with Next.js 14, TypeScript, Tailwind CSS, Zustand, bilingual locale routing, RTL support, multi-currency pricing, and Neon PostgreSQL for the database layer.

## Frontend Status

Completed:

- Localized storefront routes: `/en`, `/ar`, `/shop`, `/product/[id]`, `/cart`, `/checkout`, `/account`
- Responsive sticky header with language switcher, currency switcher, search, account, admin, and cart count
- Home page with Dubai hero imagery, featured products, categories, and new arrivals
- Shop page with category, brand, price, rating, and sort controls
- Product detail page with gallery, quantity stepper, add-to-cart, specs, trust badges, and related products
- Persistent Zustand cart and currency preferences
- Cart page with quantity updates, remove action, coupon UI, and order summary
- Checkout page with shipping form, Stripe/COD payment selection, and summary
- Responsive admin routes: dashboard, products, categories, orders, users, coupons, and settings
- English and Arabic dictionaries in `public/locales`
- SEO metadata routes: `sitemap.xml` and `robots.txt`

Backend/API, NextAuth auth routes, Stripe, Cloudinary, and email sending are planned for the next phase.

## Tech Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Zustand
- lucide-react
- react-hot-toast
- next-i18next-compatible locale assets
- Neon PostgreSQL via `DATABASE_URL`

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000/en`.

## Useful Commands

```bash
npm run type-check
npm run lint
npm run build
npm run db:generate
npm run db:push
npm run db:seed
```

## Environment

Copy `.env.example` to `.env.local`, then fill in Neon PostgreSQL, NextAuth, Google OAuth, Cloudinary, Stripe, and email credentials.

For Prisma CLI commands, also keep `DATABASE_URL` available in an ignored `.env` file. The current Neon schema has been pushed and seeded.

Seeded admin login email for local development:

- Email: `admin@bestbazar.ae`
- Password: set in ignored env as `SEED_ADMIN_PASSWORD`
