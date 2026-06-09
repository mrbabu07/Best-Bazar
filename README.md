# Best Bazar

Best Bazar is a Dubai-focused ecommerce frontend built with Next.js 14, TypeScript, Tailwind CSS, Zustand, bilingual locale routing, RTL support, and multi-currency pricing.

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

Backend/API, MongoDB models, NextAuth, Stripe, Cloudinary, and email sending are planned for the next phase.

## Tech Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Zustand
- lucide-react
- react-hot-toast
- next-i18next-compatible locale assets

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
```

## Environment

Copy `.env.example` to `.env.local` when backend integrations begin, then fill in MongoDB, NextAuth, Google OAuth, Cloudinary, Stripe, and email credentials.
