import { verifyRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

const VERAZ_COLOR: Record<string, string> = {
  Excelente: "bg-green-100 text-green-700",
  Bueno: "bg-blue-100 text-blue-700",
  Regular: "bg-yellow-100 text-yellow-700",
  Riesgoso: "bg-red-100 text-red-600",
};

const PROFILE_LABELS: Record<string, string> = {
  RELACION_DEPENDENCIA: "Relación de dependencia",
  MONOTRIBUTISTA: "Monotributista",
  AUTONOMO: "Autónomo",
  JUBILADO: "Jubilado",
};

export default async function InquilinosPage() {
  await verifyRole("ADMIN");

  const inquilinos = await prisma.inquilinoProfile.findMany({
    include: {
      user: { select: { email: true, createdAt: true } },
      verazScore: true,
      confianzaScore: true,
      _count: { select: { postulaciones: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Inquilinos</h1>
        <p className="text-sm text-gray-500 mt-0.5">{inquilinos.length} registrados</p>
      </div>

      {inquilinos.length === 0 ? (
        <p className="text-sm text-gray-500">No hay inquilinos registrados.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Perfil</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Veraz</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Confianza</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Postulaciones</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Registrado</th>
              </tr>
            </thead>
            <tbody>
              {inquilinos.map((i, idx) => (
                <tr key={i.id} className={idx !== inquilinos.length - 1 ? "border-b border-gray-50" : ""}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{i.firstName} {i.lastName}</p>
                    <p className="text-xs text-gray-600">{i.user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{i.profileType ? PROFILE_LABELS[i.profileType] ?? i.profileType : "—"}</td>
                  <td className="px-4 py-3 text-center">
                    {i.verazScore ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${VERAZ_COLOR[i.verazScore.range] ?? "bg-gray-100 text-gray-500"}`}>
                        {i.verazScore.score}
                      </span>
                    ) : <span className="text-xs text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {i.confianzaScore ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${i.confianzaScore.score >= 70 ? "bg-green-100 text-green-700" : i.confianzaScore.score >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>
                        {i.confianzaScore.score}
                      </span>
                    ) : <span className="text-xs text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700 font-medium">{i._count.postulaciones}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{new Date(i.createdAt).toLocaleDateString("es-AR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
