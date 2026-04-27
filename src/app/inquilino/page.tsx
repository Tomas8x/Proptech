import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function InquilinoHome() {
  const user = await verifySession();

  const profile = await prisma.inquilinoProfile.findUnique({
    where: { userId: user.id },
    include: { verazScore: true, confianzaScore: true },
  });

  const steps = [
    { label: "Perfil completo", done: Boolean(profile?.dni), href: "/inquilino/pasaporte/perfil" },
    { label: "Documentos subidos", done: Boolean(profile?.dniImagePath && profile?.incomeDocPath), href: "/inquilino/pasaporte/documentos" },
    { label: "Score Veraz", done: Boolean(profile?.verazScore), href: "/inquilino/pasaporte/score" },
    { label: "Score Confianza", done: Boolean(profile?.confianzaScore), href: "/inquilino/pasaporte/score" },
  ];

  const completedSteps = steps.filter((s) => s.done).length;
  const pasaporteComplete = completedSteps === steps.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Bienvenido</h1>
        <p className="text-gray-500 mt-1">Completá tu pasaporte para postularte a propiedades</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-gray-900">Mi Pasaporte</h2>
          <span className="text-sm text-gray-500">{completedSteps}/{steps.length} pasos</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${(completedSteps / steps.length) * 100}%` }}
          />
        </div>
        <ul className="space-y-2">
          {steps.map((step) => (
            <li key={step.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${step.done ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {step.done ? "✓" : "·"}
                </span>
                <span className="text-sm text-gray-700">{step.label}</span>
              </div>
              {!step.done && (
                <Link href={step.href} className="text-xs text-blue-600 hover:underline">Completar</Link>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/inquilino/propiedades"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5 hover:bg-blue-50/20 transition-all duration-200"
        >
          <div className="text-2xl mb-2">🏠</div>
          <div className="font-medium text-gray-900">Ver propiedades</div>
          <div className="text-sm text-gray-500 mt-1">Propiedades compatibles con tu perfil</div>
          {!pasaporteComplete && <div className="text-xs text-orange-500 mt-2">Completá el pasaporte para postularte</div>}
        </Link>
        <Link href="/inquilino/postulaciones" className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5 hover:bg-blue-50/20 transition-all duration-200">
          <div className="text-2xl mb-2">📋</div>
          <div className="font-medium text-gray-900">Mis postulaciones</div>
          <div className="text-sm text-gray-500 mt-1">Seguí el estado de tus solicitudes</div>
        </Link>
      </div>
    </div>
  );
}
