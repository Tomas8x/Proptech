import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { postulate } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

const STATUS_LABELS: Record<string, string> = {
  PENDIENTE: "Postulación enviada",
  EN_EVALUACION: "En evaluación",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
  RETIRADA: "Retirada",
};

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await verifySession();

  const [property, profile] = await Promise.all([
    prisma.property.findUnique({ where: { id }, include: { inmobiliaria: true } }),
    prisma.inquilinoProfile.findUnique({ where: { userId: user.id } }),
  ]);

  if (!property) notFound();

  const existing = profile
    ? await prisma.postulacion.findUnique({
        where: { inquilinoId_propertyId: { inquilinoId: profile.id, propertyId: id } },
      })
    : null;

  const canApply = Boolean(profile?.dni && profile?.dniImagePath && profile?.incomeDocPath);

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{property.propertyType}</span>
          {property.neighborhood && <span className="text-xs text-gray-600">{property.neighborhood}, {property.city}</span>}
        </div>
        <h1 className="text-xl font-semibold text-gray-900">{property.title}</h1>
        <p className="text-gray-500 text-sm">{property.address}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-600">Alquiler mensual</div>
            <div className="font-semibold text-gray-900">ARS {Number(property.price).toLocaleString("es-AR")}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Ambientes</div>
            <div className="font-semibold text-gray-900">{property.bedrooms}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Superficie</div>
            <div className="font-semibold text-gray-900">{property.area.toString()} m²</div>
          </div>
        </div>
        {property.description && <p className="text-sm text-gray-600">{property.description}</p>}
        <p className="text-xs text-gray-600 mt-3">Publicado por {property.inmobiliaria.companyName}</p>
      </div>

      {existing?.compatibilityPct != null && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
              existing.compatibilityPct >= 75 ? "bg-green-100 text-green-700" :
              existing.compatibilityPct >= 50 ? "bg-yellow-100 text-yellow-700" :
              "bg-red-100 text-red-700"
            }`}>
              {existing.compatibilityPct}%
            </div>
            <div>
              <div className="font-medium text-gray-900">Compatibilidad con tu perfil</div>
              <div className="text-xs text-gray-600">Calculado por IA</div>
            </div>
          </div>
          {existing.compatibilityExplanation && (
            <p className="text-sm text-gray-600">{existing.compatibilityExplanation}</p>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {existing ? (
          <div>
            <div className="text-sm font-medium text-gray-900 mb-1">Ya te postulaste</div>
            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
              {STATUS_LABELS[existing.status] ?? existing.status}
            </span>
          </div>
        ) : canApply ? (
          <form action={postulate.bind(null, id)}>
            <SubmitButton pendingText="Enviando postulación..." className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors">
              Postularme a esta propiedad
            </SubmitButton>
          </form>
        ) : (
          <div>
            <p className="text-sm text-gray-500 mb-3">Completá tu pasaporte para postularte.</p>
            <a href="/inquilino/pasaporte" className="block text-center border border-gray-300 rounded-lg py-2.5 text-sm text-gray-700 hover:bg-gray-50">
              Completar pasaporte
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
