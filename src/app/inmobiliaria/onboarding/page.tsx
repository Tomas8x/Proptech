import { verifyRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { saveOnboarding } from "./actions";

export default async function OnboardingPage() {
  const user = await verifyRole("INMOBILIARIA");
  const profile = await prisma.inmobiliariaProfile.findUnique({ where: { userId: user.id } });
  if (profile) redirect("/inmobiliaria/propiedades");

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Configurar perfil de inmobiliaria</h1>
        <p className="text-gray-500 text-sm mt-1">Completá los datos de tu empresa para empezar.</p>
      </div>

      <form action={saveOnboarding} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la empresa</label>
          <input name="companyName" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CUIT</label>
          <input name="cuit" required placeholder="30-12345678-9" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <input name="phone" placeholder="+54 11 1234-5678" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors">
          Guardar y continuar →
        </button>
      </form>
    </div>
  );
}
