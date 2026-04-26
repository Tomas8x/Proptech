import { verifyRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { TRANSACTION_STAGES, STAGE_ORDER } from "@/config/transaction";
import { SubmitButton } from "@/components/SubmitButton";
import { advanceStage, addNote, uploadTransactionDoc } from "./actions";

const GUARANTEE_LABELS: Record<string, string> = {
  PROPIETARIO: "Prop. propietaria",
  SEGURO_CAUCION: "Seg. de caución",
  FIANZA: "Fianza",
  NINGUNA: "Sin garantía",
};

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await verifyRole("INMOBILIARIA");
  const profile = await prisma.inmobiliariaProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/inmobiliaria/onboarding");

  const tx = await prisma.transaction.findFirst({
    where: { id, postulacion: { property: { inmobiliariaId: profile.id } } },
    include: {
      postulacion: {
        include: {
          property: true,
          inquilino: { include: { verazScore: true, confianzaScore: true } },
        },
      },
      documents: { orderBy: { uploadedAt: "asc" } },
      notes: { include: { author: true }, orderBy: { createdAt: "asc" } },
      history: { orderBy: { changedAt: "asc" } },
    },
  });

  if (!tx) notFound();

  const stageConfig = TRANSACTION_STAGES[tx.stage];
  const nextStage = stageConfig.next;
  const nextLabel = nextStage ? TRANSACTION_STAGES[nextStage].label : null;
  const currentStageIndex = STAGE_ORDER.indexOf(tx.stage);
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/portal/${tx.portalToken}`;

  const docsByStage = STAGE_ORDER.map((s) => ({
    stage: s,
    config: TRANSACTION_STAGES[s],
    docs: tx.documents.filter((d) => d.stage === s),
  }));

  const { inquilino, property } = tx.postulacion;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Transacción</p>
            <h1 className="text-lg font-semibold text-gray-900">{property.title}</h1>
            <p className="text-sm text-gray-500">{inquilino.firstName} {inquilino.lastName} · {GUARANTEE_LABELS[inquilino.guaranteeType] ?? inquilino.guaranteeType}</p>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${stageConfig.bgColor} ${stageConfig.color} border ${stageConfig.borderColor}`}>
            {stageConfig.label}
          </div>
        </div>

        {/* Stage stepper */}
        <div className="mt-5 flex items-center gap-0">
          {STAGE_ORDER.map((s, i) => {
            const done = i < currentStageIndex;
            const active = i === currentStageIndex;
            const cfg = TRANSACTION_STAGES[s];
            return (
              <div key={s} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
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

        {/* Advance button */}
        {nextStage && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <form action={async () => { "use server"; await advanceStage(id); }}>
              <SubmitButton
                pendingText="Avanzando..."
                className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Avanzar a {nextLabel} →
              </SubmitButton>
            </form>
          </div>
        )}
        {!nextStage && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm text-gray-400">Transacción finalizada</span>
          </div>
        )}
      </div>

      {/* Tenant summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-medium text-gray-900 mb-3">Inquilino</h2>
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <span>DNI: {inquilino.dni}</span>
          <span>Ingresos: ARS {Number(inquilino.monthlyIncome).toLocaleString("es-AR")}</span>
          <span>Garantía: {GUARANTEE_LABELS[inquilino.guaranteeType] ?? inquilino.guaranteeType}</span>
          {inquilino.verazScore && <span>Veraz: {inquilino.verazScore.score}</span>}
          {inquilino.confianzaScore && <span>Confianza: {inquilino.confianzaScore.score}/100</span>}
        </div>
      </div>

      {/* Documents per stage */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
        <h2 className="text-sm font-medium text-gray-900">Documentos</h2>
        {docsByStage.map(({ stage, config, docs }) => (
          <div key={stage}>
            <p className={`text-xs font-medium mb-2 ${config.color}`}>{config.label}</p>
            {docs.length > 0 ? (
              <ul className="space-y-1 mb-3">
                {docs.map((d) => (
                  <li key={d.id} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="text-gray-300">•</span>
                    <a href={d.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600 truncate">{d.label}</a>
                    <span className="text-gray-300 shrink-0">{new Date(d.uploadedAt).toLocaleDateString("es-AR")}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-300 mb-2">Sin documentos adjuntos</p>
            )}
            {config.suggestedDocs.length > 0 && (
              <p className="text-xs text-gray-400">Sugeridos: {config.suggestedDocs.join(" · ")}</p>
            )}
          </div>
        ))}

        {/* Upload form for current stage */}
        {nextStage !== null || tx.stage === "FINALIZADO" ? (
          tx.stage !== "FINALIZADO" && (
            <form
              action={async (fd) => { "use server"; await uploadTransactionDoc(id, fd); }}
              className="border-t border-gray-100 pt-4 flex flex-wrap gap-3 items-end"
            >
              <div className="flex-1 min-w-48">
                <label className="text-xs text-gray-500 block mb-1">Etiqueta del documento</label>
                <input
                  name="label"
                  required
                  placeholder={stageConfig.suggestedDocs[0] ?? "Ej: Contrato firmado"}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1 min-w-48">
                <label className="text-xs text-gray-500 block mb-1">Archivo</label>
                <input
                  name="file"
                  type="file"
                  required
                  className="w-full text-sm text-gray-900 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
              </div>
              <SubmitButton
                pendingText="Subiendo..."
                className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors shrink-0"
              >
                Adjuntar
              </SubmitButton>
            </form>
          )
        ) : null}
      </div>

      {/* Notes (inmobiliaria only) */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-medium text-gray-900">Notas internas</h2>
        {tx.notes.length === 0 ? (
          <p className="text-xs text-gray-300">Sin notas</p>
        ) : (
          <ul className="space-y-3">
            {tx.notes.map((n) => (
              <li key={n.id} className="text-sm">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-gray-700">{n.author.name ?? n.author.email}</span>
                  <span className="text-xs text-gray-300">{new Date(n.createdAt).toLocaleDateString("es-AR")}</span>
                  {n.stage && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${TRANSACTION_STAGES[n.stage].bgColor} ${TRANSACTION_STAGES[n.stage].color}`}>
                      {TRANSACTION_STAGES[n.stage].label}
                    </span>
                  )}
                </div>
                <p className="text-gray-600">{n.body}</p>
              </li>
            ))}
          </ul>
        )}
        <form
          action={async (fd) => { "use server"; await addNote(id, fd.get("body") as string); }}
          className="flex gap-2"
        >
          <input
            name="body"
            required
            placeholder="Agregar nota interna..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <SubmitButton
            pendingText="..."
            className="bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors shrink-0"
          >
            Agregar
          </SubmitButton>
        </form>
      </div>

      {/* Shared portal link */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-medium text-gray-900 mb-2">Portal compartido</h2>
        <p className="text-xs text-gray-500 mb-3">Enviá este enlace al inquilino y al propietario. No requiere cuenta.</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 truncate">
            {portalUrl}
          </code>
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline shrink-0"
          >
            Abrir →
          </a>
        </div>
      </div>

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
    </div>
  );
}
