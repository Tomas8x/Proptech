import { verifyRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TRANSACTION_STAGES, STAGE_ORDER } from "@/config/transaction";

const STAGE_DOT: Record<string, string> = {
  DOCUMENTACION: "bg-blue-500",
  CONTRATO: "bg-purple-500",
  ACTIVO: "bg-green-500",
  FINALIZADO: "bg-gray-400",
};

export default async function TransaccionesPage() {
  const user = await verifyRole("INMOBILIARIA");
  const profile = await prisma.inmobiliariaProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/inmobiliaria/onboarding");

  const transactions = await prisma.transaction.findMany({
    where: { postulacion: { property: { inmobiliariaId: profile.id } } },
    include: {
      postulacion: {
        include: {
          property: true,
          inquilino: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const byStage = STAGE_ORDER.map((stage) => ({
    stage,
    config: TRANSACTION_STAGES[stage],
    items: transactions.filter((t) => t.stage === stage),
  }));

  const active = transactions.filter((t) => t.stage !== "FINALIZADO").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Tablero de transacciones</h1>
          <p className="text-sm text-gray-400 mt-0.5">{active} activa{active !== 1 ? "s" : ""} · {transactions.length} total</p>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-16 text-center">
          <p className="text-gray-400 text-sm">No hay transacciones aún.</p>
          <p className="text-gray-300 text-xs mt-1">Aprobá una postulación desde el detalle de una propiedad para iniciar una.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {byStage.map(({ stage, config, items }) => (
            <div key={stage} className="space-y-2">
              {/* Column header */}
              <div className="flex items-center gap-2 px-1 mb-3">
                <span className={`w-2 h-2 rounded-full shrink-0 ${STAGE_DOT[stage]}`} />
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{config.label}</span>
                <span className="ml-auto text-xs text-gray-400 font-medium">{items.length}</span>
              </div>

              {/* Cards */}
              {items.map((t) => (
                <Link
                  key={t.id}
                  href={`/inmobiliaria/transacciones/${t.id}`}
                  className={`block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition-all group border-l-4 ${config.borderColor}`}
                >
                  <p className="font-medium text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors">
                    {t.postulacion.property.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {t.postulacion.inquilino.firstName} {t.postulacion.inquilino.lastName}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-400">
                      {t.postulacion.property.currency} {Number(t.postulacion.property.price).toLocaleString("es-AR")}
                    </span>
                    <span className="text-xs text-gray-300">
                      {new Date(t.updatedAt).toLocaleDateString("es-AR")}
                    </span>
                  </div>
                </Link>
              ))}

              {items.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center bg-gray-50/50">
                  <p className="text-xs text-gray-300">Sin transacciones</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
