import { verifyRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getInmobiliariaMetrics } from "@/lib/queries/metrics";

const STAGE_LABELS: Record<string, string> = {
  DOCUMENTACION: "Documentación",
  CONTRATO: "Contrato",
  ACTIVO: "Activo",
  FINALIZADO: "Finalizado",
};

const STAGE_COLORS: Record<string, string> = {
  DOCUMENTACION: "bg-blue-50 text-blue-700 border-blue-200",
  CONTRATO: "bg-purple-50 text-purple-700 border-purple-200",
  ACTIVO: "bg-green-50 text-green-700 border-green-200",
  FINALIZADO: "bg-gray-50 text-gray-600 border-gray-200",
};

const STAGE_DOT: Record<string, string> = {
  DOCUMENTACION: "bg-blue-500",
  CONTRATO: "bg-purple-500",
  ACTIVO: "bg-green-500",
  FINALIZADO: "bg-gray-400",
};

export default async function MetricasPage() {
  const user = await verifyRole("INMOBILIARIA");
  const profile = await prisma.inmobiliariaProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/inmobiliaria/onboarding");

  const metrics = await getInmobiliariaMetrics(profile.id);

  const ongoingTotal = ["DOCUMENTACION", "CONTRATO", "ACTIVO"].reduce(
    (sum, s) => sum + (metrics.stageMap[s] ?? 0),
    0
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Métricas</h1>
        <p className="text-sm text-gray-400 mt-0.5">{profile.companyName}</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-xs text-gray-500 mb-1">Propiedades activas</div>
          <div className="text-3xl font-bold text-gray-900">{metrics.activeProperties}</div>
          <div className="text-xs text-gray-400 mt-0.5">de {metrics.totalProperties} total</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-xs text-gray-500 mb-1">Transacciones en curso</div>
          <div className="text-3xl font-bold text-blue-600">{ongoingTotal}</div>
          <div className="text-xs text-gray-400 mt-0.5">{metrics.stageMap["FINALIZADO"] ?? 0} finalizadas</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-xs text-gray-500 mb-1">Tiempo cierre promedio</div>
          <div className="text-3xl font-bold text-gray-900">
            {metrics.avgClosingDays !== null ? metrics.avgClosingDays : "—"}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {metrics.avgClosingDays !== null
              ? `días · ${metrics.finalizadoCount} muestra${metrics.finalizadoCount !== 1 ? "s" : ""}`
              : "sin finalizadas aún"}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-xs text-gray-500 mb-1">Candidatos por propiedad</div>
          <div className="text-3xl font-bold text-gray-900">{metrics.avgCandidatesPerProperty}</div>
          <div className="text-xs text-gray-400 mt-0.5">promedio</div>
        </div>
      </div>

      {/* Transactions by stage breakdown */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Transacciones por etapa
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {["DOCUMENTACION", "CONTRATO", "ACTIVO", "FINALIZADO"].map((stage) => {
            const count = metrics.stageMap[stage] ?? 0;
            return (
              <div
                key={stage}
                className={`rounded-xl border p-4 ${STAGE_COLORS[stage]}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${STAGE_DOT[stage]}`} />
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    {STAGE_LABELS[stage]}
                  </span>
                </div>
                <div className="text-2xl font-bold">{count}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
