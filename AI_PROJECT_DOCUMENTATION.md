# Best Mart AI Project Documentation

Last updated: 2026-06-10

This document is written for future AI agents and developers. It explains what the project is, how the pieces fit together, and where to change things without having to rediscover the whole repository.

For an ordered first-day walkthrough, read `DEVELOPER_STEP_BY_STEP.md` first, then use this file as the deeper reference.

## 1. Project Summary

Best Mart is a Dubai-focused bilingual ecommerce app built with Next.js 14 App Router. It supports English and Arabic storefront pages, admin management, product variants by color and size, guest checkout, Dubai delivery controls, cash on delivery, Stripe card payments, order tracking, invoices, notifications, and SEO.

The main product goal is to behave like a real Dubai ecommerce store:

- Customer storefront in English and Arabic.
- Shop filters by category, brand, color, rating, price, search, sort, and tag.
- Product cards and product detail pages with variant-aware images, color choices, size choices, SKU, and stock.
- Cart stored in browser localStorage.
- Checkout with guest checkout, apartment/tower fields, shipping area dropdown, delivery slot selection, coupons, VAT support, cash on delivery, and Stripe card payment.
- Account area for logged-in users.
- Order confirmation and public/private order tracking.
- Admin console for products, categories, banners, orders, reviews, coupons, users, settings, sales export, invoice print, and notifications.

## 2. Tech Stack

- Framework: Next.js 14 App Router
- Language: TypeScript
- UI: React 18, Tailwind CSS, lucide-react icons, react-hot-toast
- Database: PostgreSQL through Prisma
- Auth: NextAuth credentials login, optional Google OAuth
- State: Zustand with localStorage persistence
- Uploads: Cloudinary
- Payments: Stripe Checkout/Payment Element and cash on delivery
- Email: Nodemailer SMTP
- SMS/WhatsApp: Twilio-compatible API calls
- Deployment assumptions: env-driven, no secrets committed

## 3. Important Commands

Run from the repository root.

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Quality checks:

```bash
npm run type-check
npm run lint
npm run build
```

Database/admin helpers:

```bash
npm run db:studio
npm run admin:ensure
```

The custom dev script is `scripts/dev-server.js`. It defaults to port `3002`, stops stale Next dev processes for this repo, clears `.next/cache`, writes a pid file in the OS temp folder, then starts Next.

To use a different port:

```bash
$env:PORT="3003"; npm run dev
```

## 4. Environment Variables

Do not commit real secrets. `.env` and `.env*.local` are ignored by git.

Core:

- `DATABASE_URL`: PostgreSQL connection string.
- `NEXTAUTH_SECRET`: NextAuth signing secret.
- `NEXTAUTH_URL`: canonical app URL for auth callbacks.
- `NEXT_PUBLIC_SITE_URL`: public site URL for order links, SEO, payment returns.
- `PORT`: optional local dev port. Default is `3002`.

Seed and admin bootstrap:

- `SEED_ADMIN_PASSWORD`: required by `npm run db:seed`.
- `SEED_USER_PASSWORD`: required by `npm run db:seed`.
- `ADMIN_EMAIL`: used by `npm run admin:ensure`.
- `ADMIN_PASSWORD`: used by `npm run admin:ensure`.
- `ADMIN_NAME`: optional, used by `npm run admin:ensure`.

Auth:

- `GOOGLE_CLIENT_ID`: enables Google login when set with secret.
- `GOOGLE_CLIENT_SECRET`: enables Google login when set with client id.

Cloudinary:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Stripe:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

Manual payments:

- `COD_ENABLED`: set to `"false"` to disable COD. COD is enabled by default.

Email:

- `EMAIL_SERVER`: Nodemailer connection string or transport URL.
- `EMAIL_FROM`: sender address.

SMS/WhatsApp notifications:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_SMS_FROM`
- `TWILIO_WHATSAPP_FROM`
- `ADMIN_ORDER_NOTIFICATION_PHONE`: optional admin recipient for order notifications.

## 5. Repository Map

Important top-level areas:

- `app/`: Next.js App Router pages and API routes.
- `app/[locale]/`: localized storefront and admin pages. Valid locales are `en` and `ar`.
- `components/layout/`: public layout frame, header, footer, WhatsApp quick button.
- `components/home/`: homepage hero slider.
- `components/product/`: product cards, filters, detail page UI, reviews, add-to-cart behavior.
- `components/cart/`: cart and checkout client UI.
- `components/account/`: profile/order account UI.
- `components/admin/`: admin shell, dashboard widgets, managers, create product form, print button.
- `lib/`: business logic, Prisma helpers, auth, emails, payments, storefront data mapping, validation schemas.
- `utils/`: currency, shipping, className helper.
- `store/`: Zustand cart and preference stores.
- `hooks/`: hydration helpers.
- `prisma/`: Prisma schema and seed script.
- `public/locales/`: translation JSON for English and Arabic.
- `scripts/`: dev server and admin bootstrap scripts.

## 6. Routing Model

All normal UI routes are locale-prefixed:

- `/en/...`
- `/ar/...`

`middleware.ts` redirects non-localized paths to the preferred locale based on `NEXT_LOCALE` cookie, defaulting to English.

Middleware also protects:

- Account routes: login required.
- Admin routes: admin role required.

The admin layout repeats the role check server-side in `app/[locale]/admin/layout.tsx`.

## 7. Customer Pages

Main customer-facing routes:

- `/:locale`: homepage.
- `/:locale/shop`: product listing with filters.
- `/:locale/product/:id`: product detail by slug or id.
- `/:locale/cart`: cart page.
- `/:locale/checkout`: checkout page.
- `/:locale/order-confirmation/:id`: order confirmation page, usually with `?token=...`.
- `/:locale/track-order`: order tracking form.
- `/:locale/account`: authenticated customer account and order history.
- `/:locale/login`: login page.
- `/:locale/forgot-password`: password reset request.
- `/:locale/reset-password`: password reset confirmation.
- `/:locale/privacy`: privacy page.
- `/:locale/terms`: terms page.

Homepage structure in `app/[locale]/page.tsx`:

1. `HeroSlider` from active banners.
2. Trust section: COD, fast Dubai delivery, secure payment, return support.
3. Shop by category.
4. Featured products.
5. New arrivals.

Shop page behavior in `app/[locale]/shop/page.tsx`:

- Reads filters from query string.
- Fetches categories, brands, variant colors, and products in parallel.
- Product grid is `grid-cols-2` on mobile and expands on larger screens.
- Uses `ProductFilters` and `ProductCard`.

Product detail behavior in `components/product/ProductDetail.tsx`:

- Chooses the first available variant by default.
- Color tap changes the selected variant.
- Variant image becomes the first gallery image when a color has `imageUrl`.
- Size options are filtered to the selected color.
- Add to cart stores product and selected variant data.

## 8. Admin Pages

Admin routes:

- `/:locale/admin` redirects/lands under admin.
- `/:locale/admin/dashboard`: metrics, notifications, quick actions, control groups.
- `/:locale/admin/products`: product list and product management.
- `/:locale/admin/products/new`: dedicated professional add product page.
- `/:locale/admin/categories`: category management.
- `/:locale/admin/banners`: homepage banner management.
- `/:locale/admin/orders`: order management, status update, invoice print.
- `/:locale/admin/reviews`: review approval/moderation.
- `/:locale/admin/coupons`: coupon management.
- `/:locale/admin/users`: user role/status management.
- `/:locale/admin/settings`: store settings, SEO, shipping, currency, VAT/TRN, social/contact details.

`components/admin/AdminShell.tsx` owns the admin layout:

- Left sidebar navigation.
- Storefront link.
- Locale switch.
- Notification button showing pending orders.
- Logout.

`app/[locale]/admin/dashboard/page.tsx` owns:

- Monthly revenue.
- Total orders.
- Pending orders.
- Delivered orders.
- Active product count.
- Low stock count.
- Recent orders.
- 12-day revenue chart.
- Control groups for catalog, orders, customers/promos, storefront.

Invoice printing:

- `components/admin/AdminPrintButton.tsx` toggles `body.admin-printing`.
- Print CSS is in `app/globals.css`.
- Only `.admin-print-target` stays visible during print.
- `.admin-print-hide` is hidden.
- `.admin-print-block` becomes visible.

## 9. API Route Map

Auth:

- `GET/POST /api/auth/[...nextauth]`: NextAuth.
- `POST /api/auth/register`: account registration.
- `POST /api/auth/password-reset/request`: request password reset email.
- `POST /api/auth/password-reset/confirm`: confirm reset token and password.

Storefront/catalog:

- `GET /api/categories`: active categories.
- `GET /api/products`: products.
- `GET /api/products/:id`: product by id.
- `POST /api/products/:id/reviews`: submit review.
- `GET /api/settings`: live settings used by the header notification refresh.
- `POST /api/coupons/validate`: validate coupon against subtotal.

Orders and payments:

- `GET /api/orders`: current user orders.
- `POST /api/orders`: create cash-on-delivery orders only.
- `POST /api/payment/checkout`: create Stripe checkout/payment-intent orders only.
- `POST /api/payment/webhook`: Stripe webhook for completed/expired checkout.
- `POST /api/orders/track`: order tracking lookup.
- `POST /api/account/orders/:id/cancel`: customer order cancellation for allowed statuses.
- `PUT /api/account/profile`: profile update.

Admin:

- `GET/POST /api/admin/products`
- `GET/PUT/DELETE /api/admin/products/:id`
- `POST /api/admin/products/duplicate/:id`
- `GET/POST /api/admin/categories`
- `GET/PUT/DELETE /api/admin/categories/:id`
- `POST /api/admin/categories/reorder`
- `GET/POST /api/admin/banners`
- `GET/PUT/DELETE /api/admin/banners/:id`
- `POST /api/admin/banners/reorder`
- `GET/POST /api/admin/coupons`
- `GET/PUT/DELETE /api/admin/coupons/:id`
- `GET /api/admin/orders`
- `GET/PUT/DELETE /api/admin/orders/:id`
- `PUT /api/admin/orders/:id/status`
- `GET /api/admin/users`
- `GET/DELETE /api/admin/users/:id`
- `PUT /api/admin/users/:id/role`
- `PUT /api/admin/users/:id/status`
- `GET /api/admin/users/:id/orders`
- `GET/PUT /api/admin/settings`
- `GET /api/admin/stats`
- `GET/PUT /api/admin/reviews`
- `GET/PUT/DELETE /api/admin/reviews/:id`
- `GET /api/admin/reports/sales`: CSV export.

Uploads:

- `POST /api/upload`: admin-only Cloudinary image upload.

Admin API helpers are in `lib/api/admin.ts`.

## 10. Database Model Summary

Prisma schema is `prisma/schema.prisma`.

Enums:

- `UserRole`: `USER`, `ADMIN`
- `PaymentMethod`: Prisma enum still contains legacy values, but checkout validation currently accepts only `STRIPE` and `COD`.
- `PaymentStatus`: `PENDING`, `PAID`, `FAILED`
- `OrderStatus`: `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`
- `DiscountType`: `PERCENT`, `FIXED`

Main models:

- `User`: customer/admin profile, auth credentials, role, ban flag, address fields.
- `Account`, `Session`, `VerificationToken`: NextAuth storage.
- `Category`: bilingual name, slug, image, active flag, sort order, optional parent category.
- `Product`: bilingual name/description, SEO fields, category, price, base stock, SKU, brand, tags, active/featured flags, rating/review count.
- `ProductImage`: product gallery image.
- `ProductVariant`: color, optional size, optional variant image, optional variant SKU, stock, active flag, sort order.
- `ProductSpecification`: bilingual product facts.
- `Order`: customer details, guest/user link, address, apartment/tower, emirate, delivery slot, payment data, subtotal/shipping/discount/VAT/total, access token.
- `OrderItem`: snapshot of purchased product/variant name, color, SKU, image, price, quantity.
- `Review`: customer review with approval flag.
- `Coupon`: code, percent/fixed discount, minimum order, max uses, expiry.
- `Banner`: homepage hero slide content/images.
- `Setting`: store name, logo, contact, WhatsApp, TRN, VAT, announcements, currency rates, shipping rates, SEO, analytics IDs.

## 11. Product and Variant Rules

Source files:

- `components/admin/AdminProductCreateForm.tsx`
- `lib/validations/admin.ts`
- `lib/product-size-presets.ts`
- `lib/storefront.ts`
- `components/product/ProductDetail.tsx`
- `store/cart-store.ts`

Variant model:

- Each variant row can represent one color plus optional size.
- Each variant can have its own image, SKU, stock, color hex, and active flag.
- Product detail uses variant image when selected.
- Cart line id is `productId:variantId` when a variant exists.
- Order item stores the variant snapshot so old orders still show correct labels if product data changes later.

Stock behavior:

- Admin product create/update calculates `Product.stock` from active variant stock if variants exist.
- Storefront `mapStoreProduct` also sums active variant stock for display.
- Checkout validates and decrements variant stock and product stock.
- Cancelled orders restore stock once through `stockRestored`.
- Reactivating a cancelled order tries to reserve stock again.

Size presets:

- `lib/product-size-presets.ts` picks sizes from category slug/name.
- Burka, burqa, abaya, jilbab, khimar, kaftan, modest: length sizes from `Length 50` to `Length 62`.
- Shoes: EU 36 to EU 46.
- Fashion/clothing: XS to 3XL.
- Kids/baby: age sizes.
- Rings/jewelry: US ring sizes.
- Beauty/perfume: ml sizes.
- Electronics/home/watch/bag/accessory/gift: one size.
- Custom size is available in the add product form.

## 12. Cart and Checkout Flow

Source files:

- `store/cart-store.ts`
- `components/cart/CartPageContent.tsx`
- `components/cart/CheckoutPageContent.tsx`
- `lib/validations/store.ts`
- `lib/orders.ts`
- `utils/shipping.ts`
- `utils/currency.ts`

Cart:

- Zustand store name: `best-mart-cart`.
- Persisted in browser localStorage.
- Stores product snapshot, variant snapshot, image, price, stock, quantity.
- Hydration is guarded with `useHydrated` to avoid server/client mismatch.

Checkout:

- Guest checkout is allowed.
- Logged-in checkout links order to `userId` when a valid session exists.
- Required address fields include name, email, phone, street, building/tower, apartment/villa number, city, emirate, country.
- Shipping area is selected from store settings.
- Dubai delivery slot options are more specific; other emirates use standard/evening slots.
- Coupon validation uses `/api/coupons/validate`.
- Payment method chooses whether to use `/api/orders` or `/api/payment/checkout`.

`createStoreOrder` in `lib/orders.ts`:

1. Merges duplicate line items.
2. Loads active products and active variants.
3. Requires a valid variant if a product has variants.
4. Checks stock.
5. Reads `store-settings`.
6. Calculates shipping from emirate and free shipping threshold.
7. Validates coupon and reserves coupon use.
8. Calculates total and VAT included amount.
9. Creates order and order items in a transaction.
10. Decrements stock.
11. Increments coupon use.

VAT:

- VAT settings live in `Setting.trn`, `Setting.vatRate`.
- `vatAmount` is calculated as VAT included in total, not added on top.
- Invoice and emails include VAT when amount is greater than zero.

## 13. Payment Flow

Source files:

- `components/cart/CheckoutPageContent.tsx`
- `lib/payment-gateways.ts`
- `app/api/payment/checkout/route.ts`
- `app/api/payment/webhook/route.ts`
- `lib/stripe.ts`

Payment method behavior:

- COD creates order through `/api/orders`.
- Stripe creates order through `/api/payment/checkout`.
- Stripe orders reserve stock before redirect/payment confirmation.
- Stripe webhook marks completed sessions as `CONFIRMED` and `PAID`.
- Stripe expired sessions mark order as `CANCELLED` and `FAILED`.

Payment availability:

- `getPaymentAvailability()` in `lib/payment-settings.ts` checks admin settings/env fallback for Stripe and COD.
- Checkout UI only renders enabled/configured COD and Stripe methods.
- Online payment endpoint returns `503` when Stripe is not configured.

## 14. Notifications

Storefront notification bell:

- Source: `components/layout/Header.tsx`.
- Shows store announcement, Dubai delivery, free shipping, and cart reminder.
- Settings refresh from `/api/settings` every 15 seconds.
- Dismissed notifications are persisted in localStorage with key `best-mart-dismissed-notifications:${locale}`.
- Notification IDs include content values, so a changed announcement/threshold/delivery setting can appear again as a new notification.
- Notification card click navigates to the related page.
- X button dismisses only that notification.

Admin notifications:

- Source: `components/admin/AdminShell.tsx` and admin dashboard.
- Pending order count is calculated in `app/[locale]/admin/layout.tsx`.
- Header bell links to `/:locale/admin/orders?status=PENDING`.
- Dashboard also shows pending orders and low stock products.

Email:

- Source: `lib/email.ts`.
- Sends order confirmation, order status update, and password reset.
- Requires `EMAIL_SERVER` and `EMAIL_FROM`.
- If not configured, functions return a not-sent result instead of failing the order.

SMS/WhatsApp:

- Source: `lib/notifications.ts`.
- Uses Twilio REST API.
- Sends customer order created/status messages.
- Optionally sends admin SMS/WhatsApp when `ADMIN_ORDER_NOTIFICATION_PHONE` is configured.

## 15. SEO and Metadata

Source files:

- `app/[locale]/product/[id]/page.tsx`
- `app/sitemap.ts`
- `app/robots.ts`
- `lib/storefront.ts`
- `prisma/schema.prisma`

Product SEO:

- Product has meta title, meta description, and Open Graph image fields.
- Product page `generateMetadata` uses product-specific SEO fields first, then falls back to product name/description/images.
- Product page injects JSON-LD Product schema with name, description, SKU, brand, image, offer, availability, and aggregate rating when available.

Store SEO:

- Store settings include meta title/description, OG image, Google Analytics ID, Facebook Pixel ID.
- `sitemap.ts` reads active products.
- `robots.ts` exposes basic crawler rules.

## 16. Caching and Freshness

Storefront data is cached with `unstable_cache` in `lib/storefront.ts`.

Cached data:

- Categories
- Brands
- Variant colors
- Product listings
- Featured products
- New arrivals
- Active banners
- Product detail
- Product reviews
- Related products
- Sitemap products

The cache revalidates every 60 seconds.

Frame settings in `app/[locale]/layout.tsx` are also cached for 60 seconds with tag `settings`.

Important implication:

- Admin edits may take up to 60 seconds to appear on the storefront.
- If a future task needs instant storefront updates, add `revalidateTag()` or `revalidatePath()` to the admin mutation routes.

## 17. Images and Uploads

Source files:

- `lib/images.ts`
- `lib/cloudinary.ts`
- `app/api/upload/route.ts`
- `next.config.mjs`

Allowed remote image hosts in Next config:

- `images.unsplash.com`
- `res.cloudinary.com`

Cloudinary upload:

- Admin-only.
- POSTs a `file` field to `/api/upload`.
- Optional `folder` field defaults to `best-mart/uploads`.
- Returns Cloudinary public id, secure URL, dimensions, format, and bytes.

If adding another external image host, update both `next.config.mjs` and any validation/safety rules in `lib/images.ts`.

## 18. Authentication and Authorization

Source files:

- `lib/auth.ts`
- `types/next-auth.d.ts`
- `middleware.ts`
- `app/[locale]/admin/layout.tsx`
- `lib/api/admin.ts`

Auth behavior:

- Credentials login checks email/password with bcrypt.
- Banned users cannot log in.
- Google OAuth is available only when Google env vars exist.
- JWT session stores `id` and lowercase `role`.
- Session callback exposes `session.user.id` and `session.user.role`.

Protection:

- Middleware protects localized and non-localized admin/account paths.
- Admin layout redirects non-admin users to login with callback URL.
- Admin API routes call `requireAdmin()`.

Admin bootstrap:

- `npm run admin:ensure` creates or updates an admin using env vars.

## 19. Internationalization

Source files:

- `lib/i18n.ts`
- `public/locales/en/common.json`
- `public/locales/ar/common.json`
- `app/[locale]/layout.tsx`
- `middleware.ts`

Locales:

- English: `en`
- Arabic: `ar`

The layout sets:

- `lang`
- `dir="rtl"` for Arabic
- Inter font for English
- Cairo font for Arabic

Best practice:

- Put reusable labels in locale JSON when possible.
- Some admin/storefront labels are currently hardcoded in components. When changing them, update both English and Arabic paths if needed.

## 20. Styling and UX Rules Already Used

General patterns:

- Tailwind CSS utility classes.
- Cards usually use `rounded-lg` or `rounded-md`, soft borders, and `shadow-soft`.
- Buttons use shared `components/ui/Button.tsx` where possible.
- Icons come from lucide-react.
- Mobile grids often use `grid-cols-2` for product/category cards.
- `BackButton` is used on pages where the user requested back navigation.
- Admin UI is split into separate management areas instead of one giant dashboard.

Global styles:

- `app/globals.css`
- Print-specific CSS lives there.
- Body background is a subtle light ecommerce background.

## 21. Important Business Rules

Product visibility:

- Storefront shows only active products and active categories.
- Storefront variant color filters include only active variants with stock greater than zero.

Order status:

- Customer can cancel only pending/confirmed orders.
- Cancelled order restores stock once.
- Reactivating a cancelled order reserves stock again.

Coupon:

- Code is uppercase.
- Must be active, not expired, under max use, and subtotal must meet minimum order.
- Discount can be percent or fixed.

Shipping:

- Free shipping if subtotal is zero or subtotal is above/equal free shipping threshold.
- Otherwise, shipping rate is selected by emirate.
- Default rates are in `utils/shipping.ts`.

Currency:

- Internal prices are AED.
- Display conversion supports AED, BDT, USD.
- Rates come from store settings and are stored in Zustand preferences.

Notifications:

- Storefront dismissed notifications stay dismissed for the same locale until the notification content changes.

## 22. Common Change Locations

Add or edit product fields:

- Database: `prisma/schema.prisma`
- Admin validation: `lib/validations/admin.ts`
- Admin create/edit UI: `components/admin/AdminProductCreateForm.tsx` and product manager components
- Storefront mapping: `lib/storefront.ts`
- Product type: `lib/types.ts`
- Product detail/card UI: `components/product/`

Change checkout fields:

- UI: `components/cart/CheckoutPageContent.tsx`
- Validation: `lib/validations/store.ts`
- Order create: `lib/orders.ts`
- Prisma model: `prisma/schema.prisma`
- Email/invoice output: `lib/email.ts` and admin orders page

Change payment providers:

- Availability: `lib/payment-settings.ts`
- Checkout UI: `components/cart/CheckoutPageContent.tsx`
- Checkout API: `app/api/payment/checkout/route.ts`
- Webhooks: `app/api/payment/webhook/route.ts`

Change admin navigation:

- `components/admin/AdminShell.tsx`
- Admin route page under `app/[locale]/admin/...`

Change storefront header/footer/settings:

- Header: `components/layout/Header.tsx`
- Footer: `components/layout/Footer.tsx`
- Frame: `components/layout/AppFrame.tsx`
- Settings page/form: `app/[locale]/admin/settings/page.tsx`, `components/admin/AdminSettingsForm.tsx`
- Settings API: `app/api/admin/settings/route.ts`

Change size presets:

- `lib/product-size-presets.ts`

Change shipping rates:

- Admin settings page for database-backed values.
- Defaults in `utils/shipping.ts`.
- Checkout display in `components/cart/CheckoutPageContent.tsx`.

Change translations:

- `public/locales/en/common.json`
- `public/locales/ar/common.json`
- Some hardcoded strings may also need component edits.

## 23. Testing Checklist for Future AI

Before committing a meaningful change:

```bash
npm run type-check
npm run lint
```

For schema changes:

```bash
npm run db:generate
npm run db:push
```

For checkout/order changes, manually test:

- Add product with no variant.
- Add product with color/size variant.
- Cart quantity update.
- Guest checkout.
- COD order.
- Stripe payment route returns a client secret or checkout URL when configured.
- Coupon valid and invalid paths.
- Stock decrement after order.
- Stock restore after cancellation.

For admin changes, manually test:

- Login as admin.
- Admin dashboard loads.
- Add product.
- Edit product.
- Add color/size stock row.
- Upload image if Cloudinary is configured.
- Update order status.
- Print invoice.
- Export sales CSV.

For storefront changes, manually test:

- `/en`
- `/en/shop`
- `/en/product/:slug`
- `/en/cart`
- `/en/checkout`
- `/en/track-order`
- Arabic equivalent route when relevant.
- Mobile width for product cards and checkout forms.

## 24. Known Implementation Notes

- Dev server default URL is usually `http://localhost:3002`, not `3000`.
- Storefront cache is 60 seconds, so admin edits might not appear immediately.
- Do not paste database URLs, provider keys, API tokens, or passwords into docs or committed files.
- Product and order money values come from Prisma Decimal in the database but are converted to numbers/JSON for UI.
- Several API routes use `JSON.parse(JSON.stringify(...))` to serialize Prisma Decimal/Date values.
- `useHydrated` is important for Zustand localStorage state to avoid hydration mismatch.
- The current public header notification system is client-side and browser-specific because dismiss state is saved in localStorage.
- Some Arabic text can look garbled in PowerShell output depending on encoding, even when files are saved correctly.

## 25. Git Workflow Note

The user asked to push changes after steps. For documentation or feature work, use this pattern:

```bash
git status --short
npm run type-check
npm run lint
git add <changed-files>
git commit -m "Clear commit message"
git push
git status --short
```

Do not revert unrelated user changes. If the worktree is dirty, inspect before editing and only commit your own changes.
