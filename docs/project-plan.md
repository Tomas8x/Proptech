# PropTech — Project Plan

> **Keep this plan updated after every completed task.**

## Phases

### Phase 0 — Foundation (blocks everything)
- [x] Prisma schema: User, InquilinoProfile, InmobiliariaProfile, Property, Postulacion, Transaction (+ TransactionDocument, TransactionNote, TransactionHistory)
- [x] Next.js 16 scaffold with TypeScript, Tailwind, App Router
- [x] NextAuth v5 with Google OAuth, role stored in JWT (INQUILINO | INMOBILIARIA | ADMIN)
- [x] OAuth migration (prisma/migrations/20260426000001_oauth_refactor)
- [x] /register/role page + server action for post-signup role selection
- [x] Middleware: unauthenticated → /login, no-role → /register/role, role mismatch → role home
- [x] DAL (src/lib/dal.ts): verifySession() + verifyRole() with React cache()
- [x] Seed script from Assets/Usuarios.xlsx (3 agencies, 20 tenants, 10 properties, 15 applications)
- [x] Docker Compose + Dockerfile: app + postgres
- [x] .env.example

### Phase 1 — M1 Pasaporte Inquilino
- [x] Tenant profile form (DNI, tipo de perfil: relación de dependencia / monotributista / autónomo / jubilado, lifestyle: mascotas, fumador, composición familiar)
- [x] Document upload: DNI image + income PDF → Supabase Storage
- [x] Veraz mock: match DNI against seed data, return score 500–999
- [x] Guarantee declaration (propietario / fianza / seguro de caución / ninguna)
- [x] AI confidence score display (0–100)
- [x] Inquilino: view compatible property cards ranked by compatibility — show AI compatibility_pct + explanation on each card
- [x] Inquilino: postulate to a property (one-click apply, shares profile with inmobiliaria)
- [x] Inquilino: track application status per property
- [x] **[UX]** UX/UI pass — inquilino flows: pasaporte stepper, score display, property cards, postulaciones tracker

### Phase 2 — M2 Gestión de Propiedades
- [x] Property creation form (address, type, area, price, photos, external link to Zonaprop/Argenprop/MercadoLibre)
- [x] Compatibility spec per property (score threshold, accepted guarantees, pets/smokers/children, ideal tenant profile)
- [x] Application reception + manual candidate entry (without platform profile)
- [x] Candidate list ranked by score with filters: guarantee type + income/rent ratio — show AI compatibility_pct + explanation per candidate
- [x] **[UX]** UX/UI pass — inmobiliaria flows: dashboard home, property list, property detail, candidate ranking

### Phase 3 — M3 Tablero de Transacción
- [x] Transaction state machine (config/transaction.ts): DOCUMENTACION → CONTRATO → ACTIVO → FINALIZADO
- [x] Transaction board UI with state transitions (/inmobiliaria/transacciones + /[id])
- [x] Document attachment per state + internal notes (inmobiliaria-only, not visible to client)
- [x] Shared portal: tokenized link at /portal/[portalToken], no account needed
- [x] Email notifications on each milestone (Resend, fire-and-forget from advanceStage)
- [x] **[UX]** UX/UI pass — transaction board: state machine stepper, document attachments, shared portal view

### Phase 4 — M4 Inteligencia Artificial
- [x] AI confidence score (lib/ai/scoring.ts) — JSON: {score, dimensions, improvement_text}
- [x] AI compatibility (lib/ai/compatibility.ts) — JSON: {compatibility_pct, explanation}
- [x] AI candidate summary (lib/ai/candidates.ts) — paragraph in Spanish

### Phase 5 — M5 Dashboards + Admin + Production-readiness
- [x] Inmobiliaria metrics dashboard (/inmobiliaria/metricas): active properties, ongoing transactions, avg closing time, candidates per property
- [x] Admin platform view (/admin): registered agencies (approve/reject), active tenants, global transactions, flagged docs queue
- [ ] Production DB separated from local (Supabase prod instance, migrations applied, demo seed loaded)
- [ ] GitHub Actions: lint + build on PRs, deploy to Vercel on main
- [x] loading.tsx + error.tsx per role section + not-found.tsx (skeleton UIs, error boundaries)
- [x] **[UX]** UX/UI pass — root/login/register pages (login page created, landing page, responsive nav)
- [ ] README: setup steps, architecture + stack decisions, AI features (prompts + scoring logic), CI/CD description, "¿Qué harían con un día más?" (5 honest prioritized items)

## Out of scope
Payments, digital signature, real DNI API, push notifications, native mobile, demo video.
