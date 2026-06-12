# Best Mart Step-by-Step Developer Walkthrough

This is the practical onboarding path for a new developer or AI agent. Read it in order when you need to understand where everything happens in the Best Mart project.

For the full architecture reference, see `AI_PROJECT_DOCUMENTATION.md`.

## Step 1: Understand the Product

Best Mart is a Dubai-focused ecommerce app.

The app has two big sides:

1. Storefront for customers.
2. Admin console for store operators.

The storefront lets customers:

- Browse products.
- Filter by category, brand, color, price, rating, search, sort, and tag.
- View product details.
- Select product color and size.
- Add products to cart.
- Checkout as guest or logged-in user.
- Choose Dubai/UAE shipping area and delivery slot.
- Pay with cash on delivery or Stripe when configured.
- Track orders.
- Manage account/profile/orders if logged in.

The admin console lets admins:

- See dashboard metrics and notifications.
- Add/edit/delete products.
- Add color and size stock rows.
- Manage categories.
- Manage banners.
- Manage orders and print invoices.
- Manage reviews.
- Manage coupons.
- Manage users.
- Manage store settings, shipping, VAT/TRN, SEO, and currency rates.
- Export sales CSV.

## Step 2: Know the Main Folder Roles

Start with these folders:

- `app/`: Next.js pages and API routes.
- `app/[locale]/`: all localized UI pages.
- `app/api/`: server API endpoints.
- `components/`: React UI components.
- `components/admin/`: admin UI.
- `components/cart/`: cart and checkout UI.
- `components/product/`: product UI and filters.
- `components/layout/`: public header, footer, frame, WhatsApp button.
- `lib/`: server logic, auth, payment, email, validation, data mapping.
- `store/`: browser localStorage Zustand stores.
- `utils/`: currency and shipping helpers.
- `prisma/`: database schema and seed.
- `public/locales/`: English and Arabic translation files.
- `scripts/`: local dev and admin helper scripts.

## Step 3: Run the Project Locally

Install dependencies:

```bash
npm install
```

Generate Prisma client:

```bash
npm run db:generate
```

Push schema to the configured database:

```bash
npm run db:push
```

Seed local data:

```bash
npm run db:seed
```

Start dev server:

```bash
npm run dev
```

Default local URL:

```text
http://localhost:3002/en
```

Why port 3002? `scripts/dev-server.js` sets default port `3002`, stops stale Next processes, clears `.next/cache`, then starts Next.

## Step 4: Read the App from the Outside In

Read files in this order:

1. `README.md`: short summary and commands.
2. `AI_PROJECT_DOCUMENTATION.md`: full architecture reference.
3. `prisma/schema.prisma`: database source of truth.
4. `app/[locale]/layout.tsx`: global localized HTML, fonts, settings, frame.
5. `components/layout/AppFrame.tsx`: public header/footer/WhatsApp wrapper.
6. `components/layout/Header.tsx`: navigation, search, currency, notifications, cart link.
7. `app/[locale]/page.tsx`: homepage sections.
8. `app/[locale]/shop/page.tsx`: product listing and filters.
9. `app/[locale]/product/[id]/page.tsx`: product detail route, metadata, schema.
10. `components/product/ProductDetail.tsx`: color/size/image/cart behavior.
11. `components/cart/CheckoutPageContent.tsx`: checkout form and payment selection.
12. `lib/orders.ts`: order creation, stock, coupon, VAT, shipping.
13. `components/admin/AdminShell.tsx`: admin navigation layout.
14. `app/[locale]/admin/dashboard/page.tsx`: admin overview.
15. `components/admin/AdminProductCreateForm.tsx`: add product page.

This order gives the fastest mental model of the project.

## Step 5: Follow the Customer Journey

Open these routes in the browser:

```text
/en
/en/shop
/en/product/<product-slug-or-id>
/en/cart
/en/checkout
/en/order-confirmation/<order-id>?token=<access-token>
/en/track-order
/en/account
```

What to observe:

- Header appears on storefront pages, not admin pages.
- Homepage shows hero, trust section, categories, featured, and new arrivals.
- Shop filters update query params.
- Product detail changes image when color is selected.
- Size choices depend on the selected color.
- Add to cart stores data in browser localStorage.
- Checkout can work without login.
- Checkout requires address, tower, apartment, emirate, delivery slot, payment method.
- COD places order directly.
- Stripe uses `/api/payment/checkout` and either inline Payment Element or hosted checkout.

## Step 6: Follow the Admin Journey

Open these routes:

```text
/en/admin/dashboard
/en/admin/products
/en/admin/products/new
/en/admin/categories
/en/admin/banners
/en/admin/orders
/en/admin/reviews
/en/admin/coupons
/en/admin/users
/en/admin/settings
```

What to observe:

- Admin pages require a user with role `ADMIN`.
- Admin shell has sidebar links and top action buttons.
- Dashboard separates catalog, orders, customers/promos, and storefront controls.
- Notifications show pending orders and low stock.
- Add product page is a step-based product launch form.
- Orders page can update status and print invoice details.
- Settings controls store identity, shipping, VAT/TRN, SEO, and currency.

## Step 7: Understand the Database

The schema is in `prisma/schema.prisma`.

Most important models:

- `User`: customers and admins.
- `Category`: product categories.
- `Product`: main product record.
- `ProductImage`: product gallery.
- `ProductVariant`: color, size, image, SKU, and stock row.
- `ProductSpecification`: product facts.
- `Order`: order header, customer, address, payment, status, totals.
- `OrderItem`: purchased product/variant snapshot.
- `Review`: customer reviews.
- `Coupon`: discount codes.
- `Banner`: homepage hero slides.
- `Setting`: global store settings.

Important rule:

- Product price is stored in AED.
- Display currency conversion happens in UI utilities.

## Step 8: Understand Product Variants

Files:

- `components/admin/AdminProductCreateForm.tsx`
- `lib/product-size-presets.ts`
- `lib/validations/admin.ts`
- `lib/storefront.ts`
- `components/product/ProductDetail.tsx`
- `store/cart-store.ts`

Admin creates variants as stock rows:

- Color EN
- Color AR
- Color hex
- Size preset or custom size
- Size EN
- Size AR
- Variant image
- Variant SKU
- Stock
- Sort order
- Active flag

Storefront behavior:

- One product can have many variants.
- Color buttons are unique by color.
- Size buttons are filtered by selected color.
- Variant image becomes active image when selected.
- Cart stores selected variant id and variant label.
- Order stores variant snapshot.

Category size presets:

- Burka/abaya/modest categories use length sizes.
- Shoes use EU sizes.
- Clothing uses XS to 3XL.
- Beauty/perfume uses ml sizes.
- Electronics/home/gifts often use one size.

## Step 9: Understand Checkout and Orders

Files:

- `components/cart/CheckoutPageContent.tsx`
- `lib/validations/store.ts`
- `lib/orders.ts`
- `app/api/orders/route.ts`
- `app/api/payment/checkout/route.ts`
- `lib/payment-gateways.ts`

Checkout form builds a payload with:

- Cart items.
- Shipping address.
- Apartment and tower.
- Emirate.
- Delivery slot.
- Payment method.
- Currency.
- Locale.
- Coupon code.
- Notes.

Manual payment path:

1. User selects COD.
2. Checkout posts to `/api/orders`.
3. Server validates payload.
4. Server creates order through `createStoreOrder`.
5. Server sends email/SMS/WhatsApp if configured.
6. Cart clears.
7. User goes to order confirmation.

Stripe payment path:

1. User selects Stripe.
2. Checkout posts to `/api/payment/checkout`.
3. Server validates payload.
4. Server creates order and reserves stock.
5. Server creates a Stripe PaymentIntent or Stripe hosted checkout URL.
6. Browser shows inline card form or redirects to Stripe checkout.
7. Stripe webhook updates payment/order status.

## Step 10: Understand Stock Rules

Stock is managed in order transactions.

When an order is created:

- Product and variant availability are checked.
- If product has variants, a variant must be selected.
- Variant stock is decremented.
- Product stock is also decremented to keep aggregate inventory aligned.

When an order is cancelled:

- `updateOrderStatus` restores stock if `stockRestored` is false.
- `stockRestored` prevents double restore.

When a cancelled order is reactivated:

- `updateOrderStatus` tries to reserve stock again.
- If stock is no longer available, the update fails.

## Step 11: Understand Notifications

Storefront notification files:

- `components/layout/Header.tsx`
- `app/api/settings/route.ts`

Storefront notifications include:

- Store announcement.
- Dubai delivery.
- Free shipping threshold.
- Cart reminder.

Dismiss behavior:

- Dismissed notification ids are saved in browser localStorage.
- Key: `best-mart-dismissed-notifications:${locale}`.
- Same notification will not come back after dismiss.
- If notification content changes, it gets a new id and can appear again.

Admin notification files:

- `components/admin/AdminShell.tsx`
- `app/[locale]/admin/layout.tsx`
- `app/[locale]/admin/dashboard/page.tsx`

Admin notifications include:

- Pending order count.
- Low stock count on dashboard.

Message notification files:

- `lib/email.ts`
- `lib/notifications.ts`

These send email/SMS/WhatsApp if env is configured.

## Step 12: Understand Payments

Files:

- `lib/payment-gateways.ts`
- `lib/stripe.ts`
- `app/api/payment/checkout/route.ts`
- `app/api/payment/webhook/route.ts`

Payment availability uses admin settings with env fallback:

- Stripe needs Stripe env vars.
- COD is enabled unless `COD_ENABLED` is `"false"`.

The UI should show only configured COD/Stripe methods and avoid rendering unsupported payment methods.

## Step 13: Understand Settings

Files:

- `prisma/schema.prisma` model `Setting`
- `app/[locale]/admin/settings/page.tsx`
- `components/admin/AdminSettingsForm.tsx`
- `app/api/admin/settings/route.ts`
- `app/api/settings/route.ts`
- `app/[locale]/layout.tsx`
- `components/layout/Header.tsx`

Settings control:

- Store name.
- Logo.
- Contact email/phone/WhatsApp.
- TRN and VAT rate.
- Store address.
- Social links.
- Announcement.
- Currency conversion rates.
- Free shipping threshold.
- Emirate shipping rates.
- SEO title/description/OG image.
- Google Analytics and Facebook Pixel IDs.

Public layout caches frame settings for 60 seconds.

## Step 14: Understand Caching

Main cache file:

- `lib/storefront.ts`

Most storefront reads use `unstable_cache` with 60 second revalidation.

This means:

- Admin changes might not appear instantly on storefront.
- Wait up to 60 seconds or add cache invalidation if immediate refresh is required.

If adding cache invalidation later, update admin mutation routes with `revalidateTag()` or `revalidatePath()`.

## Step 15: Common Change Recipes

### Add a New Product Field

1. Add field to `prisma/schema.prisma`.
2. Run `npm run db:generate`.
3. Run `npm run db:push`.
4. Add validation in `lib/validations/admin.ts`.
5. Add UI in `components/admin/AdminProductCreateForm.tsx`.
6. Map field in `lib/storefront.ts`.
7. Update `lib/types.ts`.
8. Show it in `components/product/ProductDetail.tsx` or `ProductCard.tsx`.

### Add a Checkout Address Field

1. Add field to `Order` in `prisma/schema.prisma`.
2. Update `lib/validations/store.ts`.
3. Update `components/cart/CheckoutPageContent.tsx`.
4. Save it in `lib/orders.ts`.
5. Show it in order confirmation/admin order page/email/invoice if needed.

### Add a New Payment Provider

1. Add provider enum in `prisma/schema.prisma`.
2. Update `lib/validations/store.ts`.
3. Update checkout UI payment option in `components/cart/CheckoutPageContent.tsx`.
4. Add availability and checkout creation in `lib/payment-gateways.ts`.
5. Update `/api/payment/checkout`.
6. Add webhook/callback route if provider needs it.
7. Test unavailable-env and configured-env paths.

### Add a New Admin Section

1. Create page under `app/[locale]/admin/<section>/page.tsx`.
2. Add nav item in `components/admin/AdminShell.tsx`.
3. Add API route under `app/api/admin/...`.
4. Use `requireAdmin()` in the API.
5. Add validation schema in `lib/validations/admin.ts` if accepting input.

### Change Homepage Order or Sections

1. Edit `app/[locale]/page.tsx`.
2. Use existing `SectionHeader`, `ProductCard`, and `HeroSlider` patterns.
3. Keep category section before featured if preserving current requirement.
4. Check mobile layout.

### Change Header Notifications

1. Edit `components/layout/Header.tsx`.
2. Add notification object with stable `id`, `title`, `detail`, and `href`.
3. Include content in `id` if changed content should show again after dismiss.
4. Use `visibleNotifications` for badge counts.

## Step 16: Testing Before Commit

Always run:

```bash
npm run type-check
npm run lint
```

For production confidence, also run:

```bash
npm run build
```

Manual smoke paths:

```text
http://localhost:3002/en
http://localhost:3002/en/shop
http://localhost:3002/en/cart
http://localhost:3002/en/checkout
http://localhost:3002/en/admin/dashboard
```

For checkout changes, test:

- Empty cart.
- Product without variants.
- Product with color/size variants.
- Coupon valid.
- Coupon invalid.
- COD order.
- Stripe payment error when provider env/admin keys are missing.

For admin changes, test:

- Dashboard loads.
- Add product form works.
- Product color and size rows save.
- Product detail shows selected color image.
- Order status update works.
- Invoice print targets only invoice area.

## Step 17: Commit and Push

The requested workflow is to push after steps.

Use:

```bash
git status --short
git add <files>
git commit -m "Meaningful message"
git push
git status --short
```

Do not commit secrets.

Do not revert unrelated changes made by the user.

## Step 18: Fast Debug Map

Use this when something breaks:

- Hydration mismatch: check localStorage/Zustand usage and `useHydrated`.
- Slow storefront update after admin edit: check 60 second cache in `lib/storefront.ts`.
- Dev server repeatedly stops: check `scripts/dev-server.js`, stale processes, and `.next/cache`.
- Product image not showing: check allowed hosts in `next.config.mjs` and `lib/images.ts`.
- Product color image not switching: check `ProductVariant.imageUrl`, `mapStoreProduct`, and `ProductDetail`.
- Size options wrong: check `lib/product-size-presets.ts` and selected category slug/name.
- Checkout validation error: check `lib/validations/store.ts` and payload from `CheckoutPageContent`.
- Stock issue: check `lib/orders.ts` and `lib/order-status.ts`.
- Admin access denied: check user role, NextAuth session, middleware, and `requireAdmin`.
- Payment unavailable: check env variables and `getPaymentAvailability`.
- Email not sent: check `EMAIL_SERVER` and `EMAIL_FROM`.
- SMS/WhatsApp not sent: check Twilio env vars.
- Notification returns after dismiss: check notification `id` and localStorage key in `Header.tsx`.

## Step 19: Minimum Mental Model

If a developer has only five minutes, remember this:

1. UI routes live under `app/[locale]`.
2. Admin API routes must call `requireAdmin()`.
3. Prisma schema is the database source of truth.
4. Storefront products are mapped through `lib/storefront.ts`.
5. Cart and preferences are Zustand localStorage stores.
6. Checkout order creation is centralized in `lib/orders.ts`.
7. Payment availability is centralized in `lib/payment-settings.ts`; Stripe provider logic is in `lib/payment-gateways.ts`.
8. Product color/size/image behavior is mostly `ProductVariant` plus `ProductDetail`.
9. Store settings control shipping, VAT, currency, SEO, announcement, and contact data.
10. Storefront cache is 60 seconds.
