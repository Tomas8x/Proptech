# PropTech — Project Plan

## Phases

### Phase 0 — Foundation (blocks everything)
- [ ] Next.js 14 scaffold with TypeScript, Tailwind, App Router
- [ ] Prisma schema: User, TenantProfile, Agency, Property, Application, Transaction
- [ ] NextAuth with JWT, role stored in token (INQUILINO | INMOBILIARIA | ADMIN)
- [ ] Middleware: unauthenticated → /login, role mismatch → role home
- [ ] DAL (lib/dal.ts): verifySession() with React cache()
- [ ] Seed script from Assets/Usuarios.xlsx (3 agencies, 20 tenants, 10 properties, 15 applications)
- [ ] Docker Compose: app + postgres
- [ ] .env.example

### Phase 1 — M1 Pasaporte Inquilino
- [ ] Register/login flows (email + password)
- [ ] Tenant profile form (DNI, type, lifestyle)
- [ ] Document upload: DNI image + income PDF → Supabase Storage
- [ ] Veraz mock: match DNI against seed data, return score 500–999
- [ ] Guarantee declaration (hipotecaria / seguro de caución)
- [ ] AI confidence score display (0–100)

### Phase 2 — M2 Gestión de Propiedades
- [ ] Property creation form (address, type, price, photos, external link)
- [ ] Compatibility spec per property (score threshold, guarantees, pets/smokers)
- [ ] Application reception + manual candidate entry
- [ ] Candidate list ranked by score with filters

### Phase 3 — M3 Tablero de Transacción
- [ ] Transaction state machine (config/transaction.ts)
- [ ] Transaction board UI with state transitions
- [ ] Document attachment per state
- [ ] Shared portal: tokenized link, no account needed
- [ ] Email notifications on each milestone

### Phase 4 — M4 Inteligencia Artificial
- [ ] AI confidence score (lib/ai/scoring.ts) — JSON: {score, dimensions, improvement_text}
- [ ] AI compatibility (lib/ai/compatibility.ts) — JSON: {compatibility_pct, explanation}
- [ ] AI candidate summary (lib/ai/candidates.ts) — paragraph in Spanish

### Phase 5 — M5 Admin + Production-readiness
- [ ] Admin panel: metrics, agency approval, flagged docs queue
- [ ] GitHub Actions: lint + build on PRs, deploy to Vercel on main
- [ ] README: setup, architecture, AI features, CI/CD, "what's next"

## Out of scope
Payments, digital signature, real DNI API, push notifications, native mobile.
