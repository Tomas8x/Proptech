import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { saveProfile } from "./actions";
import { PasaporteStepper } from "@/components/PasaporteStepper";

const PROFILE_TYPES = [
  { value: "RELACION_DEPENDENCIA", label: "Relación de dependencia" },
  { value: "MONOTRIBUTISTA", label: "Monotributista" },
  { value: "AUTONOMO", label: "Autónomo" },
  { value: "JUBILADO", label: "Jubilado/a" },
];

const GUARANTEE_TYPES = [
  { value: "PROPIETARIO", label: "Garantía propietaria" },
  { value: "SEGURO_CAUCION", label: "Seguro de caución" },
  { value: "FIANZA", label: "Fianza personal" },
  { value: "NINGUNA", label: "Sin garantía" },
];

export default async function PerfilPage() {
  const user = await verifySession();
  const profile = await prisma.inquilinoProfile.findUnique({ where: { userId: user.id } });

  return (
    <div className="max-w-xl">
      <PasaporteStepper current={1} />
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Información personal</h1>
        <p className="text-gray-500 text-sm mt-1">Completá tus datos para armar tu pasaporte de inquilino.</p>
      </div>

      <form action={saveProfile} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input name="firstName" defaultValue={profile?.firstName ?? ""} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
            <input name="lastName" defaultValue={profile?.lastName ?? ""} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
            <input name="dni" defaultValue={profile?.dni ?? ""} required placeholder="12345678" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input name="phone" defaultValue={profile?.phone ?? ""} placeholder="+54 11 1234-5678" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ingresos mensuales (ARS)</label>
          <input name="monthlyIncome" type="number" defaultValue={profile?.monthlyIncome?.toString() ?? ""} required min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de perfil laboral</label>
          <select name="profileType" defaultValue={profile?.profileType ?? ""} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Seleccionar...</option>
            {PROFILE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de garantía</label>
          <div className="space-y-2">
            {GUARANTEE_TYPES.map((g) => (
              <label key={g.value} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="guaranteeType" value={g.value} defaultChecked={profile?.guaranteeType === g.value} required className="text-blue-500" />
                <span className="text-sm text-gray-700">{g.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Convivencia</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="hasPets" defaultChecked={profile?.hasPets} className="text-blue-500" />
              <span className="text-sm text-gray-700">Tengo mascotas</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="isSmoker" defaultChecked={profile?.isSmoker} className="text-blue-500" />
              <span className="text-sm text-gray-700">Soy fumador/a</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad de convivientes (incluido vos)</label>
          <input name="familySize" type="number" defaultValue={profile?.familySize?.toString() ?? "1"} min="1" max="10" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors">
          Guardar y continuar →
        </button>
      </form>
    </div>
  );
}
