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

export default async function InmobiliariaHome() {
  const user = await verifyRole("INMOBILIARIA");
  const profile = await prisma.inmobiliariaProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/inmobiliaria/onboarding");

  const [properties, pendingCount, enEvaluacionCount, totalPostulaciones] = await Promise.all([
    prisma.property.findMany({
      where: { inmobiliariaId: profile.id },
      include: { _count: { select: { postulaciones: true, manualCandidates: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.postulacion.count({
      where: { property: { inmobiliariaId: profile.id }, status: "PENDIENTE" },
    }),
    prisma.postulacion.count({
      where: { property: { inmobiliariaId: profile.id }, status: "EN_EVALUACION" },
    }),
    prisma.postulacion.count({
      where: { property: { inmobiliariaId: profile.id } },
    }),
  ]);

  const disponibles = properties.filter((p) => p.status === "DISPONIBLE").length;
  const totalProperties = await prisma.property.count({ where: { inmobiliariaId: profile.id } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{profile.companyName}</h1>
        <p className="text-gray-500 text-sm mt-0.5">Panel de control</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-200 hover:shadow-sm hover:bg-blue-50/30 transition-all duration-150">
          <div className="text-xs text-gray-500 mb-1">Propiedades activas</div>
          <div className="text-3xl font-bold text-gray-900">{disponibles}</div>
          <div className="text-xs text-gray-400 mt-0.5">de {totalProperties} total</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-200 hover:shadow-sm hover:bg-blue-50/30 transition-all duration-150">
          <div className="text-xs text-gray-500 mb-1">Candidatos nuevos</div>
          <div className={`text-3xl font-bold ${pendingCount > 0 ? "text-orange-500" : "text-gray-900"}`}>
            {pendingCount}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">pendientes de revisión</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-200 hover:shadow-sm hover:bg-blue-50/30 transition-all duration-150">
          <div className="text-xs text-gray-500 mb-1">En evaluación</div>
          <div className="text-3xl font-bold text-blue-600">{enEvaluacionCount}</div>
          <div className="text-xs text-gray-400 mt-0.5">postulaciones activas</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-200 hover:shadow-sm hover:bg-blue-50/30 transition-all duration-150">
          <div className="text-xs text-gray-500 mb-1">Total postulaciones</div>
          <div className="text-3xl font-bold text-gray-900">{totalPostulaciones}</div>
          <div className="text-xs text-gray-400 mt-0.5">en todas las propiedades</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/inmobiliaria/propiedades/nueva"
          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Nueva propiedad
        </Link>
        <Link
          href="/inmobiliaria/propiedades"
          className="bg-white border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Ver todas las propiedades →
        </Link>
      </div>

      {/* Recent properties */}
      {properties.length > 0 && (
        <div>
          <h2 className="font-medium text-gray-900 mb-3">Propiedades recientes</h2>
          <div className="space-y-2">
            {properties.map((p) => {
              const total = p._count.postulaciones + p._count.manualCandidates;
              return (
                <Link
                  key={p.id}
                  href={`/inmobiliaria/propiedades/${p.id}`}
                  className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all duration-150"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">{p.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{p.address}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {total > 0 && (
                      <span className="text-xs text-blue-600 font-medium">
                        {total} candidato{total !== 1 ? "s" : ""}
                      </span>
                    )}
                    <span
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                        STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {STATUS_LABELS[p.status] ?? p.status}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {properties.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500 text-sm mb-4">Todavía no tenés propiedades cargadas.</p>
          <Link
            href="/inmobiliaria/propiedades/nueva"
            className="text-blue-600 text-sm font-medium hover:underline"
          >
            Agregar primera propiedad →
          </Link>
        </div>
      )}
    </div>
  );
}
