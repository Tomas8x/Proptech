import { verifyRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { addManualCandidate } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

const GUARANTEE_TYPES = [
  { value: "PROPIETARIO", label: "Garantía propietaria" },
  { value: "SEGURO_CAUCION", label: "Seguro de caución" },
  { value: "FIANZA", label: "Fianza personal" },
  { value: "NINGUNA", label: "Sin garantía" },
];

const PROFILE_TYPES = [
  { value: "RELACION_DEPENDENCIA", label: "Relación de dependencia" },
  { value: "MONOTRIBUTISTA", label: "Monotributista" },
  { value: "AUTONOMO", label: "Autónomo" },
  { value: "JUBILADO", label: "Jubilado/a" },
];

export default async function CandidatoManualPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await verifyRole("INMOBILIARIA");

  const profile = await prisma.inmobiliariaProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/inmobiliaria/onboarding");

  const property = await prisma.property.findUnique({ where: { id, inmobiliariaId: profile.id } });
  if (!property) notFound();

  const action = addManualCandidate.bind(null, id);

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <a href={`/inmobiliaria/propiedades/${id}`} className="text-sm text-blue-600 hover:underline">← Volver a {property.title}</a>
        <h1 className="text-xl font-semibold text-gray-900 mt-2">Agregar candidato externo</h1>
        <p className="text-gray-500 text-sm mt-1">Para candidatos que llegaron por fuera de la plataforma. Se calculará su compatibilidad por IA.</p>
      </div>

      <form action={action} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input name="firstName" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
            <input name="lastName" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input name="phone" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input name="email" type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ingresos mensuales (ARS)</label>
          <input name="monthlyIncome" type="number" required min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de garantía</label>
          <div className="space-y-2">
            {GUARANTEE_TYPES.map((g) => (
              <label key={g.value} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="guaranteeType" value={g.value} required className="text-blue-500" />
                <span className="text-sm text-gray-700">{g.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de empleo</label>
          <select name="profileType" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">No especificado</option>
            {PROFILE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Convivencia</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="hasPets" className="text-blue-500" />
              <span className="text-sm text-gray-700">Tiene mascotas</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="isSmoker" className="text-blue-500" />
              <span className="text-sm text-gray-700">Es fumador/a</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad de convivientes</label>
          <input name="familySize" type="number" min="1" max="10" defaultValue="1" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas internas (opcional)</label>
          <textarea name="notes" rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <SubmitButton pendingText="Calculando compatibilidad..." className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors">
          Guardar y calcular compatibilidad
        </SubmitButton>
      </form>
    </div>
  );
}
