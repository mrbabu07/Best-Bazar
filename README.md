# Best Bazar

Best Bazar is a Dubai-focused bilingual ecommerce application built with React 18 and Next.js 14, TypeScript, Tailwind CSS, Prisma, Neon PostgreSQL, NextAuth, Cloudinary uploads, Stripe checkout support, optional SMTP email, and Zustand cart/preferences state.

For a step-by-step developer walkthrough, see [DEVELOPER_STEP_BY_STEP.md](./DEVELOPER_STEP_BY_STEP.md).
For the full AI/developer handoff reference, see [AI_PROJECT_DOCUMENTATION.md](./AI_PROJECT_DOCUMENTATION.md).

## Current Features

- Localized storefront routes for English and Arabic with RTL support.
- Database-backed home, shop, product, cart, checkout, account, and order-confirmation pages.
- Product search, category/brand/rating/price filters, related products, customer reviews, and review submission.
- Persistent cart, coupon validation, dynamic shipping rules, AED/BDT/USD currency conversion, cash on delivery, and Stripe wallets/cards when configured.
- Customer registration, login, editable profile/address details, order history, password reset, protected account pages, and private order-confirmation links.
- Admin dashboard for products, categories, banners, coupons, orders, users, settings, uploads, order status changes, role/ban controls, and invoice printing.
- Store settings for branding, announcements, contact details, social links, SEO, shipping rates, and exchange rates.
- Cloudinary image uploads and optional order/password-reset emails through SMTP.
- SEO routes for `robots.txt` and resilient `sitemap.xml` generation.

## Tech Stack

- React 18
- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Prisma and Neon PostgreSQL
- NextAuth credentials and optional Google OAuth
- Stripe
- Cloudinary
- Nodemailer
- Zustand
- lucide-react
- react-hot-toast

## Getting Started

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Open `http://localhost:3002/en`.

## Useful Commands

```bash
npm run type-check
npm run lint
npm run build
npm run db:generate
npm run db:push
npm run db:seed
npm run db:studio
npm run admin:ensure
```

## Environment

Copy `.env.example` to `.env.local`, then fill in the values you need:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_SITE_URL`
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` for Google login
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` for uploads
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` for Stripe card, Apple Pay, and Google Pay
- `COD_ENABLED` for cash on delivery
- `EMAIL_SERVER` and `EMAIL_FROM` for order and password-reset emails
- `SEED_ADMIN_PASSWORD` and `SEED_USER_PASSWORD` for local seed accounts
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and optional `ADMIN_NAME` for the admin bootstrap command

For Prisma CLI commands, keep `DATABASE_URL` available in an ignored `.env` file as well.

## Local Admin

The seeded admin email is:

```text
admin@bestbazar.ae
```

The password is read from ignored env as `SEED_ADMIN_PASSWORD`.

To create or reset another admin account without committing credentials, set `ADMIN_EMAIL` and
`ADMIN_PASSWORD` in ignored env, then run:

```bash
npm run admin:ensure
```

## Production Notes

- Neon: use the pooled Neon hostname in `DATABASE_URL`; the Prisma client also upgrades direct Neon hosts to `-pooler` and applies `connection_limit`, `pool_timeout`, and `connect_timeout`. Deploy near Neon `us-east-1` (`iad1` is configured).
- Storefront pages use SSG/ISR and tagged cache invalidation. Admin product/category/banner/review/settings changes revalidate the relevant cache tags.
- Cloudinary uploads are served back with `f_auto,q_auto` delivery transforms, and stored Cloudinary URLs are normalized before rendering.
- Stripe payment UI is loaded as a separate checkout chunk so the heavy Stripe SDK does not block the initial checkout page.
- Payment methods and storefront theme can be managed from Admin Settings. Provider keys stored there are used server-side, with env values as fallback.
- Configure Stripe provider keys before enabling live online payments. Cash on delivery can be toggled from Admin Settings.
- Configure SMTP if password-reset and order-confirmation emails should be sent in production.
- Set `NEXT_PUBLIC_SITE_URL` and `NEXTAUTH_URL` to the deployed domain.
- Keep `.env`, `.env.local`, and all provider secrets out of git.
