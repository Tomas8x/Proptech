import { verifyRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { TRANSACTION_STAGES, STAGE_ORDER } from "@/config/transaction";
import { SubmitButton } from "@/components/SubmitButton";
import { CopyButton } from "@/components/CopyButton";
import { advanceStage, addNote, uploadTransactionDoc } from "./actions";

const GUARANTEE_LABELS: Record<string, string> = {
  PROPIETARIO: "Prop. propietaria",
  SEGURO_CAUCION: "Seg. de caución",
  FIANZA: "Fianza",
  NINGUNA: "Sin garantía",
};

function Initials({ name }: { name: string }) {
  const parts = name.split(" ").filter(Boolean);
  const initials = parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : name.slice(0, 2);
  return (
    <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center shrink-0 uppercase">
      {initials}
    </span>
  );
}

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
  const hdrs = await headers();
  const host = hdrs.get("host") ?? "";
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const portalUrl = `${proto}://${host}/portal/${tx.portalToken}`;

  const { inquilino, property } = tx.postulacion;

  return (
    <div className="max-w-2xl space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/inmobiliaria/transacciones" className="hover:text-gray-600 transition-colors">Transacciones</Link>
        <span>/</span>
        <span className="text-gray-600 truncate">{property.title}</span>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Stage color strip */}
        <div className={`h-1.5 w-full ${stageConfig.bgColor}`} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{property.title}</h1>
              <p className="text-sm text-gray-500">{property.address}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${stageConfig.bgColor} ${stageConfig.color} border ${stageConfig.borderColor}`}>
              {stageConfig.label}
            </span>
          </div>

          {/* Stepper */}
          <div className="relative">
            {/* Background line */}
            <div className="absolute top-3.5 left-[14px] right-[14px] h-0.5 bg-gray-100" />
            {/* Progress line */}
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
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 z-10 transition-all ${
                      done
                        ? "bg-gray-800 border-gray-800 text-white"
                        : active
                        ? `${cfg.bgColor} ${cfg.color} ${cfg.borderColor} shadow-sm`
                        : "bg-white border-gray-200 text-gray-500"
                    }`}>
                      {done ? "✓" : i + 1}
                    </div>
                    <span className={`text-xs font-medium text-center leading-tight ${active ? cfg.color : done ? "text-gray-600" : "text-gray-500"}`}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Advance / done */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            {nextStage ? (
              <form action={async () => { "use server"; await advanceStage(id); }} className="flex items-center gap-3">
                <SubmitButton
                  pendingText="Avanzando..."
                  className="bg-gray-900 text-white text-sm px-5 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Avanzar a {nextLabel} →
                </SubmitButton>
                <span className="text-xs text-gray-600">Acción irreversible</span>
              </form>
            ) : (
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs">✓</span>
                Transacción finalizada
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Inquilino */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Inquilino</h2>
        <div className="flex items-center gap-3">
          <Initials name={`${inquilino.firstName} ${inquilino.lastName}`} />
          <div>
            <p className="text-sm font-medium text-gray-900">{inquilino.firstName} {inquilino.lastName}</p>
            <p className="text-xs text-gray-600">DNI {inquilino.dni} · {GUARANTEE_LABELS[inquilino.guaranteeType] ?? inquilino.guaranteeType}</p>
          </div>
          <div className="ml-auto flex gap-3 text-xs text-gray-500">
            {inquilino.verazScore && (
              <span>Veraz <strong>{inquilino.verazScore.score}</strong></span>
            )}
            {inquilino.confianzaScore && (
              <span>Confianza <strong>{inquilino.confianzaScore.score}/100</strong></span>
            )}
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        <div className="px-5 py-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Documentos</h2>
        </div>

        {STAGE_ORDER.map((s) => {
          const cfg = TRANSACTION_STAGES[s];
          const docs = tx.documents.filter((d) => d.stage === s);
          const isCurrentStage = s === tx.stage;
          return (
            <div key={s} className="px-5 py-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                {docs.length > 0 && (
                  <span className="text-xs text-gray-600">({docs.length})</span>
                )}
              </div>

              {docs.length > 0 && (
                <div className="space-y-2">
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
              )}

              {docs.length === 0 && cfg.suggestedDocs.length > 0 && (
                <p className="text-xs text-gray-300">Sugeridos: {cfg.suggestedDocs.join(" · ")}</p>
              )}

              {/* Upload form only for current stage */}
              {isCurrentStage && tx.stage !== "FINALIZADO" && (
                <form
                  action={async (fd) => { "use server"; await uploadTransactionDoc(id, fd); }}
                  className="flex flex-wrap gap-2 items-end pt-1"
                >
                  <div className="flex-1 min-w-40">
                    <input
                      name="label"
                      required
                      placeholder={cfg.suggestedDocs[0] ?? "Etiqueta del documento"}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    />
                  </div>
                  <div className="flex-1 min-w-40">
                    <input
                      name="file"
                      type="file"
                      required
                      className="w-full text-xs text-gray-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-gray-100 file:text-gray-600 hover:file:bg-gray-200"
                    />
                  </div>
                  <SubmitButton
                    pendingText="Subiendo..."
                    className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shrink-0"
                  >
                    Adjuntar
                  </SubmitButton>
                </form>
              )}
            </div>
          );
        })}
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        <div className="px-5 py-4 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notas internas</h2>
          <span className="text-xs text-gray-300">Solo visible para la inmobiliaria</span>
        </div>

        <div className="px-5 py-4 space-y-4">
          {tx.notes.length === 0 ? (
            <p className="text-xs text-gray-300">Sin notas aún.</p>
          ) : (
            tx.notes.map((n) => (
              <div key={n.id} className="flex gap-3">
                <Initials name={n.author.name ?? n.author.email ?? "?"} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-700">{n.author.name ?? n.author.email}</span>
                    <span className="text-xs text-gray-300">{new Date(n.createdAt).toLocaleDateString("es-AR")}</span>
                    {n.stage && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${TRANSACTION_STAGES[n.stage].bgColor} ${TRANSACTION_STAGES[n.stage].color}`}>
                        {TRANSACTION_STAGES[n.stage].label}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{n.body}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-5 py-4">
          <form action={async (fd) => { "use server"; await addNote(id, fd.get("body") as string); }} className="flex gap-2">
            <input
              name="body"
              required
              placeholder="Agregar nota interna..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <SubmitButton
              pendingText="..."
              className="bg-gray-100 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium shrink-0"
            >
              Agregar
            </SubmitButton>
          </form>
        </div>
      </div>

      {/* Portal link */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Portal compartido</h2>
        <p className="text-xs text-gray-600 mb-3">Enlace de solo lectura para el inquilino y el propietario. No requiere cuenta.</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 truncate">
            {portalUrl}
          </code>
          <CopyButton text={portalUrl} />
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-blue-600 transition-colors"
          >
            Abrir →
          </a>
        </div>
      </div>

      {/* History */}
      {tx.history.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Historial</h2>
          <div className="relative pl-4">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-100" />
            <div className="space-y-4">
              {tx.history.map((h) => (
                <div key={h.id} className="relative flex items-start gap-3">
                  <span className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-gray-300 ring-2 ring-white" />
                  <div>
                    <p className="text-sm text-gray-700">
                      {h.fromStage
                        ? <>{TRANSACTION_STAGES[h.fromStage].label} <span className="text-gray-500">→</span> {TRANSACTION_STAGES[h.toStage].label}</>
                        : <>Iniciada en <strong>{TRANSACTION_STAGES[h.toStage].label}</strong></>
                      }
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">{new Date(h.changedAt).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
