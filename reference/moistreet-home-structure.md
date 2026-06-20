# Moistreet-Inspired Storefront Structure

**Source:** User-provided desktop and mobile reference screenshots, Step 1.

## Design Direction

The target is a light, editorial fashion storefront: very thin borders, black typography, spacious white backgrounds, compact icon controls, square-cornered or subtly rounded media, and product cards that let imagery lead. Best Mart branding, existing behavior, Arabic support, AED pricing, admin roles, and current checkout logic remain intact.

This is an inspiration map, not a literal brand or asset copy.

## Global Header

### Promotional strip

- Full-width slim announcement strip above the main navigation.
- Left/right arrows frame a centered admin-provided campaign message.
- Social links appear on desktop only when configured in existing settings.
- Content must come from the existing `Setting.announcementEn`, `announcementAr`, `announcementActive`, and social-link fields.

### Main navigation

- Left: menu trigger and search trigger.
- Center: Best Mart wordmark/logo from existing settings.
- Right: country/currency control, language control, account, and cart with live item badge.
- Mobile: keep menu, centered logo, search, and cart visible; use the existing mobile bottom navigation for home/shop/favourites/account.
- Keep current accessibility labels, auth behavior, locale switching, currency preference, favourites, and cart state.

## Category Drawer

- The menu trigger opens a left-side black drawer with a white category list.
- Each **active, top-level admin category** appears automatically in `sortOrder` order.
- Categories with active subcategories expose a compact expand/collapse toggle; clicking a category itself goes to its shop route.
- No category names, links, or images will be hard-coded in the header/drawer.
- The existing `Category` hierarchy, `isActive`, and `sortOrder` fields are the source of truth. The only UI work required is a reusable drawer component and its loading state.

## Home Page Section Map

### 1. Hero campaign

- Full-bleed desktop media with a short campaign heading and a solid black action button.
- Mobile stacks the media and action space cleanly, preserving an intentional editorial rhythm.
- Existing `Banner` records provide desktop/mobile image or video, bilingual title/subtitle/button copy, link, active state, and ordering.

### 2. Product editorial grid

- Section heading at the left, optional centered or right-aligned `View all` action.
- Desktop: four equal-width cards per row. Mobile: two cards per row.
- Uses the actual product image, not a decorative card shell.
- Source may be a selected product list, featured products, new arrivals, or a category product selection. This requires the planned `HomepageSection` model/config, while products themselves stay untouched.

### 3. New-arrivals horizontal rail

- Section title aligned left.
- Desktop shows a wide, scrollable product rail; mobile remains two columns rather than shrinking product content too far.
- Same product-card component as the editorial grid, with configurable source and `View all` route.

### 4. Trust strip

- Appears once, above the footer only, not duplicated under the hero.
- Existing admin-controlled shipping/payment/return data stays the source. The visual treatment becomes lighter and more editorial.

## Product Card Map

- Tall product image with a small sale pill only when `comparePrice > price`.
- Product name uses readable mixed case/title case and two-line clamp.
- Compare price is struck through; current AED price is prominent without visual clutter.
- Cards do not display sizes, descriptions, SKU, or brand.
- Existing color swatches remain available but are visually compact: show a few on cards and all colors on the detail page.
- Existing image-change-on-color-selection behavior remains. Card height and image aspect ratio are fixed to prevent layout shifts.
- Product availability continues to come from aggregate and variant stock; exhausted items show an out-of-stock state.

## Product Detail Map

- Desktop two-column composition: media gallery on the left, product content on the right.
- Product title, sale/current price, description, selected color, size controls, stock status, and add-to-cart appear in a clear vertical order.
- Color selection updates the visible gallery to the color-specific variant image; size stock is evaluated for the selected color.
- Preserve current favourite/share controls and only show product facts supplied by the admin (fabric, occasion, origin, care, fit, etc.).

## Cart and Checkout Map

- Cart becomes a spacious order table on desktop and a concise stacked layout on mobile.
- Line item: image, name, selected size/color, unit price, quantity stepper, remove button, and row total.
- Checkout stays on the existing UAE/Dubai flow: full name, contact, address/apartment fields, emirate shipping rules, coupon, COD/Stripe, and order summary.
- Admin-configured shipping and payment settings remain the only source for checkout choices. No static rate/copy will be introduced.

## Admin-Controlled Data Matrix

| Visible storefront item | Existing source | Required addition |
| --- | --- | --- |
| Announcement and social icons | `Setting` | Header presentation only |
| Logo/store identity | `Setting` | Header presentation only |
| Drawer categories/subcategories | `Category` | Drawer UI only |
| Hero media and copy | `Banner` | Hero presentation refinement only |
| Card image, price, sale, stock, variants | `Product`, `ProductImage`, `ProductVariant` | Card presentation refinement only |
| Featured/new products | Product flags/query layer | Reusable homepage-section configuration |
| Ordered homepage rows and selected product/category sources | Missing | `HomepageSection` model, CRUD, admin manager, renderer |
| Footer trust/contact/social data | `Setting` | Footer/trust presentation refinement only |
| Shipping/payment checkout controls | `Setting` | Preserve existing dynamic consumption |

## Implementation Constraints

- Do not reproduce Moistreet brand marks, photos, copy, or exact assets.
- Use the project’s existing Tailwind tokens, `next/image`, Lucide icons, cache layer, i18n helpers, and current store components.
- Every visible content section must read from admin-managed data; avoid hard-coded home copy, category links, or product lists.
- Preserve Next.js App Router structure, Prisma/PostgreSQL, and the existing API/auth conventions.

## Proposed Next Work

1. Add the smallest typed `HomepageSection` database/config layer and admin route/page.
2. Build the category drawer from the existing category query data.
3. Create a section renderer that composes existing hero/product/category components from active sections.
4. Refine the shared header, product cards, detail, cart, and checkout presentation without changing their behavior.
5. Seed a few non-static admin-managed categories/products/sections and verify desktop/mobile storefront routes.
