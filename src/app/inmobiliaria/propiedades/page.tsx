import { verifyRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  DISPONIBLE: "Disponible",
  RESERVADA: "Reservada",
  ALQUILADA: "Alquilada",
  INACTIVA: "Inactiva",
};

const STATUS_COLORS: Record<string, string> = {
  DISPONIBLE: "bg-green-100 text-green-700",
  RESERVADA: "bg-yellow-100 text-yellow-700",
  ALQUILADA: "bg-blue-100 text-blue-700",
  INACTIVA: "bg-gray-100 text-gray-500",
};

export default async function PropiedadesPage() {
  const user = await verifyRole("INMOBILIARIA");
  const profile = await prisma.inmobiliariaProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/inmobiliaria/onboarding");

  const properties = await prisma.property.findMany({
    where: { inmobiliariaId: profile.id },
    include: { _count: { select: { postulaciones: true, manualCandidates: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Propiedades</h1>
          <p className="text-gray-500 text-sm mt-0.5">{properties.length} propiedad{properties.length !== 1 ? "es" : ""}</p>
        </div>
        <Link href="/inmobiliaria/propiedades/nueva" className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors">
          + Nueva propiedad
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">Todavía no tenés propiedades cargadas.</p>
          <Link href="/inmobiliaria/propiedades/nueva" className="text-blue-600 text-sm font-medium hover:underline">
            Agregar primera propiedad →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {properties.map((p) => {
            const totalCandidates = p._count.postulaciones + p._count.manualCandidates;
            return (
              <Link key={p.id} href={`/inmobiliaria/propiedades/${p.id}`} className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {STATUS_LABELS[p.status] ?? p.status}
                      </span>
                      <span className="text-xs text-gray-600">{p.propertyType}</span>
                    </div>
                    <div className="font-medium text-gray-900 truncate">{p.title}</div>
                    <div className="text-sm text-gray-500">{p.address}{p.neighborhood ? `, ${p.neighborhood}` : ""}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold text-gray-900">{p.currency} {Number(p.price).toLocaleString("es-AR")}</div>
                    <div className="text-xs text-gray-600">{p.area.toString()} m² · {p.bedrooms} amb.</div>
                    {totalCandidates > 0 && (
                      <div className="text-xs text-blue-600 mt-1">{totalCandidates} candidato{totalCandidates !== 1 ? "s" : ""}</div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
