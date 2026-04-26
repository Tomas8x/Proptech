# PropTech — Plataforma Inmobiliaria

Hackathon individual, ~16–20 hs. Brief completo: `docs/brief_plataforma_inmobiliaria.docx.pdf`.

## Agent behavior

- Don't ask for clarification on decisions already made here. Build.
- Don't explain what you're about to do. Do it, then report what changed.
- Don't add features, abstractions, or error handling beyond what the task requires.
- Don't write comments that explain what the code does. Only write one if the WHY is non-obvious.
- If something is out of scope (see below), skip it without asking.

## Stack (locked)

- **Framework**: Next.js 14, TypeScript, App Router
- **Styles**: Tailwind CSS
- **DB**: PostgreSQL via Prisma ORM — migrations versioned, no loose SQL scripts
- **Storage**: Supabase Storage (DNIs, comprobantes de ingresos)
- **AI**: Anthropic API — model `claude-sonnet-4-6`, native image + PDF support, no external OCR
- **Deploy**: Vercel (app) + Supabase (DB + storage)
- **Auth**: NextAuth.js — email/password, role-based

## Architecture

AI logic lives in `lib/ai/` as a service layer. Never call Anthropic directly from API routes.  
Route structure: `/inquilino`, `/inmobiliaria`, `/admin` — three isolated role trees.  
Code in **English** (variables, functions, types). UI copy in **Spanish**.

## Roles

| Role | Key flows |
|---|---|
| Inquilino | Register → upload DNI + ingresos → Veraz mock → garantía → AI score → postulate → track |
| Inmobiliaria | Register → properties → candidates ranked by score → transaction board → shared portal |
| Admin | Approve agencies → platform metrics → flagged docs queue |

## Two scores — both visible

| Score | Range | Source |
|---|---|---|
| Score Veraz | 500–999 | Mocked — match DNI against `Assets/Usuarios.xlsx`. Gate for identity. |
| Score Confianza | 0–100 | AI — calculated on doc quality, income ratio, guarantee type, completeness. |

Veraz ranges: 850–999 Excelente · 700–849 Bueno · 500–699 Regular · <500 Riesgoso

## AI features (all three required for full score)

1. **Score Confianza** — analyze uploaded docs (DNI image + income PDF via Claude natively), return `{ score, dimensions, improvement_text }` as JSON.
2. **Compatibilidad perfil–propiedad** — return `{ compatibility_pct, explanation }` (2–3 sentences in Spanish). Shown to both inquilino and inmobiliaria.
3. **Resumen comparativo de candidatos** — given 3–5 top applicants, return a comparative paragraph in Spanish highlighting strengths and key differences.

All AI calls: structured JSON output, error handling, no generic prompts.

## Assets

```
Assets/Usuarios.xlsx          → seed source + Veraz mock DB
Assets/DNIs/                  → fake DNI images per user (dni_<DNI>.jpg)
Assets/Comprobante_Ingresos/  → income PDFs per user (dni_<DNI>.pdf)
```

## Seed requirements (non-negotiable for scoring)

One command runs everything. Seed must include:
- 3+ inmobiliarias
- 20 inquilinos with varied profiles and scores (sourced from Usuarios.xlsx)
- 10 properties in different states
- 15 postulaciones at different transaction stages


## Production-readiness checklist (30 pts — hackathon tiebreaker)

- `docker compose up` or single command brings everything up
- Versioned Prisma migrations (`prisma migrate dev`)
- Rich seed script (`prisma db seed`)
- `.env.example` with all required vars, no real secrets in repo
- GitHub Actions: lint + build on PRs, auto-deploy to Vercel on main
- Public URL at evaluation time — no localhost, no ngrok
