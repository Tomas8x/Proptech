# PropTech — Project Plan

## Phases

### Phase 0 — Foundation (blocks everything)
- [ ] Prisma schema: User, TenantProfile, Agency, Property, Application, Transaction
- [ ] Next.js 14 scaffold with TypeScript, Tailwind, App Router
- [ ] NextAuth with OAuth (Google), role stored in token (INQUILINO | INMOBILIARIA | ADMIN)
- [ ] Middleware: unauthenticated → /login, role mismatch → role home
- [ ] DAL (lib/dal.ts): verifySession() with React cache()
- [ ] Seed script from Assets/Usuarios.xlsx (3 agencies, 20 tenants, 10 properties, 15 applications)
- [ ] Docker Compose: app + postgres
- [ ] .env.example

### Phase 1 — M1 Pasaporte Inquilino
- [ ] Register/login via OAuth (Google)
- [ ] Tenant profile form (DNI, tipo de perfil: relación de dependencia / monotributista / autónomo / jubilado, lifestyle: mascotas, fumador, composición familiar)
- [ ] Document upload: DNI image + income PDF → Supabase Storage
- [ ] Veraz mock: match DNI against seed data, return score 500–999
- [ ] Guarantee declaration (hipotecaria / seguro de caución)
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
- [ ] Transaction state machine (config/transaction.ts): Candidato seleccionado → Documentación completa → Contrato en revisión → Contrato firmado → Llaves entregadas
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
