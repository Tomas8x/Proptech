import { verifyRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { computeCandidateSummary } from "@/lib/ai/candidateSummary";
import { updatePostulacionStatus, updatePropertyStatus } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

const GUARANTEE_LABELS: Record<string, string> = {
  PROPIETARIO: "Prop. propietaria",
  SEGURO_CAUCION: "Seg. de caución",
  FIANZA: "Fianza",
  NINGUNA: "Sin garantía",
};

const STATUS_OPTIONS = [
  { value: "DISPONIBLE", label: "Disponible" },
  { value: "RESERVADA", label: "Reservada" },
  { value: "ALQUILADA", label: "Alquilada" },
  { value: "INACTIVA", label: "Inactiva" },
];

const POSTULACION_STATUS_OPTIONS = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "EN_EVALUACION", label: "En evaluación" },
  { value: "APROBADA", label: "Aprobada" },
  { value: "RECHAZADA", label: "Rechazada" },
];

const POSTULACION_COLORS: Record<string, string> = {
  PENDIENTE: "bg-gray-100 text-gray-600",
  EN_EVALUACION: "bg-yellow-100 text-yellow-700",
  APROBADA: "bg-green-100 text-green-700",
  RECHAZADA: "bg-red-100 text-red-700",
  RETIRADA: "bg-gray-100 text-gray-500",
};

type SortField = "compatibilityPct" | "incomeRatio" | "verazScore";

export default async function PropertyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ garantia?: string; sort?: SortField }>;
}) {
  const { id } = await params;
  const { garantia, sort = "compatibilityPct" } = await searchParams;

  const user = await verifyRole("INMOBILIARIA");
  const profile = await prisma.inmobiliariaProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/inmobiliaria/onboarding");

  const property = await prisma.property.findUnique({
    where: { id, inmobiliariaId: profile.id },
    include: {
      postulaciones: {
        include: {
          inquilino: {
            include: { verazScore: true, confianzaScore: true },
          },
        },
        where: { status: { not: "RETIRADA" } },
      },
      manualCandidates: true,
    },
  });

  if (!property) notFound();

  // Normalize platform candidates
  type Candidate = {
    id: string;
    name: string;
    guaranteeType: string;
    monthlyIncome: number;
    verazScore: number | null;
    confianzaScore: number | null;
    compatibilityPct: number | null;
    compatibilityExplanation: string | null;
    incomeRatio: number;
    isManual: boolean;
    status?: string;
    postulacionId?: string;
  };

  const platformCandidates: Candidate[] = property.postulaciones.map((p) => ({
    id: p.id,
    postulacionId: p.id,
    name: `${p.inquilino.firstName} ${p.inquilino.lastName}`,
    guaranteeType: p.inquilino.guaranteeType,
    monthlyIncome: Number(p.inquilino.monthlyIncome),
    verazScore: p.inquilino.verazScore?.score ?? null,
    confianzaScore: p.inquilino.confianzaScore?.score ?? null,
    compatibilityPct: p.compatibilityPct ?? null,
    compatibilityExplanation: p.compatibilityExplanation ?? null,
    incomeRatio: Number(p.inquilino.monthlyIncome) / Number(property.price),
    isManual: false,
    status: p.status,
  }));

  const manualCandidates: Candidate[] = property.manualCandidates.map((m) => ({
    id: m.id,
    name: `${m.firstName} ${m.lastName}`,
    guaranteeType: m.guaranteeType,
    monthlyIncome: Number(m.monthlyIncome),
    verazScore: null,
    confianzaScore: null,
    compatibilityPct: m.compatibilityPct ?? null,
    compatibilityExplanation: m.compatibilityExplanation ?? null,
    incomeRatio: Number(m.monthlyIncome) / Number(property.price),
    isManual: true,
  }));

  let all: Candidate[] = [...platformCandidates, ...manualCandidates];

  // Filter by guarantee
  if (garantia) {
    all = all.filter((c) => c.guaranteeType === garantia);
  }

  // Sort
  if (sort === "incomeRatio") {
    all.sort((a, b) => b.incomeRatio - a.incomeRatio);
  } else if (sort === "verazScore") {
    all.sort((a, b) => (b.verazScore ?? 0) - (a.verazScore ?? 0));
  } else {
    all.sort((a, b) => (b.compatibilityPct ?? -1) - (a.compatibilityPct ?? -1));
  }

  // AI summary for top 3–5 candidates with enough data
  let aiSummary: string | null = null;
  const summaryInput = all.slice(0, 5).filter((c) => c.compatibilityPct != null || c.verazScore != null);
  if (summaryInput.length >= 2) {
    try {
      aiSummary = await computeCandidateSummary(
        summaryInput.map((c) => ({
          name: c.name,
          verazScore: c.verazScore,
          confianzaScore: c.confianzaScore,
          compatibilityPct: c.compatibilityPct,
          guaranteeType: c.guaranteeType,
          monthlyIncome: c.monthlyIncome,
          profileType: null,
        })),
        property.title
      );
    } catch {}
  }

  const allGuarantees = Array.from(new Set([...platformCandidates, ...manualCandidates].map((c) => c.guaranteeType)));

  return (
    <div className="space-y-6">
      {/* Property header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{property.propertyType}</span>
              {property.neighborhood && <span className="text-xs text-gray-600">{property.neighborhood}, {property.city}</span>}
            </div>
            <h1 className="text-lg font-semibold text-gray-900">{property.title}</h1>
            <p className="text-sm text-gray-500">{property.address}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="font-semibold text-gray-900">{property.currency} {Number(property.price).toLocaleString("es-AR")}</div>
            <div className="text-xs text-gray-600">{property.area.toString()} m² · {property.bedrooms} amb.</div>
            {property.externalLink && (
              <a href={property.externalLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">Ver anuncio →</a>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <form action={async (fd: FormData) => { "use server"; await updatePropertyStatus(id, fd.get("status") as never); }}>
            <select name="status" defaultValue={property.status} onChange={undefined} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <SubmitButton pendingText="Actualizando..." className="ml-2 text-xs text-blue-600 hover:underline">Actualizar estado</SubmitButton>
          </form>
        </div>
      </div>

      {/* Constraints summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-medium text-gray-900 mb-3">Condiciones del candidato ideal</h2>
        <div className="flex flex-wrap gap-2 text-xs">
          {property.minVerazScore && (
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Veraz ≥ {property.minVerazScore}</span>
          )}
          {property.minIncomeMultiplier && (
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Ingresos ≥ {property.minIncomeMultiplier.toString()}x alquiler</span>
          )}
          {property.acceptedGuarantees.length > 0 && (
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Garantías: {property.acceptedGuarantees.map((g) => GUARANTEE_LABELS[g] ?? g).join(", ")}</span>
          )}
          <span className={`px-2 py-1 rounded-full ${property.petsAllowed ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>{property.petsAllowed ? "Mascotas OK" : "Sin mascotas"}</span>
          <span className={`px-2 py-1 rounded-full ${property.smokersAllowed ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>{property.smokersAllowed ? "Fumadores OK" : "No fumadores"}</span>
          <span className={`px-2 py-1 rounded-full ${property.childrenAllowed ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>{property.childrenAllowed ? "Niños OK" : "Sin niños"}</span>
        </div>
      </div>

      {/* AI summary */}
      {aiSummary && (
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">IA · Resumen comparativo</span>
          </div>
          <p className="text-sm text-blue-900">{aiSummary}</p>
        </div>
      )}

      {/* Candidates */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium text-gray-900">
            Candidatos <span className="text-gray-500 font-normal">({all.length})</span>
          </h2>
          <Link href={`/inmobiliaria/propiedades/${id}/candidato-manual`} className="text-sm text-blue-600 hover:underline">+ Agregar candidato externo</Link>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Garantía:</span>
            <a href={`/inmobiliaria/propiedades/${id}?sort=${sort}`} className={`text-xs px-2 py-1 rounded-full ${!garantia ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Todas</a>
            {allGuarantees.map((g) => (
              <a key={g} href={`/inmobiliaria/propiedades/${id}?garantia=${g}&sort=${sort}`} className={`text-xs px-2 py-1 rounded-full ${garantia === g ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {GUARANTEE_LABELS[g] ?? g}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Ordenar por:</span>
            <a href={`/inmobiliaria/propiedades/${id}${garantia ? `?garantia=${garantia}&` : "?"}sort=compatibilityPct`} className={`text-xs px-2 py-1 rounded-full ${sort === "compatibilityPct" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Compatibilidad</a>
            <a href={`/inmobiliaria/propiedades/${id}${garantia ? `?garantia=${garantia}&` : "?"}sort=incomeRatio`} className={`text-xs px-2 py-1 rounded-full ${sort === "incomeRatio" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Ingresos/alquiler</a>
            <a href={`/inmobiliaria/propiedades/${id}${garantia ? `?garantia=${garantia}&` : "?"}sort=verazScore`} className={`text-xs px-2 py-1 rounded-full ${sort === "verazScore" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Score Veraz</a>
          </div>
        </div>

        {all.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 text-sm">No hay candidatos{garantia ? " con esa garantía" : ""} aún.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {all.map((c, i) => (
              <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start gap-4">
                  {c.compatibilityPct != null && (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                      c.compatibilityPct >= 75 ? "bg-green-100 text-green-700" :
                      c.compatibilityPct >= 50 ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {c.compatibilityPct}%
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">#{i + 1} {c.name}</span>
                      {c.isManual && <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">Externo</span>}
                      {c.status && <span className={`text-xs px-1.5 py-0.5 rounded ${POSTULACION_COLORS[c.status] ?? ""}`}>{c.status}</span>}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span>Garantía: {GUARANTEE_LABELS[c.guaranteeType] ?? c.guaranteeType}</span>
                      <span>Ingresos: ARS {c.monthlyIncome.toLocaleString("es-AR")} ({c.incomeRatio.toFixed(1)}x)</span>
                      {c.verazScore != null && <span>Veraz: {c.verazScore}</span>}
                      {c.confianzaScore != null && <span>Confianza: {c.confianzaScore}/100</span>}
                    </div>
                    {c.compatibilityExplanation && (
                      <p className="text-xs text-gray-500 mt-2">{c.compatibilityExplanation}</p>
                    )}
                  </div>

                  {!c.isManual && c.postulacionId && (
                    <div className="shrink-0">
                      <form action={async (fd: FormData) => { "use server"; await updatePostulacionStatus(c.postulacionId!, fd.get("status") as never); }}>
                        <select name="status" defaultValue={c.status} className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                          {POSTULACION_STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        <SubmitButton pendingText="..." className="ml-1 text-xs text-blue-600 hover:underline">OK</SubmitButton>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
