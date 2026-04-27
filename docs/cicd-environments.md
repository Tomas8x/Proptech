# CI/CD, Environments & Infrastructure

## Overview

The stack spans three platforms with a single production environment:

| Platform | Responsibility |
|---|---|
| **GitHub** | Source of truth, branch protection, PR checks (lint + build) |
| **Vercel** | Next.js build & deploy — triggers on every push to `main` |
| **Supabase** | PostgreSQL (via PgBouncer pooler) + file storage (DNIs, comprobantes) |

---

## GitHub

### Branch strategy

`main` is the production branch. All work happens on feature branches (`module/<name>`) and merges via PR. Vercel auto-deploys on every merge to `main`.

### GitHub Actions (to add — not yet present)

The CLAUDE.md spec calls for lint + build on PRs. Workflow to create at `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  pull_request:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          AUTH_SECRET: ${{ secrets.AUTH_SECRET }}
          GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
```

### Secrets required in GitHub

Set these under **Settings → Secrets → Actions** for the CI build to pass:

| Secret | Notes |
|---|---|
| `DATABASE_URL` | Transaction pooler URL (port 6543) |
| `AUTH_SECRET` | NextAuth signing secret |
| `GROQ_API_KEY` | Only needed if build-time AI calls exist (none currently) |
| `NEXT_PUBLIC_SUPABASE_URL` | Public — safe in CI |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public — safe in CI |

### Known pitfall

`package.json` and `package-lock.json` must always be committed together. The `resend` package was added to `package.json` without committing `package-lock.json`, which broke the Vercel build (commit `721ee49` fixed it). Lock file changes belong in the same commit as `package.json` changes.

---

## Vercel

### Auto-deploy

Vercel is connected to the `Tomas8x/Proptech` repo. Any push to `main` triggers a production build. No staging environment is configured.

### Build command

```
prisma generate && next build
```

`prisma generate` runs first so the Prisma client (`src/generated/prisma/`) is available at build time. The generated client is never committed to git.

### Environment variables (Vercel dashboard)

All secrets live in **Vercel → Project → Settings → Environment Variables**. These must match `.env.example` exactly:

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | Transaction pooler (`port 6543, pgbouncer=true`) for serverless functions |
| `DIRECT_URL` | ✅ | Direct connection (`port 5432`) — not used at runtime, only by Prisma CLI |
| `AUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `AUTH_URL` | ✅ | `https://proptech-ysgy.vercel.app` — no trailing slash |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth app |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth app |
| `GROQ_API_KEY` | ✅ | All AI features (confidence score, compatibility, candidate summary) |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | File upload/download |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Client-side Supabase access |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Server-side storage operations |
| `RESEND_API_KEY` | optional | Email notifications on stage advance; fails silently if absent |
| `NEXT_PUBLIC_APP_URL` | optional | Used in email links; defaults to `https://proptech-ysgy.vercel.app` |
| `DEV_PASSWORD` | optional | Enables the dev quick-login panel on `/login`; omit in a real production scenario |

### Considerations

- **Serverless edge**: Next.js runs as Vercel serverless functions. Prisma uses the PgBouncer transaction pooler (`port 6543`) to avoid connection exhaustion — never point `DATABASE_URL` at the direct port (5432) in production.
- **`DIRECT_URL`**: Prisma CLI (`migrate`, `db seed`) needs a direct connection. This var is read by `prisma.config.ts` but not needed at runtime by Vercel functions.
- **`DEV_PASSWORD`**: The dev quick-login panel (`/dev/login` + the panel on `/login`) is gated by this env var. Leave it unset in production if you don't want open account switching.
- **Middleware deprecation warning**: Vercel logs a warning about the `middleware` file convention being deprecated in favor of `proxy`. This is a Next.js 16 notice — no functional impact yet.

---

## Supabase

### Database

Single project, single schema. Prisma migrations are versioned under `prisma/migrations/`:

| Migration | What it added |
|---|---|
| `20260425000000_init` | All core tables (User, profiles, Property, Postulacion, Transaction, scores) |
| `20260426000001_oauth_refactor` | Removed password field; OAuth-only auth |
| `20260426000002_inquilino_profile_lifestyle` | Lifestyle/preference fields on InquilinoProfile |
| `20260426000003_phase2_inmobiliaria` | Transaction state machine, documents, history, portal token |
| `20260426000004_transaction_portal_token` | Unique index on portal token |

Run migrations:
```bash
npx prisma migrate deploy   # production (no schema drift check)
npx prisma migrate dev      # local dev (generates new migration if schema changed)
```

Seed (wipes and repopulates all tables):
```bash
npx prisma db seed
```

### Storage

Supabase Storage is used for DNI images and income PDFs uploaded by inquilinos. The bucket is accessed server-side via `SUPABASE_SERVICE_ROLE_KEY`. The anon key is used client-side only for public-readable assets.

### Considerations

- **Two URLs**: Supabase gives both a direct Postgres URL and a PgBouncer pooler URL. Prisma at runtime must use the pooler; Prisma CLI must use the direct URL. Both are in `.env.example`.
- **Row Level Security**: Not configured — the app enforces access control at the API/server action layer. If the project moves beyond a hackathon context, RLS should be added to every table.
- **Seed is destructive**: `prisma db seed` calls `deleteMany()` on every table in dependency order before inserting. Never run it against a database with real user data.
- **Storage bucket**: Must be created manually in the Supabase dashboard before file uploads work. The bucket name and access policy are not managed by Prisma migrations.

---

## Local development

```bash
# 1. Install deps
npm install

# 2. Copy and fill env
cp .env.example .env

# 3. Apply migrations + seed
npx prisma migrate dev
npx prisma db seed

# 4. Start dev server
npm run dev
```

The dev quick-login panel appears on `/login` when `DEV_PASSWORD` is set, allowing instant role switching without Google OAuth.
