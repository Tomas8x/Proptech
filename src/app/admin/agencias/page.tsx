import { verifyRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { approveAgency, rejectAgency } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function AgenciasPage() {
  await verifyRole("ADMIN");

  const agencies = await prisma.inmobiliariaProfile.findMany({
    include: {
      user: { select: { email: true, createdAt: true } },
      _count: { select: { properties: true } },
    },
    orderBy: [{ isApproved: "asc" }, { createdAt: "desc" }],
  });

  const pending = agencies.filter((a) => !a.isApproved);
  const approved = agencies.filter((a) => a.isApproved);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Agencias</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {pending.length} pendiente{pending.length !== 1 ? "s" : ""} · {approved.length} aprobada{approved.length !== 1 ? "s" : ""}
        </p>
      </div>

      {pending.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-orange-600 uppercase tracking-wide mb-3">Pendientes de aprobación</h2>
          <div className="space-y-3">
            {pending.map((a) => (
              <div key={a.id} className="bg-white rounded-xl border border-orange-200 p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{a.companyName}</p>
                  <p className="text-xs text-gray-600 mt-0.5">CUIT {a.cuit} · {a.user.email}</p>
                  <p className="text-xs text-gray-600">Registrada {new Date(a.user.createdAt).toLocaleDateString("es-AR")}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <form action={approveAgency.bind(null, a.id)}>
                    <SubmitButton className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors font-medium" pendingText="Aprobando...">
                      Aprobar
                    </SubmitButton>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Aprobadas</h2>
        {approved.length === 0 ? (
          <p className="text-sm text-gray-500">Ninguna agencia aprobada aún.</p>
        ) : (
          <div className="space-y-2">
            {approved.map((a) => (
              <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{a.companyName}</p>
                  <p className="text-xs text-gray-600 mt-0.5">CUIT {a.cuit} · {a.user.email} · {a._count.properties} propiedad{a._count.properties !== 1 ? "es" : ""}</p>
                  {a.approvedAt && (
                    <p className="text-xs text-gray-600">Aprobada {new Date(a.approvedAt).toLocaleDateString("es-AR")}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Aprobada</span>
                  <form action={rejectAgency.bind(null, a.id)}>
                    <SubmitButton className="text-xs text-gray-600 hover:text-red-500 transition-colors" pendingText="...">
                      Revocar
                    </SubmitButton>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
