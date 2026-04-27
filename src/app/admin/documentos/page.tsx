import { verifyRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { resolveFlag } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

const DOC_LABELS: Record<string, string> = {
  DNI: "DNI",
  INCOME: "Comprobante de ingresos",
};

export default async function DocumentosPage() {
  await verifyRole("ADMIN");

  const [pending, resolved] = await Promise.all([
    prisma.flaggedDocument.findMany({
      where: { status: "PENDING" },
      include: { inquilino: { select: { firstName: true, lastName: true, dni: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.flaggedDocument.findMany({
      where: { status: "RESOLVED" },
      include: { inquilino: { select: { firstName: true, lastName: true } } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Documentos flaggeados</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {pending.length} pendiente{pending.length !== 1 ? "s" : ""} · {resolved.length} resuelto{resolved.length !== 1 ? "s" : ""} (últimos 20)
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-sm text-gray-400">Sin documentos pendientes de revisión.</p>
        </div>
      ) : (
        <div>
          <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-3">Pendientes</h2>
          <div className="space-y-3">
            {pending.map((d) => (
              <div key={d.id} className="bg-white rounded-xl border border-red-200 p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{DOC_LABELS[d.documentType] ?? d.documentType}</span>
                  </div>
                  <p className="font-medium text-gray-900 text-sm">{d.inquilino.firstName} {d.inquilino.lastName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">DNI {d.inquilino.dni}</p>
                  <p className="text-xs text-gray-600 mt-1 italic">&quot;{d.reason}&quot;</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(d.createdAt).toLocaleDateString("es-AR")}</p>
                </div>
                <form action={resolveFlag.bind(null, d.id)} className="shrink-0">
                  <SubmitButton className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors font-medium" pendingText="Resolviendo...">
                    Resolver
                  </SubmitButton>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      {resolved.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Resueltos recientes</h2>
          <div className="space-y-2">
            {resolved.map((d) => (
              <div key={d.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between gap-4 opacity-70">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">{DOC_LABELS[d.documentType] ?? d.documentType}</span>
                    <p className="text-sm text-gray-600">{d.inquilino.firstName} {d.inquilino.lastName}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 italic">&quot;{d.reason}&quot;</p>
                </div>
                <span className="text-xs text-green-600 font-medium shrink-0">Resuelto</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
