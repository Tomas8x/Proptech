import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { TRANSACTION_STAGES, STAGE_ORDER } from "@/config/transaction";

export default async function SharedPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const tx = await prisma.transaction.findUnique({
    where: { portalToken: token },
    include: {
      postulacion: {
        include: {
          property: { include: { inmobiliaria: true } },
          inquilino: true,
        },
      },
      documents: { orderBy: { uploadedAt: "asc" } },
      history: { orderBy: { changedAt: "asc" } },
    },
  });

  if (!tx) notFound();

  const stageConfig = TRANSACTION_STAGES[tx.stage];
  const currentStageIndex = STAGE_ORDER.indexOf(tx.stage);
  const { property, inquilino } = tx.postulacion;

  const docsByStage = STAGE_ORDER.map((s) => ({
    stage: s,
    config: TRANSACTION_STAGES[s],
    docs: tx.documents.filter((d) => d.stage === s),
  })).filter(({ docs }) => docs.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-gray-900">PropTech</span>
          <span className="text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">Portal de seguimiento</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        {/* Property card */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className={`h-1.5 ${stageConfig.bgColor}`} />
          <div className="p-5">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-xs text-gray-600 mb-0.5">{property.inmobiliaria.companyName}</p>
                <h1 className="text-lg font-semibold text-gray-900">{property.title}</h1>
                <p className="text-sm text-gray-500">{property.address}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${stageConfig.bgColor} ${stageConfig.color} border ${stageConfig.borderColor}`}>
                {stageConfig.label}
              </span>
            </div>

            {/* Stepper */}
            <div className="relative">
              <div className="absolute top-3.5 left-[14px] right-[14px] h-0.5 bg-gray-100" />
              <div
                className="absolute top-3.5 left-[14px] h-0.5 bg-gray-800 transition-all duration-500"
                style={{ width: currentStageIndex === 0 ? 0 : `calc(${(currentStageIndex / (STAGE_ORDER.length - 1)) * 100}% - 14px)` }}
              />
              <div className="relative flex justify-between">
                {STAGE_ORDER.map((s, i) => {
                  const done = i < currentStageIndex;
                  const active = i === currentStageIndex;
                  const cfg = TRANSACTION_STAGES[s];
                  return (
                    <div key={s} className="flex flex-col items-center gap-1.5" style={{ width: "25%" }}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 z-10 ${
                        done
                          ? "bg-gray-800 border-gray-800 text-white"
                          : active
                          ? `${cfg.bgColor} ${cfg.color} ${cfg.borderColor} shadow-sm`
                          : "bg-white border-gray-200 text-gray-300"
                      }`}>
                        {done ? "✓" : i + 1}
                      </div>
                      <span className={`text-xs font-medium text-center leading-tight ${active ? cfg.color : done ? "text-gray-500" : "text-gray-300"}`}>
                        {cfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Tenant */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Inquilino</h2>
          <p className="text-sm font-medium text-gray-900">{inquilino.firstName} {inquilino.lastName}</p>
        </div>

        {/* Documents */}
        {docsByStage.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            <div className="px-5 py-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Documentos adjuntos</h2>
            </div>
            {docsByStage.map(({ stage, config, docs }) => (
              <div key={stage} className="px-5 py-4 space-y-2">
                <p className={`text-xs font-semibold ${config.color} mb-2`}>{config.label}</p>
                {docs.map((d) => (
                  <a
                    key={d.id}
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
                  >
                    <span className="text-gray-300 text-lg shrink-0">📄</span>
                    <span className="flex-1 text-sm text-gray-700 group-hover:text-blue-600 truncate">{d.label}</span>
                    <span className="text-xs text-gray-300 shrink-0">{new Date(d.uploadedAt).toLocaleDateString("es-AR")}</span>
                  </a>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* History timeline */}
        {tx.history.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Historial</h2>
            <div className="relative pl-4">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-100" />
              <div className="space-y-4">
                {tx.history.map((h, i) => (
                  <div key={h.id} className="relative flex items-start gap-3">
                    <span className={`absolute -left-[17px] top-1 w-2 h-2 rounded-full ring-2 ring-white ${i === tx.history.length - 1 ? "bg-gray-800" : "bg-gray-300"}`} />
                    <div>
                      <p className="text-sm text-gray-700">
                        {h.fromStage
                          ? <>{TRANSACTION_STAGES[h.fromStage].label} <span className="text-gray-500">→</span> {TRANSACTION_STAGES[h.toStage].label}</>
                          : <>Iniciada en <strong>{TRANSACTION_STAGES[h.toStage].label}</strong></>
                        }
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {new Date(h.changedAt).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-300 pb-4">
          Este portal es de solo lectura. Para consultas, contactar a {property.inmobiliaria.companyName}.
        </p>
      </main>
    </div>
  );
}
