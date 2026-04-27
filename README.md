# PropTech — Plataforma Inmobiliaria

Plataforma integral de alquiler para Argentina: pasaporte de inquilino con scoring de IA, gestión de propiedades, ranking de candidatos y tablero de transacción.

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16, App Router, TypeScript |
| Estilos | Tailwind CSS v4 |
| Base de datos | PostgreSQL (Supabase) + Prisma ORM v7 |
| Storage | Supabase Storage (DNIs, comprobantes) |
| Auth | NextAuth.js v5, Google OAuth |
| AI | Groq API — llama-3.3-70b-versatile (texto), llama-3.2-11b-vision-preview (imagen DNI) |
| Email | Resend (notificaciones por cambios de estado) |
| Deploy | Vercel (app) + Supabase (DB + storage) |

## Roles

- **Inquilino**: carga perfil + documentos → score Veraz + score Confianza IA → postula a propiedades → sigue estado en tiempo real
- **Inmobiliaria**: onboarding → crea propiedades con requisitos → ve candidatos rankeados → gestiona transacciones → portal compartido tokenizado
- **Admin**: aprueba agencias, métricas globales, cola de documentos flaggeados

## Features de IA

Toda la lógica vive en `src/lib/ai/` como capa de servicio. Las rutas API nunca llaman a Groq directamente. Cambiar modelo o proveedor no toca las rutas.

### 1. Score Confianza (0–100) — `confidenceScore.ts`

Pipeline de dos pasos:
1. **Análisis de imagen DNI** via `llama-3.2-11b-vision-preview`: envía la imagen en base64 y pide una descripción de calidad y legibilidad en una oración.
2. **Análisis del comprobante de ingresos** via `pdf-parse`: extrae hasta 3000 caracteres del PDF y los incluye en el prompt.

El prompt de scoring combina los outputs del paso 1 y 2 con datos del perfil (ingresos, tipo de garantía, tipo de empleo) y pide JSON estructurado:

```json
{
  "score": 0-100,
  "dimensions": {
    "docQuality": "Alta | Media | Baja",
    "incomeRatio": "Adecuado | Ajustado | Insuficiente",
    "guaranteeStrength": "Fuerte | Moderada | Débil",
    "completeness": "Completo | Parcial | Incompleto"
  },
  "improvement_text": "1-2 oraciones en español con consejos accionables"
}
```

Se usa `response_format: json_object` y `temperature: 0.2` para máxima consistencia. El modelo de texto (`llama-3.3-70b-versatile`) recibe el análisis de imagen como string, no la imagen directamente — esto permite escalar sin duplicar costos de visión.

### 2. Compatibilidad perfil–propiedad — `compatibility.ts`

Dado el perfil completo del inquilino y los requisitos de la propiedad, el prompt calcula un puntaje de compatibilidad considerando: ratio ingreso/alquiler, tipo de garantía vs garantías aceptadas, mascotas/fumadores/hijos, score Veraz vs mínimo requerido, y score Confianza.

```json
{
  "compatibility_pct": 0-100,
  "explanation": "2-3 oraciones en español con fortalezas y alertas"
}
```

`temperature: 0.2` — la explicación cambia ligeramente entre llamadas pero el puntaje es estable. Se muestra tanto al inquilino (antes de postular) como a la inmobiliaria (en la ficha del candidato).

### 3. Resumen comparativo de candidatos — `candidateSummary.ts`

Dado un set de candidatos top (Veraz, Confianza, compatibilidad, garantía, ingresos), genera un párrafo comparativo de 3–5 oraciones en español con recomendación final. Se usa `temperature: 0.4` para que el texto sea más natural y menos repetitivo entre ejecuciones.

No retorna JSON — el brief pide prosa, y forzar JSON para texto libre degradaría la calidad.

## Dos scores — siempre visibles

| Score | Rango | Fuente |
|---|---|---|
| Score Veraz | 500–999 | Mock — matchea DNI contra `Assets/Usuarios.xlsx` |
| Score Confianza | 0–100 | IA — calidad documental, ratio de ingresos, garantía, completeness |

Rangos Veraz: 850–999 Excelente · 700–849 Bueno · 500–699 Regular · <500 Riesgoso

## CI/CD

**Pull requests** → GitHub Actions (`.github/workflows/ci.yml`): lint, typecheck (`tsc --noEmit`), y build completo de Next.js con todas las env vars desde GitHub Secrets. Corre en PRs hacia `main`, `staging` y `develop`.

**Deploy a producción** → Vercel native integration: cada push a `main` dispara un deploy automático. No hay workflow de deploy en YAML porque la integración nativa de Vercel lo maneja directamente desde el repositorio de GitHub.

## Setup local

### Requisitos
- Node.js 22+
- Docker (para postgres local) o cuenta Supabase

### 1. Clonar e instalar
```bash
git clone https://github.com/Tomas8x/Proptech.git
cd Proptech
npm install
```

### 2. Variables de entorno
```bash
cp .env.example .env
```

Completar en `.env`:

| Variable | Cómo obtenerla |
|---|---|
| `DATABASE_URL` | Supabase → Settings → Database → Connection pooling → Session mode (port 5432) |
| `DIRECT_URL` | Supabase → Settings → Database → Direct connection (port 5432) |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `http://localhost:3000` en local, URL de Vercel en prod |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client |
| `GOOGLE_CLIENT_SECRET` | Idem anterior |
| `GROQ_API_KEY` | console.groq.com |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role |
| `RESEND_API_KEY` | resend.com → API Keys |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` en local, URL de Vercel en prod |

### 3. Migraciones y seed
```bash
npx prisma migrate deploy
npx prisma db seed
```

El seed carga: 1 admin, 3 inmobiliarias, 20 inquilinos (desde `Assets/Usuarios.xlsx`), 10 propiedades, 15 postulaciones.

### 4. Levantar
```bash
npm run dev
```

### Alternativa: Docker Compose (postgres local)
```bash
docker compose up db -d
# Cambiar DATABASE_URL y DIRECT_URL en .env a postgresql://proptech:proptech@localhost:5432/proptech
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

## Deploy en Vercel

### Primera vez

1. Crear proyecto en Supabase → copiar credenciales
2. Crear OAuth Client en Google Cloud Console:
   - Authorized JS origins: `https://tu-app.vercel.app`
   - Authorized redirect URI: `https://tu-app.vercel.app/api/auth/callback/google`
3. Importar repo en Vercel, configurar todas las env vars (ver tabla arriba)
4. Deploy → copiar URL → actualizar `AUTH_URL` y `NEXT_PUBLIC_APP_URL` en Vercel → Redeploy
5. Correr migraciones y seed desde local apuntando a la DB de Supabase:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

### Gotchas conocidos

| Problema | Causa | Fix |
|---|---|---|
| `Module not found: ../generated/prisma` | Prisma no genera el client en Vercel | El build script corre `prisma generate && next build` |
| `PrismaClientInitializationError` en build | Prisma v7 requiere adapter explícito | `src/lib/prisma.ts` usa `PrismaPg` adapter |
| Middleware >1 MB en Vercel free | Prisma/PrismaAdapter en el bundle del edge | `auth.config.ts` liviano separado de `auth.ts` |
| `DOMMatrix is not defined` en build | `pdf-parse` se carga al nivel de módulo | `require('pdf-parse')` movido dentro de la función |
| `P2028` en seed | Transaction pooler (port 6543) no soporta `$transaction()` | Seed usa operaciones secuenciales en vez de `$transaction([])` |
| Migración falla en DB fresca | AlterEnum sobre tablas que aún no existen | Migration 4 reescrita para DROP/CREATE del enum directamente |

### Variables de entorno en Vercel
- No van entre comillas en el dashboard de Vercel
- Después de cambiar env vars, hacer Redeploy manual (no se aplican automáticamente)
- `AUTH_URL` debe ser la URL exacta de Vercel sin slash final

## Estructura del proyecto

```
src/
  app/
    inquilino/          # Flujos del inquilino
    inmobiliaria/       # Flujos de la inmobiliaria
    admin/              # Panel admin
    login/              # Página de login
    register/role/      # Selección de rol post-signup
    portal/[token]/     # Portal compartido tokenizado (inmobiliaria ↔ inquilino)
  lib/
    ai/                 # Capa de servicios IA (Groq)
      confidenceScore.ts
      compatibility.ts
      candidateSummary.ts
    dal.ts              # Data Access Layer (verifySession, verifyRole)
    prisma.ts           # Singleton PrismaClient con PrismaPg adapter
    veraz/mock.ts       # Mock del score Veraz
    email/              # Notificaciones via Resend
    storage/            # Upload/download Supabase Storage
  auth.ts               # NextAuth full (con PrismaAdapter) — solo server
  auth.config.ts        # NextAuth liviano (sin Prisma) — para middleware edge
  middleware.ts         # Protección de rutas + redirección por rol
prisma/
  schema.prisma
  migrations/           # 5 migraciones versionadas
  seed.ts
.github/
  workflows/
    ci.yml              # Lint + typecheck + build en PRs
```

## Decisiones de arquitectura

- **Auth separado en dos configs**: `auth.config.ts` (sin Prisma, para middleware Edge) + `auth.ts` (con PrismaAdapter, para server). Necesario para que el middleware entre en el límite de 1 MB de Vercel free.
- **Prisma v7 con driver adapter**: v7 eliminó el `url` en `schema.prisma`; la conexión se pasa via `PrismaPg` al constructor. `prisma.config.ts` maneja la URL para migraciones CLI.
- **AI como capa de servicio**: toda llamada a Groq pasa por `src/lib/ai/`. Cambiar de modelo o proveedor no toca las rutas.
- **pdf-parse lazy load**: se carga con `require()` dentro de la función, no al nivel de módulo, para evitar errores de canvas en el build de Vercel.
- **Score Veraz mock**: matchea DNI contra datos del Excel de Assets. En producción real se reemplazaría por llamada a API de Veraz/BCRA.
- **Estados de transacción compactados a 4**: el brief define 5 estados granulares; se compactaron en `DOCUMENTACION → CONTRATO → ACTIVO → FINALIZADO` para simplificar la máquina de estados sin perder semántica para el MVP.
- **Deploy sin workflow YAML**: Vercel detecta pushes a `main` nativamente a través de la integración con GitHub. Agregar un `deploy.yml` sería redundante y podría causar deploys dobles.

## ¿Qué haríamos con un día más?

1. **Detección automática de documentos sospechosos**: conectar el confidence scorer al modelo `FlaggedDocument` para que documentos con score <40 o baja calidad de imagen queden automáticamente en la cola del admin. La estructura de DB y la UI ya existen.
2. **Delta numérico en sugerencias de mejora**: en vez de texto genérico, mostrar "subir el comprobante de ingresos podría llevar tu score de 54 a ~72" calculando el impacto estimado de cada dimensión faltante.
3. **Chat interno por transacción**: hilo de mensajes entre inquilino e inmobiliaria dentro del tablero, con notificaciones email en cada mensaje nuevo.
4. **Integración real con Veraz/BCRA**: reemplazar el mock por llamada a la API oficial. El mock está aislado en `lib/veraz/mock.ts` — solo hay que swappear la implementación.
5. **Mobile-first refinement**: la UI es responsive pero no está optimizada para mobile en los flujos de carga de documentos (drag & drop no funciona bien en touch).
