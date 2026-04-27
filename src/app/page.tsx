import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

const ROLE_HOME: Record<string, string> = {
  INQUILINO: "/inquilino",
  INMOBILIARIA: "/inmobiliaria",
  ADMIN: "/admin",
};

export default async function Home() {
  const session = await auth();

  if (session?.user?.role) {
    const home = ROLE_HOME[session.user.role];
    if (home) redirect(home);
  }

  if (session?.user && !session.user.role) {
    redirect("/register/role");
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-gray-900">PropTech</span>
          <Link
            href="/login"
            className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ingresar
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl text-center">
          <div className="inline-block bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full mb-6">
            Plataforma de alquileres con IA
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
            Alquilá más rápido,<br />con menos fricción
          </h1>
          <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">
            Conectamos inquilinos calificados con inmobiliarias usando inteligencia artificial para hacer el proceso transparente y eficiente.
          </p>
          <Link
            href="/login"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 hover:shadow-lg hover:-translate-y-px transition-all duration-200 text-sm"
          >
            Empezar gratis →
          </Link>

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm hover:border-gray-300 transition-all duration-200">
              <div className="text-xl mb-3">📋</div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">Pasaporte Inquilino</h3>
              <p className="text-sm text-gray-500">
                Armá tu perfil con DNI, ingresos y score Veraz. Postulate con un solo clic.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm hover:border-gray-300 transition-all duration-200">
              <div className="text-xl mb-3">🤖</div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">Score de Confianza IA</h3>
              <p className="text-sm text-gray-500">
                Nuestro motor analiza tus documentos y calcula tu compatibilidad con cada propiedad.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm hover:border-gray-300 transition-all duration-200">
              <div className="text-xl mb-3">🏢</div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">Panel Inmobiliaria</h3>
              <p className="text-sm text-gray-500">
                Recibí candidatos rankeados por compatibilidad y gestioná transacciones en un solo lugar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
