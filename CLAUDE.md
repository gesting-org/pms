# CLAUDE.md — Gesting PMS

## Qué es este proyecto

**Gesting PMS** es un sistema de gestión de propiedades para alquileres temporarios en Argentina. Next.js 14 app router, Prisma + Supabase PostgreSQL, desplegado en Vercel.

Admin único: `admin@gesting.com.ar` / `gesting2025`

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14 (App Router) |
| DB | Supabase PostgreSQL vía Prisma 5 |
| Auth | NextAuth v4, CredentialsProvider, JWT sessions |
| Estilos | Tailwind CSS + shadcn/ui (Radix primitives) |
| Email | Resend |
| Storage docs | Google Drive OAuth2 |
| AI | Anthropic Claude (`@anthropic-ai/sdk`) |
| Deploy | Vercel |

---

## Estructura de carpetas clave

```
app/
  (app)/           ← rutas protegidas del PMS (dashboard, reservations, etc.)
  api/             ← API routes
    booking/[code] ← endpoint público CORS para sitio de huéspedes
    drive/         ← Google Drive integration
    ai/            ← Claude endpoints
  login/           ← página pública
lib/
  auth.ts          ← NextAuth authOptions
  api-auth.ts      ← requireAuth() helper
  db.ts            ← singleton PrismaClient
  db/
    queries.ts     ← funciones de query centralizadas
    serialize.ts   ← Prisma → plain JS (Dates → strings, Decimal → number)
  utils.ts         ← helpers generales + generateBookingCode()
  google-drive/    ← cliente OAuth Drive
prisma/
  schema.prisma    ← fuente de verdad del schema
  seed.ts          ← seed completo con datos de ejemplo
```

---

## Convenciones de código

### API Routes
- Todas las rutas protegidas llaman `requireAuth()` al inicio:
  ```ts
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  ```
- Respuestas siempre con `{ ok: true, ... }` o `{ ok: false, error: "..." }`
- El endpoint `/api/booking/[code]` es **público** (sin auth), tiene headers CORS para el sitio de huéspedes

### Serialización
- Los objetos de Prisma **nunca** se devuelven directo al cliente
- Siempre pasar por `serialize.ts`: `serializeReservation()`, `serializeOwner()`, etc.
- Convierte `Date` → string ISO `YYYY-MM-DD`, `Decimal` → `number`
- Campos nuevos en el schema que TypeScript aún no conoce: usar `(r as any).campo`

### Schema Prisma
- Todos los campos monetarios: `Decimal @db.Decimal(12, 2)`
- Tasas/porcentajes: `Decimal @db.Decimal(5, 2)`
- Después de modificar el schema: `npx prisma migrate dev --name descripcion` + `npx prisma generate`
- En producción (Vercel): `npx prisma migrate deploy`

### Auth
- JWT strategy, 30 días
- `session.user` tiene `id` y `role` agregados vía callbacks
- Página de login: `/login`

---

## Comandos frecuentes

```bash
npm run dev              # desarrollo local
npm run db:push          # push schema sin migración (dev rápido)
npm run db:migrate       # migración con nombre
npm run db:studio        # Prisma Studio UI
npm run db:seed          # poblar DB con datos de ejemplo
npm run build            # prisma generate + next build
```

---

## Deploy (Vercel)

- Build command: `prisma generate && next build` (ya configurado en `package.json`)
- **Importante**: Vercel cachea `node_modules`, por eso `prisma generate` está en el script `build`, no solo en `postinstall`
- Variables de entorno requeridas en Vercel:
  - `DATABASE_URL` — Supabase con pgbouncer
  - `NEXTAUTH_URL` — URL de producción (no localhost)
  - `NEXTAUTH_SECRET`
  - `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SECRET_KEY`
  - `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` + `GOOGLE_REDIRECT_URI`
  - `ANTHROPIC_API_KEY`
  - `RESEND_API_KEY` + `RESEND_FROM_EMAIL`
  - `PORTAL_JWT_SECRET`
  - `GUEST_SITE_ORIGIN` — origen permitido para CORS del endpoint `/api/booking/[code]`

- Google OAuth: el `GOOGLE_REDIRECT_URI` de producción debe estar registrado en Google Cloud Console

---

## Features implementados

- **Propiedades**: CRUD, propietarios, plataformas (Airbnb, Booking, Direct)
- **Reservas**: CRUD, `bookingCode` único por reserva, `checkInTime`/`checkOutTime`
- **Huéspedes**: CRM básico
- **Tareas**: limpieza, mantenimiento, inspecciones
- **Gastos**: por propiedad, categorías, estados
- **Liquidaciones**: por propiedad/período, vinculadas a reservas
- **Contratos de gestión**: generados con Claude, estados (DRAFT → ACTIVE → EXPIRING_SOON → EXPIRED)
- **Mensajes**: bandeja entrada/salida, sugerencias de respuesta con Claude
- **Google Drive**: integración OAuth para gestión de documentos
- **Portal propietarios**: acceso restringido con JWT propio
- **AI (Claude)**: resumen mensual, sugerencia de respuestas, generación de contratos
- **Analytics**: dashboard con recharts
- **PWA**: configurado con next-pwa

---

## Endpoint público para sitio de huéspedes

```
GET /api/booking/:code
```

Devuelve datos de la reserva (nombre huésped, fechas, propiedad) sin campos financieros.
Configurable con `GUEST_SITE_ORIGIN` para CORS en producción.

---

## Modelos principales del schema

`User`, `Owner`, `Property`, `PropertyPlatform`, `Guest`, `Reservation`, `Task`, `Expense`, `Liquidation`, `ManagementContract`, `Message`, `GoogleToken`, `GestingConfig`, `AutomationRule`

Enums clave: `Platform` (AIRBNB/BOOKING/DIRECT/OTHER), `ReservationStatus`, `PaymentStatus`, `TaskStatus`, `Priority`, `LiquidationStatus`, `ContractStatus`
