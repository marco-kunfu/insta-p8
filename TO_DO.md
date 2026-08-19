# TO_DO — Insta-P8 (KunfuApp)

Lista de tareas pendientes para el desarrollo de esta app. Actualiza este archivo conforme avances.

## Pendiente

- [ ] Configurar `DATABASE_URL` y `DIRECT_URL` en `.env.local` (connection string del Postgres de Supabase) y ejecutar `npm run db:push` para crear `vendors`, la columna `users.vendor_id` y la tabla `kunfupay_webhook_events`
- [ ] Pedir a un admin de Kunfupay: capability `EXTERNAL_INTEGRATIONS_API_ACCESS`, eventos `external.*` en `allowedWebhookEvents`, `redirectUri` y `webhookUrl` (HTTPS) de la app
- [ ] Probar `GET /api/kunfupay/me` desde una sesión embed real (valida credenciales + token + instalación + capability)
- [ ] Implementar la lógica de negocio de los eventos `external.*` (hoy solo se registran en `kunfupay_webhook_events`)
- [ ] Extraer los textos hardcodeados del dashboard (inbox, automations, ice-breakers, settings) a `messages/{es,en,fr,pt}.json` con `useTranslations`
- [ ] Filtrar los datos por `vendorId` en las rutas API (hoy el scoping es por cuenta de Instagram; falta comprobar que la cuenta pertenece al vendor de la sesión embed)
- [ ] Extender el webhook de Kunfupay (`sale.completed`) con lógica propia si aplica
- [ ] Decidir el destino de la landing (`src/app/[locale]/page.tsx`): en modo embed ya no hay login standalone
- [ ] Probar el flujo completo dentro del dashboard de Kunfupay (handshake, resize, cambio de idioma)

## En progreso

<!-- Mueve aquí las tareas que estés trabajando activamente -->

## Completado

- [x] Migración a la estructura del kunfupay-app-template (`src/`, rama `develop`)
- [x] Capa de integración Kunfupay: embed SDK, verify-token, webhook, middleware CORS
- [x] Localización con `next-intl` (es/en/fr/pt) + sync de idioma con el host vía postMessage
- [x] Dashboard movido a `src/app/[locale]/embed/` con handshake de vendedor (`KunfupayEmbedProvider`)
- [x] Conversión de la capa de datos de supabase-js a Prisma (schema completo en `prisma/schema.prisma`)
- [x] Vinculación cuenta de Instagram ↔ Vendor en el callback OAuth
- [x] Migración a las APIs externas de KunfuApps (guía de integraciones): `callKunfupay` con credenciales de app + `X-Kunfupay-Embed-Token`, productos sin `KUNFUPAY_API_KEY`, webhook con dedupe por `webhookId` y eventos `external.*`, ruta de sanity `/api/kunfupay/me`, credenciales en `.env.local`
