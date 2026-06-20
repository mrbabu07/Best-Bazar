# Best Mart Project Analysis

**Purpose:** Step 0 architecture audit before adding a fully admin-controlled, Moistreet-inspired homepage. This document describes the application as it exists so the next work extends its established patterns instead of creating a competing implementation.

## 1. Application Structure

- **Framework:** Next.js 14.2 App Router, React 18, TypeScript, Tailwind CSS.
- **Routing:** Locale-prefixed App Router routes live in `app/[locale]`; API route handlers live in `app/api`. There is no active `pages/` application structure.
- **Database:** PostgreSQL through Prisma (`prisma/schema.prisma`), with one shared Prisma client from `lib/prisma.ts`.
- **Major folders:**
  - `app/[locale]`: customer routes and protected admin routes.
  - `app/api`: public and authenticated REST-style route handlers.
  - `components/admin`, `components/home`, `components/product`, `components/layout`, `components/ui`: domain-first reusable components.
  - `lib`: auth, caching, storefront query layer, i18n, media, validation, safe serialization, and settings helpers.
  - `store`: persisted Zustand cart, favourites, and customer preferences.
  - `utils`: currency, shipping, and display normalization.
  - `prisma`: schema and idempotent seed data.

## 2. Existing Database Models

### Product Catalog

`Category` already represents the catalog grouping/collection capability. It has `nameEn`, `nameAr`, unique `slug`, optional `image`, `productType`, JSON `customFields`, `isActive`, `sortOrder`, optional `parentCategoryId`, and self-referencing subcategories.

`Product` is the main commerce entity. It contains bilingual name/description/SEO fields, `shortVideoUrl`, unique `slug` and `sku`, category/subcategory references, AED `price` and optional `comparePrice`, aggregate `stock`, `brand`, string-array `tags`, JSON `fashionFields` and `customFieldValues`, `isActive`, `isFeatured`, rating/review fields, and relationships to images, variants, specifications, order items, and reviews.

`ProductImage` stores `url`, optional `alt`, and `sortOrder`. `ProductVariant` provides the exact color/size implementation already needed by the store: bilingual color, optional `colorHex`, bilingual size/style/fit labels, optional color-specific `imageUrl`, optional variant `sku`, `stock`, `sortOrder`, and `isActive`. `ProductSpecification` stores bilingual key/value rows and sort order.

### Existing Homepage-Relevant Models

`Banner` provides bilingual title, subtitle, button text, button link, desktop/mobile media URLs, `sortOrder`, and `isActive`. It currently powers the hero slider.

`Setting` is a singleton (`id = "store-settings"`) and already owns store name/logo/contact details, social links, announcement bar, currency rates, shipping configuration, courier configuration, payment configuration, visual theme/maintenance settings, SEO metadata, analytics IDs, TRN, and VAT rate. It should remain the single store-settings model.

There is **no `Collection` model** and **no `HomepageSection` model**. Categories are sufficient for collection/category data; the missing piece is an ordered, configurable homepage composition model.

### Other Commerce Models

`User`, `Account`, `Session`, and `VerificationToken` support NextAuth. `Order`/`OrderItem`, `Review`, and `Coupon` cover checkout and customer workflows. Enums include `UserRole`, `PaymentMethod`, `PaymentStatus`, `OrderStatus`, and `DiscountType`.

## 3. Admin Panel and CRUD Pattern

### Routes

Admin routes are under `app/[locale]/admin`:

- `dashboard`, `orders`, `products`, `products/new`, `categories`, `banners`, `coupons`, `reviews`, `users`, and `settings`.
- `app/[locale]/admin/layout.tsx` uses the NextAuth server session, requires the `admin` role, and renders the shared `AdminShell` with cached operational notification counts.

### UI Pattern

- `AdminShell.tsx` owns grouped sidebar navigation and responsive mobile drawer behavior.
- `AdminPageHeader.tsx`, `AdminMetricCard.tsx`, `Button`, `Badge`, and Tailwind utility classes are the established component/style primitives.
- Managers such as `AdminBannerManager.tsx`, `AdminCategoryManager.tsx`, `AdminProductManager.tsx`, and `AdminSettingsForm.tsx` are client-side CRUD forms. They use local React state, `fetch`, `react-hot-toast`, safe JSON parsing, and `router.refresh()` after mutations.
- Images/videos use `AdminImageUploadField.tsx` and `AdminMediaUploadField.tsx`, backed by the authenticated `/api/upload` route and Cloudinary.

### API Pattern

- Admin endpoints are under `app/api/admin/*` and call `requireAdmin()` from `lib/api/admin.ts`.
- Valid input is parsed with Zod schemas in `lib/validations/admin.ts`.
- Handlers return `ok`, `created`, `noContent`, or `handleApiError` responses. Data is serialized through `toJsonSafeValue` to protect Decimal/JSON responses.
- Mutations call `revalidateCacheTags` from `lib/cache.ts`; product and banner handlers already invalidate the relevant storefront tags.
- The product API accepts nested `images`, `variants`, and `specifications`, proving the existing model and form conventions can support section product pickers without a new catalog stack.

## 4. Storefront Data, State, and Cache

- `lib/storefront.ts` is the central server-side read layer. It maps Prisma records into `lib/types.ts` and exposes cached functions for products, featured products, new arrivals, active banners, categories, brands, colors, sizes, product detail, related products, and reviews.
- `unstable_cache` is used with a five-minute storefront revalidation window and tags such as `storefront`, `products`, `categories`, `banners`, `reviews`, and `settings`.
- The home route, `app/[locale]/page.tsx`, currently composes a fixed sequence: hero banners, categories, featured products, new arrivals, and static trust content. It fetches banners/categories/products using `Promise.all` and renders existing `HeroSlider`, `ProductCard`, and `SectionHeader` components.
- Client-only customer state uses persisted Zustand stores. `store/cart-store.ts` holds cart lines and variant choices in local storage. Favourites and currency preferences use the same pattern.

## 5. Authentication, Bilingual Support, and Currency

- NextAuth credentials authentication is implemented in `lib/auth.ts`, with bcrypt password checks and roles stored in the JWT/session. The only application roles are `USER` and `ADMIN`.
- Middleware only applies locale routing; it intentionally makes no database calls. Admin access is enforced server-side in the admin layout and API handlers.
- English and Arabic dictionaries are in `public/locales/en/common.json` and `public/locales/ar/common.json`. `lib/i18n.ts` supplies locale validation, localized text selection, and RTL detection. The locale layout sets `lang`, `dir`, Inter/Cairo fonts, and supports Arabic RTL rendering.
- AED is the base currency. `utils/currency.ts` supports AED, BDT, and USD, with BDT/USD rates read from the existing singleton `Setting` record.

## 6. Style System

- Styling is Tailwind only; no external component library should be introduced.
- The existing visual vocabulary is `paper`, `navy`, `gold`, and `sale` color tokens, rounded-md/lg/xl surfaces, compact borders, and `shadow-soft`/`shadow-lift` tokens.
- Layout and responsive behavior use Tailwind breakpoints. Existing homepage media uses `next/image` with responsive `sizes`; hero behavior is dynamically imported to protect initial bundle cost.
- `Croissant One`, Inter, and Cairo are installed through `next/font` in the locale layout.

## 7. Reuse vs Build New

### Reuse

- **Product, ProductVariant, ProductImage, Category, and Banner:** all product/category/banner selection and media requirements already exist.
- **Category as collections:** use active categories, their image, localized names, product count, and sort order. Do not create a separate `Collection` model.
- **Setting as site settings:** use the existing singleton record for announcement, footer, social, theme, currency, checkout, and store details. Do not create a duplicate `SiteSettings` model.
- **AdminShell and admin UI primitives:** add one navigation entry and one manager consistent with existing managers.
- **Admin API, Zod, Cloudinary, safe JSON, cache tags:** use the exact existing mutation and validation conventions.
- **Storefront query layer, ProductCard, HeroSlider, SectionHeader, i18n, RTL, and currency utilities:** compose sections from these instead of creating another storefront component system.
- **Existing seed file:** extend the current idempotent Prisma seed rather than adding a separate seed mechanism.

### Build New

1. **`HomepageSection` Prisma model** for ordered, active/inactive homepage composition. Recommended fields:
   - `id`, `type`, `titleEn`, `titleAr`, `subtitleEn`, `subtitleAr`, `sortOrder`, `isActive`, `config Json`, `createdAt`, `updatedAt`.
   - `type` should support the agreed controlled section types: hero/banner reference, category collection, product grid, promotional split, editorial/image tile, newsletter, and trust strip. Product/category/banner references and per-section display options belong in `config` so existing catalog models remain unchanged.
2. **Homepage-section Zod schema and admin API routes** following `app/api/admin/banners` and category reorder patterns, including explicit cache invalidation for a new `homepage-sections` tag plus `storefront`.
3. **`/admin/homepage` manager page** with a sortable section list, enabled toggle, section-type-specific editor, and product/category/banner selectors sourced from existing APIs/data.
4. **Homepage section registry and data query** in the existing storefront layer. The homepage will map active, sorted DB records to pre-existing components where possible, with small new presentation components only for section types that do not already exist.
5. **Seed extension** that creates demonstration home sections by upserting stable section IDs. It will not add static homepage content outside the database.

## 8. Explicit Non-Goals for the Implementation

- No duplicated product, category, banner, setting, upload, API client, or admin-shell implementation.
- No client-side database access, hard-coded homepage section content, raw HTML, external UI framework, or new global styling system.
- No changes to checkout, cart, authentication, currency, product variant behavior, or unrelated routes.

## 9. Recommended Implementation Order

1. Capture Moistreet desktop/mobile references and produce a structure map.
2. Add the smallest `HomepageSection` schema/migration and typed config contracts.
3. Build the admin homepage manager using current form/upload/API conventions.
4. Render active sections from the database in the existing home route.
5. Add idempotent seed data, then run type check, lint, build, and Playwright desktop/mobile verification.

## Conclusion

The project is already a Next.js App Router + Prisma storefront with a solid, reusable admin and catalog foundation. The correct extension is a **single database-backed homepage-section layer** that orchestrates the existing product/category/banner/settings systems. This preserves the project’s behavior and keeps every visible homepage item admin-controlled.
