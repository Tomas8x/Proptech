import { verifyRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminHome() {
  await verifyRole("ADMIN");

  const [
    agencyTotal,
    agencyPending,
    tenantTotal,
    transactionsByStage,
    flaggedPending,
  ] = await Promise.all([
    prisma.inmobiliariaProfile.count(),
    prisma.inmobiliariaProfile.count({ where: { isApproved: false } }),
    prisma.inquilinoProfile.count(),
    prisma.transaction.groupBy({ by: ["stage"], _count: { stage: true } }),
    prisma.flaggedDocument.count({ where: { status: "PENDING" } }),
  ]);

  const stageMap: Record<string, number> = {};
  for (const row of transactionsByStage) stageMap[row.stage] = row._count.stage;

  const transactionTotal = Object.values(stageMap).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Panel de administración</h1>
        <p className="text-sm text-gray-500 mt-0.5">Vista global de la plataforma</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/admin/agencias" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-200 hover:shadow-sm hover:bg-blue-50/30 transition-all duration-150">
          <div className="text-xs text-gray-500 mb-1">Agencias</div>
          <div className="text-3xl font-bold text-gray-900">{agencyTotal}</div>
          {agencyPending > 0 && (
            <div className="text-xs text-orange-500 mt-0.5 font-medium">{agencyPending} pendiente{agencyPending !== 1 ? "s" : ""} de aprobación</div>
          )}
          {agencyPending === 0 && <div className="text-xs text-gray-600 mt-0.5">todas aprobadas</div>}
        </Link>

        <Link href="/admin/inquilinos" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-200 hover:shadow-sm hover:bg-blue-50/30 transition-all duration-150">
          <div className="text-xs text-gray-500 mb-1">Inquilinos</div>
          <div className="text-3xl font-bold text-gray-900">{tenantTotal}</div>
          <div className="text-xs text-gray-600 mt-0.5">registrados</div>
        </Link>

        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-200 hover:shadow-sm hover:bg-blue-50/30 transition-all duration-150">
          <div className="text-xs text-gray-500 mb-1">Transacciones</div>
          <div className="text-3xl font-bold text-gray-900">{transactionTotal}</div>
          <div className="text-xs text-gray-600 mt-0.5">{stageMap["ACTIVO"] ?? 0} activas</div>
        </div>

        <Link href="/admin/documentos" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-200 hover:shadow-sm hover:bg-blue-50/30 transition-all duration-150">
          <div className="text-xs text-gray-500 mb-1">Docs flaggeados</div>
          <div className={`text-3xl font-bold ${flaggedPending > 0 ? "text-red-500" : "text-gray-900"}`}>{flaggedPending}</div>
          <div className="text-xs text-gray-600 mt-0.5">pendientes de revisión</div>
        </Link>
      </div>

      {/* Transactions by stage */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Transacciones por etapa</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { stage: "DOCUMENTACION", label: "Documentación", dot: "bg-blue-500", cls: "bg-blue-50 text-blue-700 border-blue-200" },
            { stage: "CONTRATO", label: "Contrato", dot: "bg-purple-500", cls: "bg-purple-50 text-purple-700 border-purple-200" },
            { stage: "ACTIVO", label: "Activo", dot: "bg-green-500", cls: "bg-green-50 text-green-700 border-green-200" },
            { stage: "FINALIZADO", label: "Finalizado", dot: "bg-gray-400", cls: "bg-gray-50 text-gray-600 border-gray-200" },
          ].map(({ stage, label, dot, cls }) => (
            <div key={stage} className={`rounded-xl border p-4 ${cls}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
              </div>
              <div className="text-2xl font-bold">{stageMap[stage] ?? 0}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
