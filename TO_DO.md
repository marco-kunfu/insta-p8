# TO_DO — Insta-P8 (KunfuApp)

Lista de tareas pendientes para el desarrollo de esta app. Actualiza este archivo conforme avances.

## Pendiente

- [ ] Probar el flujo completo de login de Instagram desde el iframe en producción (conectar → pestaña → volver al panel) tras desplegar el fix de sesión por vendorId
- [ ] Pedir a un admin de Kunfupay: capability `EXTERNAL_INTEGRATIONS_API_ACCESS`, eventos `external.*` en `allowedWebhookEvents`, `redirectUri` y `webhookUrl` (HTTPS) de la app
- [ ] Probar `GET /api/kunfupay/me` desde una sesión embed real (valida credenciales + token + instalación + capability)
- [ ] Implementar la lógica de negocio de los eventos `external.*` (hoy solo se registran en `kunfupay_webhook_events`)
- [ ] Extraer los textos hardcodeados del dashboard (inbox, automations, ice-breakers, settings) a `messages/{es,en,fr,pt}.json` con `useTranslations`
- [ ] Filtrar los datos por `vendorId` en las rutas API (hoy el scoping es por cuenta de Instagram; falta comprobar que la cuenta pertenece al vendor de la sesión embed)
- [ ] Extender el webhook de Kunfupay (`sale.completed`) con lógica propia si aplica
- [ ] Probar el flujo standalone completo en producción (`/dashboard`: login en la misma pestaña → retorno → panel)
- [ ] Confirmar a mano en el iframe de producción: clic entre secciones (la navegación interna no es automatizable desde fuera del iframe cross-origin) y cambio de idioma del dashboard

## En progreso

<!-- Mueve aquí las tareas que estés trabajando activamente -->

## Completado

- [x] Verificado el flujo embed en producción (business.kunfupay.com → Kunfu DM): handshake (`kunfupay:ready` recibido por el host), token verificado, resize (883px), layout nuevo renderizado, tema oscuro correcto. Contrato real del host extraído de su bundle: embebe con `?kunfupay_theme=` y responde al `ready` con `kunfupay:token {token,expiresAt}` + `kunfupay:theme {theme,mode}` (re-emitido en cada cambio); `kunfupay:locale {locale}`. Nuestro lado soporta `kunfupay_theme`/`theme` y `payload.theme ?? payload.mode`
- [x] Layout sin sidebar: una sola navegación horizontal (`PanelNav`) para `/embed` y `/dashboard`, accesible en iframe (links con `aria-current`, targets de 44px, `overscroll-contain`, skip link a `<main>`, anuncio de ruta) y sin `fixed`/`sticky`/unidades de viewport dentro del embed; tema del host en embed (`?theme=` + `kunfupay:theme`), toggle solo en standalone; gate de Instagram compacto dentro del iframe
- [x] Modo por ruta (concepto one&one): `/embed/*` = iframe (handshake obligatorio), `/dashboard/*` = standalone (misma pestaña para el OAuth, nunca `window.close()`); `state` codifica modo+vendor y `/instagram-return` resuelve el retorno según el modo
- [x] `DATABASE_URL`/`DIRECT_URL` configuradas y `db:push` aplicado (tablas `vendors`, `kunfupay_webhook_events` y columna `users.vendor_id` verificadas en producción)
- [x] Sesión del embed resuelta por servidor (`GET/DELETE /api/instagram/account` por vendorId) en vez de localStorage — el storage del iframe está particionado por Chrome y no ve lo que escribe la pestaña de login
- [x] Retorno del OAuth robusto: notificación multi-canal (`instagram-link-events`), re-chequeo al recuperar el foco, errores visibles con toast, y landing como puerta del embed en vez de la pantalla-barrera
- [x] Migración a la estructura del kunfupay-app-template (`src/`, rama `develop`)
- [x] Capa de integración Kunfupay: embed SDK, verify-token, webhook, middleware CORS
- [x] Localización con `next-intl` (es/en/fr/pt) + sync de idioma con el host vía postMessage
- [x] Dashboard movido a `src/app/[locale]/embed/` con handshake de vendedor (`KunfupayEmbedProvider`)
- [x] Conversión de la capa de datos de supabase-js a Prisma (schema completo en `prisma/schema.prisma`)
- [x] Vinculación cuenta de Instagram ↔ Vendor en el callback OAuth
- [x] Migración a las APIs externas de KunfuApps (guía de integraciones): `callKunfupay` con credenciales de app + `X-Kunfupay-Embed-Token`, productos sin `KUNFUPAY_API_KEY`, webhook con dedupe por `webhookId` y eventos `external.*`, ruta de sanity `/api/kunfupay/me`, credenciales en `.env.local`
