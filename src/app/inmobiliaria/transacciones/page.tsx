import { verifyRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TRANSACTION_STAGES, STAGE_ORDER } from "@/config/transaction";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Tablero de transacciones</h1>
        <p className="text-sm text-gray-500 mt-1">{transactions.length} transacción{transactions.length !== 1 ? "es" : ""} activa{transactions.length !== 1 ? "s" : ""}</p>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">No hay transacciones aún. Aprobá una postulación para iniciar una.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {byStage.map(({ stage, config, items }) => (
            <div key={stage} className="space-y-3">
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color} border ${config.borderColor}`}>
                {config.label}
                <span className="bg-white/60 rounded-full px-1.5 text-xs">{items.length}</span>
              </div>
              {items.map((t) => (
                <Link
                  key={t.id}
                  href={`/inmobiliaria/transacciones/${t.id}`}
                  className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <p className="font-medium text-gray-900 text-sm truncate">{t.postulacion.property.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {t.postulacion.inquilino.firstName} {t.postulacion.inquilino.lastName}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(t.updatedAt).toLocaleDateString("es-AR")}
                  </p>
                </Link>
              ))}
              {items.length === 0 && (
                <div className="bg-white rounded-xl border border-dashed border-gray-200 p-4 text-center">
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
