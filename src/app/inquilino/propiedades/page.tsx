import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { computeCompatibility } from "@/lib/ai/compatibility";
import Link from "next/link";

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  DEPARTAMENTO: "Departamento",
  CASA: "Casa",
  PH: "PH",
  LOCAL: "Local",
  OFICINA: "Oficina",
};

export default async function PropiedadesPage() {
  const user = await verifySession();

  const profile = await prisma.inquilinoProfile.findUnique({
    where: { userId: user.id },
    include: { verazScore: true, confianzaScore: true, postulaciones: true },
  });

  const properties = await prisma.property.findMany({
    where: { status: "DISPONIBLE" },
    orderBy: { createdAt: "desc" },
  });

  // Compute or fetch compatibility for each property
  const withCompatibility = await Promise.all(
    properties.map(async (prop) => {
      if (!profile) return { ...prop, compatibilityPct: null, explanation: null };

      const existing = profile.postulaciones.find((p) => p.propertyId === prop.id);
      if (existing?.compatibilityPct != null) {
        return { ...prop, compatibilityPct: existing.compatibilityPct, explanation: existing.compatibilityExplanation };
      }

      if (!profile.dni) return { ...prop, compatibilityPct: null, explanation: null };

      try {
        const result = await computeCompatibility(
          {
            monthlyIncome: Number(profile.monthlyIncome),
            guaranteeType: profile.guaranteeType,
            profileType: profile.profileType,
            hasPets: profile.hasPets,
            isSmoker: profile.isSmoker,
            familySize: profile.familySize,
            verazScore: profile.verazScore?.score ?? null,
            confianzaScore: profile.confianzaScore?.score ?? null,
          },
          {
            title: prop.title,
            price: Number(prop.price),
            neighborhood: prop.neighborhood,
            propertyType: prop.propertyType,
            bedrooms: prop.bedrooms,
            area: Number(prop.area),
          }
        );
        return { ...prop, compatibilityPct: result.compatibility_pct, explanation: result.explanation };
      } catch {
        return { ...prop, compatibilityPct: null, explanation: null };
      }
    })
  );

  const sorted = withCompatibility.sort((a, b) => (b.compatibilityPct ?? 0) - (a.compatibilityPct ?? 0));

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Propiedades disponibles</h1>
      {sorted.length === 0 && (
        <p className="text-gray-500">No hay propiedades disponibles en este momento.</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sorted.map((prop) => (
          <Link key={prop.id} href={`/inquilino/propiedades/${prop.id}`} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 block">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {PROPERTY_TYPE_LABELS[prop.propertyType] ?? prop.propertyType}
                  </span>
                  {prop.neighborhood && <span className="text-xs text-gray-400">{prop.neighborhood}</span>}
                </div>
                <h2 className="font-medium text-gray-900 truncate">{prop.title}</h2>
                <p className="text-sm text-gray-500 mt-0.5 truncate">{prop.address}</p>
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 flex-wrap">
                  <span>{prop.bedrooms} amb.</span>
                  <span>{prop.area.toString()} m²</span>
                  <span className="font-semibold text-gray-900">ARS {Number(prop.price).toLocaleString("es-AR")}</span>
                </div>
                {prop.explanation && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{prop.explanation}</p>
                )}
              </div>
              {prop.compatibilityPct != null && (
                <div className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-base font-extrabold ring-2 ring-offset-1 ${
                  prop.compatibilityPct >= 75 ? "bg-green-100 text-green-700 ring-green-200" :
                  prop.compatibilityPct >= 50 ? "bg-yellow-100 text-yellow-700 ring-yellow-200" :
                  "bg-red-100 text-red-700 ring-red-200"
                }`}>
                  {prop.compatibilityPct}%
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
