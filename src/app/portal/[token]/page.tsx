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
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-gray-900">PropTech</span>
          <span className="text-xs text-gray-400">Portal de seguimiento</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Property + stage */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">{property.inmobiliaria.companyName}</p>
              <h1 className="text-lg font-semibold text-gray-900">{property.title}</h1>
              <p className="text-sm text-gray-500">{property.address}</p>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-sm font-medium shrink-0 ${stageConfig.bgColor} ${stageConfig.color} border ${stageConfig.borderColor}`}>
              {stageConfig.label}
            </div>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-0 mt-4">
            {STAGE_ORDER.map((s, i) => {
              const done = i < currentStageIndex;
              const active = i === currentStageIndex;
              const cfg = TRANSACTION_STAGES[s];
              return (
                <div key={s} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                      done ? "bg-gray-800 border-gray-800 text-white" :
                      active ? `${cfg.bgColor} ${cfg.color} ${cfg.borderColor}` :
                      "bg-white border-gray-200 text-gray-300"
                    }`}>
                      {done ? "✓" : i + 1}
                    </div>
                    <span className={`text-xs mt-1 font-medium ${active ? cfg.color : done ? "text-gray-500" : "text-gray-300"}`}>
                      {cfg.label}
                    </span>
                  </div>
                  {i < STAGE_ORDER.length - 1 && (
                    <div className={`h-0.5 flex-1 -mt-4 ${i < currentStageIndex ? "bg-gray-800" : "bg-gray-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tenant */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-medium text-gray-900 mb-2">Inquilino</h2>
          <p className="text-sm text-gray-600">{inquilino.firstName} {inquilino.lastName}</p>
        </div>

        {/* Documents */}
        {docsByStage.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-medium text-gray-900">Documentos adjuntos</h2>
            {docsByStage.map(({ stage, config, docs }) => (
              <div key={stage}>
                <p className={`text-xs font-medium mb-2 ${config.color}`}>{config.label}</p>
                <ul className="space-y-1">
                  {docs.map((d) => (
                    <li key={d.id} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="text-gray-300">•</span>
                      <a href={d.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600 truncate">{d.label}</a>
                      <span className="text-gray-300 shrink-0">{new Date(d.uploadedAt).toLocaleDateString("es-AR")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* History */}
        {tx.history.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-medium text-gray-900 mb-3">Historial</h2>
            <ul className="space-y-2">
              {tx.history.map((h) => (
                <li key={h.id} className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="text-gray-300 shrink-0">{new Date(h.changedAt).toLocaleDateString("es-AR")}</span>
                  {h.fromStage ? (
                    <span>{TRANSACTION_STAGES[h.fromStage].label} → {TRANSACTION_STAGES[h.toStage].label}</span>
                  ) : (
                    <span>Iniciada en {TRANSACTION_STAGES[h.toStage].label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-center text-xs text-gray-300 pb-4">Este portal es de solo lectura. Para consultas, contactar a la inmobiliaria.</p>
      </main>
    </div>
  );
}
