# Insta-P8 (KunfuApp) — AI Context

## Instrucción para el agente

Al iniciar cualquier conversación en este proyecto, lee `TO_DO.md` antes de responder. Úsalo para entender qué está pendiente, en progreso y completado. Actualízalo cuando se complete una tarea o surja una nueva.

## Git Flow

- La rama principal de trabajo es **`develop`**. Todo el desarrollo se hace aquí o en ramas de feature que salen de `develop`.
- Los cambios llegan a **`main`** únicamente mediante una **Pull Request** desde `develop`. Nunca se hace push directo a `main`.
- Al crear ramas de feature, partir siempre desde `develop`: `git checkout -b feature/nombre develop`
- Antes de abrir una PR a `main`, asegurarse de que `develop` está actualizado y sin conflictos.

## What is this project

A KunfuApp: Instagram DM automation (inbox, keyword automations, ice breakers, AI auto-reply via Groq) built on the [kunfupay-app-template](https://github.com/Kunfupay-Company/kunfupay-app-template). It runs **inside a sandboxed iframe** in the Kunfupay dashboard, loaded at `/embed?embed_token=...`, and communicates with the host via postMessage.

## Architecture

### Integration layer (DO NOT modify unless necessary)

- `src/lib/kunfupay-embed-sdk.ts` — Client-side iframe communication (postMessage). Singleton `kunfupayEmbed`: `ready()`, `resize()`, `autoResize()`, `navigate()`, `close()`, `getTokenFromUrl()`, `onTokenReceived()`, `getLocaleFromUrl()`, `onLocaleReceived()`, `hasReceivedLocale()`.
- `src/lib/kunfupay.ts` — Server-side Kunfupay API client: `verifyEmbedToken()`, `verifyWebhookSignature()`, `listSales()`, `getSale()`, `getProduct()`. Env: `KUNFUPAY_API_BASE`, `KUNFUPAY_CLIENT_ID`, `KUNFUPAY_CLIENT_SECRET`.
- `src/middleware.ts` — CORS for `/api/*` (iframe sandbox has origin "null") + `next-intl` locale routing.
- `src/lib/db.ts` — Prisma client singleton.
- `src/app/api/auth/verify-token/route.ts` — verifies `embed_token`, upserts `Vendor`, returns `{ vendorId, isActive }`.
- `src/app/api/webhooks/kunfupay/route.ts` — Kunfupay webhook (`app.installed`, `app.uninstalled`, `sale.completed`).
- `src/i18n/{routing,request,navigation}.ts` — `next-intl`: locales `es`, `en`, `fr`, `pt`, default `es`, `localePrefix: "as-needed"`.
- `src/app/layout.tsx` — minimal root; the real `<html>`/`<body>` shell (fonts, theme bootstrap, providers) lives in `src/app/[locale]/layout.tsx`.
- `src/components/kunfupay/embed-provider.tsx` — embed handshake (token → vendorId → `ready()`), iframe auto-resize, host locale sync. Exposes `useVendor()`.

### App-specific layer

- `prisma/schema.prisma` — `Vendor` is the root. `InstagramAccount` (table `users`, id = Instagram user id) hangs off `Vendor` via `vendorId`; everything else (conversations, messages, automations, media_cache, ice_breakers, content_pool, scheduler_config, reels_posts) hangs off `InstagramAccount`. `dm_queue` and `unlock_attempts` have no FK on purpose.
- `src/app/[locale]/embed/` — the app UI (former dashboard): overview, inbox, automations, ice-breakers, analytics, settings.
- `src/app/api/` — app routes (instagram/*, inbox/*, automations, ice-breakers, groq/*, dashboard/stats, kunfupay/products). NOT localized.
- `src/lib/kunfupay-products.ts` — legacy vendor-key client for the Kunfupay products API (X-API-Key), used for DM card buttons. Distinct from `src/lib/kunfupay.ts`.
- `messages/{es,en,fr,pt}.json` — translations (keep all four in sync).

## Key design decisions (template)

- **Vendor ID = Kunfupay user ID** — no separate foreign key.
- **Auto-create vendor via upsert** in verify-token; don't rely only on the `app.installed` webhook.
- **embed_token from URL** (`?embed_token=...`); postMessage `kunfupay:token` is only for refresh.
- **Dev shortcut**: `?vendorId=xxx` bypasses token verification locally (`/embed?vendorId=test-vendor`).
- **CORS is open (`*`)** — intentional, required by the iframe sandbox.
- **Instagram account linking**: the OAuth callback (`/api/instagram/callback`) receives the `vendorId` from the embed session (round-tripped through the OAuth `state` param) and stamps it on the `users` row.
- **Panel mode is decided BY ROUTE** (the one&one concept, no `window.top` sniffing): `/embed/*` is always embed mode (Kunfupay handshake required), `/dashboard/*` is always standalone. Both render the same pages — `/dashboard` pages re-export `/embed` pages and each layout mounts the matching vendor provider around the shared `PanelShell`. `useVendor()` exposes `{ vendorId, mode }`.
- **Session resolution by mode**: embed → server truth, `GET /api/instagram/account?vendorId=...` (the iframe's localStorage is partitioned by Chrome and shared with standalone tabs, so it can't be trusted). Standalone → localStorage. See `src/hooks/use-instagram-session.ts`.
- **OAuth by mode**: standalone logs in on the SAME tab (`location.href`) and returns to `/dashboard`; embed opens a separate tab. The `state` param encodes mode + vendor (`e:<vendorId>` / `s:<vendorId?>`) and the callback GET lands on `/instagram-return`, which finishes the exchange and either notifies the iframe and closes (embed) or continues in place (standalone). Notifications go through `src/lib/instagram-link-events.ts` (BroadcastChannel + storage ping + `window.opener` postMessage) and the embed also re-checks on window focus — the only signal that always survives.

## Database

- ORM: Prisma over the existing **Supabase Postgres** (`DATABASE_URL` pooled / `DIRECT_URL` direct). supabase-js has been removed.
- `schema.sql` is the pre-migration snapshot, kept for reference only; the source of truth is `prisma/schema.prisma`. Sync with `npm run db:push`.
- Instagram ids are `BigInt` in Prisma — never let a BigInt reach `NextResponse.json`; convert with `Number(...)`.
- API responses keep **snake_case** row shapes (legacy of supabase-js) — map Prisma results explicitly.

## Dev environment

- App port: 3003 (`npm run dev -- -p 3003`); Kunfupay host runs on localhost:3000.
- Test URL: `http://localhost:3003/embed?vendorId=test-vendor`
- Package manager: **npm** (single lockfile: `package-lock.json`).

## Conventions

- API routes receive the id in query params (GET) or body (POST/PUT); they are under `/api/` and excluded from locale routing.
- Use `sonner` for toasts, `cn()` from `@/lib/utils` for class merging.
- Call `kunfupayEmbed.autoResize()` after content changes (the embed provider already installs a ResizeObserver).
- User-facing pages live under `src/app/[locale]/`. New UI strings go through `useTranslations`/`getTranslations` (existing dashboard strings are being extracted progressively — see TO_DO.md).
- Use `Link`/`useRouter`/`usePathname` from `@/i18n/navigation` for locale-aware navigation.
