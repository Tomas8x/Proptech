export const dynamic = "force-dynamic";

import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { computeScore } from "./actions";
import Link from "next/link";
import { PasaporteStepper } from "@/components/PasaporteStepper";

const VERAZ_BADGE: Record<string, string> = {
  Excelente: "bg-green-100 text-green-800 border-green-200",
  Bueno: "bg-blue-100 text-blue-800 border-blue-200",
  Regular: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Riesgoso: "bg-red-100 text-red-800 border-red-200",
};

const VERAZ_BAR_COLOR: Record<string, string> = {
  Excelente: "bg-green-500",
  Bueno: "bg-blue-500",
  Regular: "bg-yellow-500",
  Riesgoso: "bg-red-500",
};

function verazPct(score: number) {
  // Scale 500–999 to 0–100%
  return Math.round(((score - 500) / (999 - 500)) * 100);
}

export default async function ScorePage() {
  const user = await verifySession();

  const profile = await prisma.inquilinoProfile.findUnique({
    where: { userId: user.id },
    include: { verazScore: true, confianzaScore: true },
  });

  if (!profile) redirect("/inquilino/pasaporte/perfil");

  const veraz = profile.verazScore;
  const confianza = profile.confianzaScore;
  const dimensions = confianza?.dimensions as Record<string, string> | null;

  return (
    <div className="max-w-xl space-y-5">
      <PasaporteStepper current={3} />

      <div>
        <h1 className="text-xl font-semibold text-gray-900">Tus scores</h1>
        <p className="text-gray-500 text-sm mt-1">Resultados de la evaluación de tu perfil.</p>
      </div>

      {/* Veraz */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-gray-900">Score Veraz</h2>
          <span className="text-xs text-gray-600">Rango: 500–999</span>
        </div>
        {veraz ? (
          <div className="space-y-3">
            <div className="flex items-end gap-3">
              <div className="text-5xl font-bold text-gray-900 leading-none">{veraz.score}</div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  VERAZ_BADGE[veraz.range] ?? "bg-gray-100 text-gray-600 border-gray-200"
                }`}
              >
                {veraz.range}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>500 · Riesgoso</span>
                <span>999 · Excelente</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 relative">
                <div
                  className={`h-2.5 rounded-full transition-all ${
                    VERAZ_BAR_COLOR[veraz.range] ?? "bg-gray-400"
                  }`}
                  style={{ width: `${verazPct(veraz.score)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-300">
                <span>Riesgoso</span>
                <span>Regular</span>
                <span>Bueno</span>
                <span>Excelente</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Subí tus documentos para obtener tu score Veraz.</p>
        )}
      </div>

      {/* Confianza */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-gray-900">Score Confianza</h2>
          <span className="text-xs text-gray-600">Rango: 0–100</span>
        </div>
        {confianza ? (
          <div className="space-y-4">
            <div className="flex items-end gap-3">
              <div className="text-5xl font-bold text-gray-900 leading-none">{confianza.score}</div>
              <div className="pb-1">
                <div className="text-xs text-gray-600">/ 100</div>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${
                  confianza.score >= 75
                    ? "bg-green-500"
                    : confianza.score >= 50
                    ? "bg-blue-500"
                    : confianza.score >= 30
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${confianza.score}%` }}
              />
            </div>

            {dimensions && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {Object.entries(dimensions).map(([key, val]) => (
                  <div key={key} className="bg-gray-50 rounded-lg px-3 py-2">
                    <div className="text-xs text-gray-600 capitalize mb-0.5">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </div>
                    <div className="text-sm font-medium text-gray-700">{val}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <div className="text-xs font-medium text-blue-600 mb-1">Sugerencias de mejora</div>
              <p className="text-sm text-blue-800">{confianza.improvementText}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Tu score Confianza analiza tus documentos con IA y mide calidad documental, ratio de ingresos, tipo de garantía y completitud del perfil.
            </p>
            <form action={computeScore}>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Calcular Score Confianza
              </button>
            </form>
          </div>
        )}
      </div>

      {(veraz || confianza) && (
        <Link
          href="/inquilino/propiedades"
          className="block w-full text-center bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          Ver propiedades compatibles →
        </Link>
      )}
    </div>
  );
}
