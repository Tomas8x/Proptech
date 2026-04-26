import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { setRole } from "./actions";

export default async function RolePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role) redirect("/");

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full px-6">
        <h1 className="text-2xl font-semibold text-gray-900 text-center mb-2">
          ¿Cómo usarás la plataforma?
        </h1>
        <p className="text-gray-500 text-center mb-8">
          Seleccioná tu rol para continuar
        </p>
        <div className="grid grid-cols-2 gap-4">
          <form action={setRole.bind(null, "INQUILINO")}>
            <button
              type="submit"
              className="w-full p-6 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
            >
              <div className="text-3xl mb-3">🏠</div>
              <div className="font-medium text-gray-900">Soy inquilino</div>
              <div className="text-sm text-gray-500 mt-1">
                Busco una propiedad para alquilar
              </div>
            </button>
          </form>
          <form action={setRole.bind(null, "INMOBILIARIA")}>
            <button
              type="submit"
              className="w-full p-6 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
            >
              <div className="text-3xl mb-3">🏢</div>
              <div className="font-medium text-gray-900">Soy inmobiliaria</div>
              <div className="text-sm text-gray-500 mt-1">
                Gestiono propiedades y candidatos
              </div>
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
