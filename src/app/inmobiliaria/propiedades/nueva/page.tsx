import { verifyRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { createProperty } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

const PROPERTY_TYPES = [
  { value: "DEPARTAMENTO", label: "Departamento" },
  { value: "CASA", label: "Casa" },
  { value: "PH", label: "PH" },
  { value: "LOCAL", label: "Local comercial" },
  { value: "OFICINA", label: "Oficina" },
];

const GUARANTEE_TYPES = [
  { value: "PROPIETARIO", label: "Garantía propietaria" },
  { value: "SEGURO_CAUCION", label: "Seguro de caución" },
  { value: "FIANZA", label: "Fianza personal" },
  { value: "NINGUNA", label: "Sin garantía" },
];

export default async function NuevaPage() {
  const user = await verifyRole("INMOBILIARIA");
  const profile = await prisma.inmobiliariaProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/inmobiliaria/onboarding");

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Nueva propiedad</h1>
        <p className="text-gray-500 text-sm mt-1">Completá los datos de la propiedad y las condiciones para los candidatos.</p>
      </div>

      <form action={createProperty} className="space-y-6">
        {/* Datos básicos */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-medium text-gray-900">Datos de la propiedad</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título del aviso</label>
            <input name="title" required placeholder="Ej: Departamento 2 amb. en Palermo" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input name="address" required placeholder="Ej: Av. Santa Fe 1234" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barrio</label>
              <input name="neighborhood" placeholder="Ej: Palermo" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
              <input name="city" defaultValue="Buenos Aires" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select name="propertyType" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Seleccionar...</option>
                {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ambientes</label>
              <input name="bedrooms" type="number" required min="1" max="20" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Baños</label>
              <input name="bathrooms" type="number" defaultValue="1" min="1" max="10" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Superficie (m²)</label>
              <input name="area" type="number" required min="1" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alquiler mensual</label>
              <input name="price" type="number" required min="1" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
              <select name="currency" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
            <textarea name="description" rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link externo (Zonaprop / Argenprop / MercadoLibre)</label>
            <input name="externalLink" type="url" placeholder="https://..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fotos (URLs, opcional)</label>
            <div className="space-y-2">
              <input name="image1" type="url" placeholder="URL foto 1" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input name="image2" type="url" placeholder="URL foto 2" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input name="image3" type="url" placeholder="URL foto 3" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* Perfil de candidato ideal */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-medium text-gray-900">Condiciones para candidatos</h2>
          <p className="text-xs text-gray-400">Estas condiciones se usan para calcular la compatibilidad con los postulantes.</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Score Veraz mínimo</label>
              <input name="minVerazScore" type="number" min="500" max="999" placeholder="Ej: 700" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ingresos mínimos (veces el alquiler)</label>
              <input name="minIncomeMultiplier" type="number" step="0.5" min="1" max="10" placeholder="Ej: 3" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Garantías aceptadas</label>
            <div className="space-y-2">
              {GUARANTEE_TYPES.map((g) => (
                <label key={g.value} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="acceptedGuarantees" value={g.value} className="text-blue-500" />
                  <span className="text-sm text-gray-700">{g.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Convivencia permitida</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="petsAllowed" defaultChecked className="text-blue-500" />
                <span className="text-sm text-gray-700">Se aceptan mascotas</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="smokersAllowed" className="text-blue-500" />
                <span className="text-sm text-gray-700">Se aceptan fumadores</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="childrenAllowed" defaultChecked className="text-blue-500" />
                <span className="text-sm text-gray-700">Se aceptan niños/as</span>
              </label>
            </div>
          </div>
        </div>

        <SubmitButton pendingText="Publicando..." className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors">
          Publicar propiedad
        </SubmitButton>
      </form>
    </div>
  );
}
