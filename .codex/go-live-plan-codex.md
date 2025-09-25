# Fabric Store Go-Live Plan (Codex)

This document captures the top-priority features and checks required to launch the Fabric Store experience with confidence.

## Top 5 Go‑Live Features

1) Homepage Revamp (CMS‑driven)
- Goal: Replace placeholder hero/content; communicate value in 5 seconds.
- Implement:
  - Power hero, promos, and featured collections via Sanity (`app/api/hero-slides`, `lib/sanity.ts`).
  - Use components: `HeroCarousel`, `FeaturedProducts`, `v2/ShopByCollection`, trust badges (shipping, returns, secure checkout), social proof.
  - Mobile-first layout, prioritize above-the-fold images (next/image), lazy-load below-the-fold.
- Copy anchors: “Designer fabrics”, “fast swatches”, “easy yardage”, returns policy, lead times.

2) Checkout Flow Hardening
- Goal: Zero-friction checkout via Medusa v2 + Stripe with robust error states.
- Implement:
  - Use `lib/services/order.service.ts` cart → items → addresses → payment session (Stripe) → complete.
  - Polish `app/cart`, `app/checkout`, `app/checkout/success` with loading, error, retry states.
  - Persist cart in localStorage; confirm price/tax/shipping updates; show clear order confirmation with ID.
- Quick test: Add yard + swatch, pay, verify order in Medusa Admin.

3) Product Discovery (PLP) That Converts
- Goal: Fast browse and strong findability.
- Implement:
  - Filters: category, color, composition, price; Sort: new, price, popularity; pagination / load more; URL state sync.
  - Use `components/filters/*`, `ProductGrid`, `v2/FiltersV2`, `v2/LoadMoreButton` with data from `lib/medusa-api.ts` (`/store/products` with `q`, `category_id`, `limit/offset`).

4) PDP Enhancements for Fabrics
- Goal: Clear specs + strong CTAs (Order swatch, Add yardage).
- Implement:
  - Show composition, width, weight, care, lead time, price per yard.
  - Gallery with swatch; CTAs using correct variant IDs; related fabrics and recently viewed.
  - Use `OptimizedFabricDetails`, `v2/ImageGalleryV2`, `v2/OrderSample`, `RelatedProducts`.

5) Order Tracking (Guest‑friendly)
- Goal: Reduce support load, improve trust post‑purchase.
- Implement:
  - `app/orders/page.tsx` and `app/orders/[id]/page.tsx` using `medusaV2Service.getOrderById` and `/store/public-orders?email=…` (align endpoint backend/frontend).
  - Show timeline, items, totals, shipping address, status; link from success page and email.

## Must‑Have Checks Before Go‑Live
- SEO: unique titles/descriptions, OpenGraph/Twitter tags, canonical URLs, `sitemap.xml`, `robots.txt`.
- Performance: next/image, prefetch key routes, Core Web Vitals budget, defer non‑critical JS.
- Analytics/Tracking: GA4 (or Segment) page + purchase events; cookie consent banner.
- Accessibility: keyboard navigation, focus states, color contrast, alt text for images.
- Legal/Trust: Privacy, Terms, Returns/Shipping pages; footer links; visible support contact.
- Reliability: Sentry (frontend) error reporting; graceful empty/error states for PLP/PDP/Checkout.
- Config: `NEXT_PUBLIC_MEDUSA_BACKEND_URL`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`, Stripe keys; `/store/regions` returns valid region; publishable API key works.

## Backend Alignment (Fast Fixes)
- Unify order lookup endpoints: choose `/store/public-orders?email=…` and update frontend accordingly; add email verification and rate limiting.
- Remove hard‑coded admin URL in `medusa/src/admin/config.ts`; use env `MEDUSA_BACKEND_URL`.
- Confirm region exists (USD or fallback to EUR) to avoid checkout failures.

## Validation & Smoke Tests
- Browse: PLP loads within 2s; filters/sort/pagination work; SEO tags present.
- PDP: specs populated, images optimized, swatch + yardage CTAs functional.
- Cart/Checkout: full flow succeeds; error paths recover (network, Stripe failures); order visible in Medusa Admin.
- Orders: lookup by ID/email returns details with correct timeline/status.
- Mobile QA: iOS Safari and Android Chrome for homepage, PLP, PDP, checkout.

## Cutover Plan
- Enable maintenance banner (optional) for 30–60 min window.
- Deploy backend first, then frontend; verify `/store/regions` and a sample checkout.
- Warm cache by visiting homepage, PLP, PDP; verify analytics events.
- Remove banner and announce availability.

## Post‑Go‑Live Monitoring
- Logs/Errors: Sentry dashboard clean; Next.js/API logs show no spikes.
- Metrics: conversion rate, add-to-cart, checkout drop-off, payment failures.
- Ops: Stripe webhooks succeeding; Medusa Admin shows orders promptly.

---
Owner: Web/Frontend
Status: Draft (ready to execute)
