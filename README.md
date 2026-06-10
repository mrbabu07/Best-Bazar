# Best Bazar

Best Bazar is a Dubai-focused bilingual ecommerce application built with Next.js 14, TypeScript, Tailwind CSS, Prisma, Neon PostgreSQL, NextAuth, Cloudinary uploads, Stripe checkout support, optional SMTP email, and Zustand cart/preferences state.

For a full AI/developer handoff guide, see [AI_PROJECT_DOCUMENTATION.md](./AI_PROJECT_DOCUMENTATION.md).

## Current Features

- Localized storefront routes for English and Arabic with RTL support.
- Database-backed home, shop, product, cart, checkout, account, and order-confirmation pages.
- Product search, category/brand/rating/price filters, related products, customer reviews, and review submission.
- Persistent cart, coupon validation, dynamic shipping rules, AED/BDT/USD currency conversion, COD, bank transfer, Stripe wallets/cards, Tabby, Tamara, and PayPal checkout when configured.
- Customer registration, login, editable profile/address details, order history, password reset, protected account pages, and private order-confirmation links.
- Admin dashboard for products, categories, banners, coupons, orders, users, settings, uploads, order status changes, role/ban controls, and invoice printing.
- Store settings for branding, announcements, contact details, social links, SEO, shipping rates, and exchange rates.
- Cloudinary image uploads and optional order/password-reset emails through SMTP.
- SEO routes for `robots.txt` and resilient `sitemap.xml` generation.

## Tech Stack

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

Open `http://localhost:3000/en`.

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
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` for card, Apple Pay, and Google Pay through Stripe Checkout
- `TABBY_SECRET_KEY`, `TABBY_MERCHANT_CODE`, and optional `TABBY_API_BASE_URL` for Tabby hosted checkout
- `TAMARA_API_TOKEN` and optional `TAMARA_API_BASE_URL` for Tamara hosted checkout
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and optional `PAYPAL_API_BASE_URL` for PayPal checkout
- `COD_ENABLED`, `BANK_TRANSFER_ENABLED`, and `BANK_TRANSFER_INSTRUCTIONS` for manual Dubai payment methods
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

- Configure Stripe, Tabby, Tamara, and PayPal provider keys before enabling live online payments.
- Configure SMTP if password-reset and order-confirmation emails should be sent in production.
- Set `NEXT_PUBLIC_SITE_URL` and `NEXTAUTH_URL` to the deployed domain.
- Keep `.env`, `.env.local`, and all provider secrets out of git.
