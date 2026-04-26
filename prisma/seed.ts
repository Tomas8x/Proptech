import "dotenv/config";
import { PrismaClient, GuaranteeType, PropertyType, PropertyStatus, PostulacionStatus, TransactionStage } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import * as XLSX from "xlsx";
import path from "path";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function verazRange(score: number) {
  if (score >= 850) return "Excelente";
  if (score >= 700) return "Bueno";
  if (score >= 500) return "Regular";
  return "Riesgoso";
}

function guaranteeType(hipotecaria: string | null, caucion: string | null): GuaranteeType {
  if (hipotecaria === "Si") return GuaranteeType.PROPIETARIO;
  if (caucion === "Si") return GuaranteeType.SEGURO_CAUCION;
  return GuaranteeType.FIANZA;
}

// income in ARS, varied by score band
function monthlyIncome(score: number): number {
  if (score >= 850) return 650000 + (score % 7) * 20000;
  if (score >= 700) return 400000 + (score % 5) * 15000;
  if (score >= 500) return 240000 + (score % 4) * 12000;
  return 90000 + (score % 3) * 10000;
}

interface XlsxRow {
  dni: number;
  nombre: string;
  apellido: string;
  dni_validado: string;
  comprobante_ingresos: string;
  garantia_hipotecaria: string | null;
  "ofrece_caución": string | null;
  score_veraz: number;
}

async function main() {
  await prisma.transactionHistory.deleteMany();
  await prisma.transactionNote.deleteMany();
  await prisma.transactionDocument.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.postulacion.deleteMany();
  await prisma.property.deleteMany();
  await prisma.verazScore.deleteMany();
  await prisma.confianzaScore.deleteMany();
  await prisma.flaggedDocument.deleteMany();
  await prisma.inquilinoProfile.deleteMany();
  await prisma.inmobiliariaProfile.deleteMany();
  await prisma.user.deleteMany();

  // ── Admin ────────────────────────────────────────────────────────────────
  await prisma.user.create({
    data: {
      email: "admin@proptech.com",
      name: "Admin",
      role: "ADMIN",
    },
  });

  // ── Inmobiliarias ────────────────────────────────────────────────────────
  const agencyDefs = [
    { email: "palermo@proptech.com", companyName: "Palermo Propiedades", cuit: "30-71234567-0", phone: "11-4500-1111" },
    { email: "bsas@proptech.com", companyName: "BuenosAires Propiedades", cuit: "30-71234568-0", phone: "11-4500-2222" },
    { email: "capital@proptech.com", companyName: "Capital Real Estate", cuit: "30-71234569-0", phone: "11-4500-3333" },
  ];

  const agencies = await Promise.all(
    agencyDefs.map((a) =>
      prisma.user.create({
        data: {
          email: a.email,
          name: a.companyName,
          role: "INMOBILIARIA",
          inmobiliariaProfile: {
            create: {
              companyName: a.companyName,
              cuit: a.cuit,
              phone: a.phone,
              isApproved: true,
              approvedAt: new Date(),
            },
          },
        },
        include: { inmobiliariaProfile: true },
      })
    )
  );

  const agencyProfiles = agencies.map((a) => a.inmobiliariaProfile!);

  // ── Inquilinos from Excel ────────────────────────────────────────────────
  const wb = XLSX.readFile(path.join(process.cwd(), "Assets/Usuarios.xlsx"));
  const rows = XLSX.utils.sheet_to_json<XlsxRow>(wb.Sheets[wb.SheetNames[0]], { defval: null });

  const dniImageDNIs = new Set([13452513, 19055847, 21982982, 26169584, 33193998, 33654321, 81544670, 99999999]);
  const incomePDFDNIs = new Set([12100200, 13452513, 15100200, 19055847, 21982982, 26169584]);

  const inquilinos = await Promise.all(
    rows.map((row) =>
      prisma.user.create({
        data: {
          email: `dni${row.dni}@proptech.com`,
          name: `${row.nombre} ${row.apellido}`,
          role: "INQUILINO",
          inquilinoProfile: {
            create: {
              firstName: row.nombre,
              lastName: row.apellido,
              dni: String(row.dni),
              monthlyIncome: monthlyIncome(row.score_veraz),
              guaranteeType: guaranteeType(row.garantia_hipotecaria, row["ofrece_caución"]),
              dniImagePath: dniImageDNIs.has(row.dni) ? `Assets/DNIs/dni_${row.dni}.jpg` : null,
              incomeDocPath: incomePDFDNIs.has(row.dni) ? `Assets/Comprobante_Ingresos/dni_${row.dni}.pdf` : null,
            },
          },
        },
        include: { inquilinoProfile: true },
      })
    )
  );

  const inquilinoProfiles = inquilinos.map((i) => i.inquilinoProfile!);

  // ── Veraz scores ─────────────────────────────────────────────────────────
  await Promise.all(
    rows.map((row, i) =>
      prisma.verazScore.create({
        data: {
          inquilinoId: inquilinoProfiles[i].id,
          score: row.score_veraz,
          range: verazRange(row.score_veraz),
        },
      })
    )
  );

  // ── Confianza scores (only for users with complete docs) ─────────────────
  const completeDNIs = rows.filter((r) => dniImageDNIs.has(r.dni) && incomePDFDNIs.has(r.dni));
  await Promise.all(
    completeDNIs.map((row) => {
      const profile = inquilinoProfiles.find((p) => p.dni === String(row.dni))!;
      const score = Math.min(100, Math.floor(row.score_veraz / 10) + 5);
      return prisma.confianzaScore.create({
        data: {
          inquilinoId: profile.id,
          score,
          dimensions: {
            docQuality: score > 70 ? "Alta" : "Media",
            incomeRatio: score > 60 ? "Adecuado" : "Ajustado",
            guaranteeStrength: row.garantia_hipotecaria === "Si" ? "Fuerte" : "Moderada",
            completeness: "Completo",
          },
          improvementText:
            score >= 70
              ? "Tu perfil está bien posicionado. Considera agregar referencias laborales para mejorar aún más."
              : "Podés mejorar tu score completando todos los documentos solicitados y adjuntando referencias personales.",
        },
      });
    })
  );

  // ── Properties ───────────────────────────────────────────────────────────
  const propertyDefs = [
    { inmobiliaria: 0, title: "Departamento 2 ambientes Palermo", address: "Thames 1450", neighborhood: "Palermo", price: 450000, bedrooms: 1, area: 52, type: PropertyType.DEPARTAMENTO, status: PropertyStatus.DISPONIBLE },
    { inmobiliaria: 0, title: "PH 3 ambientes Palermo Hollywood", address: "Fitz Roy 2100", neighborhood: "Palermo", price: 680000, bedrooms: 2, area: 75, type: PropertyType.PH, status: PropertyStatus.DISPONIBLE },
    { inmobiliaria: 0, title: "Departamento luminoso Belgrano", address: "Cabildo 2400", neighborhood: "Belgrano", price: 520000, bedrooms: 2, area: 65, type: PropertyType.DEPARTAMENTO, status: PropertyStatus.RESERVADA },
    { inmobiliaria: 1, title: "Casa 4 ambientes Villa Urquiza", address: "Triunvirato 4800", neighborhood: "Villa Urquiza", price: 900000, bedrooms: 3, area: 120, type: PropertyType.CASA, status: PropertyStatus.DISPONIBLE },
    { inmobiliaria: 1, title: "Departamento monoambiente Caballito", address: "Rivadavia 5200", neighborhood: "Caballito", price: 320000, bedrooms: 1, area: 38, type: PropertyType.DEPARTAMENTO, status: PropertyStatus.DISPONIBLE },
    { inmobiliaria: 1, title: "Local comercial Flores", address: "Av. Nazca 1100", neighborhood: "Flores", price: 750000, bedrooms: 0, area: 90, type: PropertyType.LOCAL, status: PropertyStatus.ALQUILADA },
    { inmobiliaria: 2, title: "Oficina premium Microcentro", address: "Florida 800", neighborhood: "Microcentro", price: 1200000, bedrooms: 0, area: 80, type: PropertyType.OFICINA, status: PropertyStatus.DISPONIBLE },
    { inmobiliaria: 2, title: "Departamento 3 ambientes Recoleta", address: "Av. Callao 1600", neighborhood: "Recoleta", price: 850000, bedrooms: 2, area: 88, type: PropertyType.DEPARTAMENTO, status: PropertyStatus.DISPONIBLE },
    { inmobiliaria: 2, title: "PH amplio Almagro", address: "Av. Rivadavia 3800", neighborhood: "Almagro", price: 580000, bedrooms: 2, area: 85, type: PropertyType.PH, status: PropertyStatus.INACTIVA },
    { inmobiliaria: 0, title: "Departamento 2 ambientes Núñez", address: "Av. del Libertador 6500", neighborhood: "Núñez", price: 490000, bedrooms: 1, area: 55, type: PropertyType.DEPARTAMENTO, status: PropertyStatus.DISPONIBLE },
  ];

  const properties = await Promise.all(
    propertyDefs.map((p) =>
      prisma.property.create({
        data: {
          inmobiliariaId: agencyProfiles[p.inmobiliaria].id,
          title: p.title,
          address: p.address,
          neighborhood: p.neighborhood,
          price: p.price,
          bedrooms: p.bedrooms,
          area: p.area,
          propertyType: p.type,
          status: p.status,
        },
      })
    )
  );

  // ── Postulaciones ────────────────────────────────────────────────────────
  // 5 PENDIENTE, 3 EN_EVALUACION, 4 APROBADA (→ Transaction), 2 RECHAZADA, 1 RETIRADA = 15
  type PostDef = {
    inquilino: number;
    property: number;
    status: PostulacionStatus;
    compatibilityPct?: number;
    compatibilityExplanation?: string;
    transaction?: { stage: TransactionStage };
  };

  const postDefs: PostDef[] = [
    // PENDIENTE
    { inquilino: 0, property: 0, status: PostulacionStatus.PENDIENTE },
    { inquilino: 1, property: 3, status: PostulacionStatus.PENDIENTE },
    { inquilino: 4, property: 4, status: PostulacionStatus.PENDIENTE },
    { inquilino: 6, property: 7, status: PostulacionStatus.PENDIENTE },
    { inquilino: 10, property: 9, status: PostulacionStatus.PENDIENTE },
    // EN_EVALUACION
    { inquilino: 2, property: 1, status: PostulacionStatus.EN_EVALUACION, compatibilityPct: 78, compatibilityExplanation: "El perfil del inquilino es compatible con la propiedad en términos de ingresos y garantía." },
    { inquilino: 5, property: 2, status: PostulacionStatus.EN_EVALUACION, compatibilityPct: 65, compatibilityExplanation: "Ingresos adecuados pero la garantía ofrecida es débil respecto al precio del alquiler." },
    { inquilino: 9, property: 6, status: PostulacionStatus.EN_EVALUACION, compatibilityPct: 55, compatibilityExplanation: "Perfil marginal: score Veraz regular y sin garantía hipotecaria." },
    // APROBADA → Transaction
    { inquilino: 3, property: 0, status: PostulacionStatus.APROBADA, compatibilityPct: 92, compatibilityExplanation: "Perfil excelente con alta solvencia e ingresos muy por encima del umbral requerido.", transaction: { stage: TransactionStage.DOCUMENTACION } },
    { inquilino: 12, property: 3, status: PostulacionStatus.APROBADA, compatibilityPct: 88, compatibilityExplanation: "Inquilino solvente con garantía hipotecaria y buen historial crediticio.", transaction: { stage: TransactionStage.CONTRATO } },
    { inquilino: 17, property: 7, status: PostulacionStatus.APROBADA, compatibilityPct: 95, compatibilityExplanation: "Candidato ideal: score Veraz excelente, ingresos sólidos y garantía propietaria.", transaction: { stage: TransactionStage.ACTIVO } },
    { inquilino: 15, property: 9, status: PostulacionStatus.APROBADA, compatibilityPct: 81, compatibilityExplanation: "Buen candidato con ingresos estables y seguro de caución como respaldo.", transaction: { stage: TransactionStage.FINALIZADO } },
    // RECHAZADA
    { inquilino: 7, property: 1, status: PostulacionStatus.RECHAZADA, compatibilityPct: 30, compatibilityExplanation: "Score Veraz insuficiente y sin documentación de ingresos validada." },
    { inquilino: 8, property: 4, status: PostulacionStatus.RECHAZADA, compatibilityPct: 22, compatibilityExplanation: "Ingresos declarados no alcanzan el mínimo requerido para esta propiedad." },
    // RETIRADA
    { inquilino: 11, property: 6, status: PostulacionStatus.RETIRADA },
  ];

  for (const def of postDefs) {
    const post = await prisma.postulacion.create({
      data: {
        inquilinoId: inquilinoProfiles[def.inquilino].id,
        propertyId: properties[def.property].id,
        status: def.status,
        compatibilityPct: def.compatibilityPct ?? null,
        compatibilityExplanation: def.compatibilityExplanation ?? null,
      },
    });

    if (def.transaction) {
      const inmobiliariaUser = agencies.find(
        (a) => a.inmobiliariaProfile?.id === properties[def.property].inmobiliariaId
      )!;
      await prisma.transaction.create({
        data: {
          postulacionId: post.id,
          stage: def.transaction.stage,
          history: {
            create: {
              fromStage: null,
              toStage: def.transaction.stage,
              changedById: inmobiliariaUser.id,
            },
          },
        },
      });
    }
  }

  console.log("✓ Seed complete");
  console.log(`  3 inmobiliarias, 20 inquilinos, 10 propiedades, 15 postulaciones (4 con transaction)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
