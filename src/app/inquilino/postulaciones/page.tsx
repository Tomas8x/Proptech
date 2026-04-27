import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_EVALUACION: "En evaluación",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
  RETIRADA: "Retirada",
};

const STATUS_COLORS: Record<string, string> = {
  PENDIENTE: "bg-gray-100 text-gray-600",
  EN_EVALUACION: "bg-blue-100 text-blue-700",
  APROBADA: "bg-green-100 text-green-700",
  RECHAZADA: "bg-red-100 text-red-700",
  RETIRADA: "bg-gray-100 text-gray-500",
};

export default async function PostulacionesPage() {
  const user = await verifySession();

  const profile = await prisma.inquilinoProfile.findUnique({ where: { userId: user.id } });

  if (!profile) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-4">Mis Postulaciones</h1>
        <p className="text-gray-500 text-sm">
          Completá tu <Link href="/inquilino/pasaporte/perfil" className="text-blue-600 hover:underline">pasaporte</Link> primero para postularte a propiedades.
        </p>
      </div>
    );
  }

  const postulaciones = await prisma.postulacion.findMany({
    where: { inquilinoId: profile.id },
    include: {
      property: { include: { inmobiliaria: true } },
      transaction: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const STAGE_LABELS: Record<string, string> = {
    DOCUMENTACION: "Documentación",
    CONTRATO: "Contrato",
    ACTIVO: "Contrato activo",
    FINALIZADO: "Finalizado",
  };

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Mis Postulaciones</h1>
      {postulaciones.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm mb-3">Todavía no te postulaste a ninguna propiedad.</p>
          <Link href="/inquilino/propiedades" className="text-blue-600 text-sm hover:underline">Ver propiedades disponibles</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {postulaciones.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all duration-150">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Link href={`/inquilino/propiedades/${p.propertyId}`} className="font-medium text-gray-900 hover:text-blue-600">
                    {p.property.title}
                  </Link>
                  <p className="text-sm text-gray-500">{p.property.address}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{p.property.inmobiliaria.companyName}</p>
                  {p.transaction && (
                    <div className="mt-2">
                      <span className="text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                        Transacción: {STAGE_LABELS[p.transaction.stage] ?? p.transaction.stage}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {STATUS_LABELS[p.status] ?? p.status}
                  </span>
                  {p.compatibilityPct != null && (
                    <div className="text-xs text-gray-600 mt-1">{p.compatibilityPct}% compatibilidad</div>
                  )}
                  <div className="text-xs text-gray-300 mt-1">{new Date(p.createdAt).toLocaleDateString("es-AR")}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
