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
- [ ] Tenant profile form (DNI, tipo de perfil: relación de dependencia / monotributista / autónomo / jubilado, lifestyle: mascotas, fumador, composición familiar)
- [ ] Document upload: DNI image + income PDF → Supabase Storage
- [ ] Veraz mock: match DNI against seed data, return score 500–999
- [ ] Guarantee declaration (propietario / fianza / seguro de caución / ninguna)
- [ ] AI confidence score display (0–100)
- [ ] Inquilino: view compatible property cards ranked by compatibility — show AI compatibility_pct + explanation on each card
- [ ] Inquilino: postulate to a property (one-click apply, shares profile with inmobiliaria)
- [ ] Inquilino: track application status per property

### Phase 2 — M2 Gestión de Propiedades
- [ ] Property creation form (address, type, area, price, photos, external link to Zonaprop/Argenprop/MercadoLibre)
- [ ] Compatibility spec per property (score threshold, accepted guarantees, pets/smokers/children, ideal tenant profile)
- [ ] Application reception + manual candidate entry (without platform profile)
- [ ] Candidate list ranked by score with filters: guarantee type + income/rent ratio — show AI compatibility_pct + explanation per candidate

### Phase 3 — M3 Tablero de Transacción
- [ ] Transaction state machine (config/transaction.ts): DOCUMENTACION → CONTRATO → ACTIVO → FINALIZADO
- [ ] Transaction board UI with state transitions
- [ ] Document attachment per state + internal notes (inmobiliaria-only, not visible to client)
- [ ] Shared portal: tokenized link sent to both inquilino and propietario, no account needed
- [ ] Email notifications on each milestone

### Phase 4 — M4 Inteligencia Artificial
- [ ] AI confidence score (lib/ai/scoring.ts) — JSON: {score, dimensions, improvement_text}
- [ ] AI compatibility (lib/ai/compatibility.ts) — JSON: {compatibility_pct, explanation}
- [ ] AI candidate summary (lib/ai/candidates.ts) — paragraph in Spanish

### Phase 5 — M5 Dashboards + Admin + Production-readiness
- [ ] Inmobiliaria metrics dashboard (/inmobiliaria/metrics): active properties, ongoing transactions, avg closing time, candidates per property
- [ ] Admin platform view (/admin): registered agencies (approve/reject), active tenants, global transactions, flagged docs queue
- [ ] Production DB separated from local (Supabase prod instance, migrations applied, demo seed loaded)
- [ ] GitHub Actions: lint + build on PRs, deploy to Vercel on main
- [ ] Responsive UI across all three role trees (usable on mobile, Tailwind breakpoints)
- [ ] README: setup steps, architecture + stack decisions, AI features (prompts + scoring logic), CI/CD description, "¿Qué harían con un día más?" (5 honest prioritized items)

## Out of scope
Payments, digital signature, real DNI API, push notifications, native mobile, demo video.
