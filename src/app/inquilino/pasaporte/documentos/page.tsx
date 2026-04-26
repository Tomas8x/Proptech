import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { uploadDocuments } from "./actions";
import { PasaporteStepper } from "@/components/PasaporteStepper";
import { SubmitButton } from "@/components/SubmitButton";

export default async function DocumentosPage() {
  const user = await verifySession();
  const profile = await prisma.inquilinoProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/inquilino/pasaporte/perfil");

  return (
    <div className="max-w-xl">
      <PasaporteStepper current={2} />
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Documentación</h1>
        <p className="text-gray-500 text-sm mt-1">Subí tu DNI y comprobante de ingresos para obtener tu score.</p>
      </div>

      <form action={uploadDocuments} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Foto del DNI <span className="text-gray-400">(JPG o PNG)</span>
          </label>
          {profile.dniImagePath && (
            <p className="text-xs text-green-600 mb-2">✓ Ya tenés un DNI subido — podés reemplazarlo</p>
          )}
          <input
            name="dni"
            type="file"
            accept="image/jpeg,image/png"
            className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Comprobante de ingresos <span className="text-gray-400">(PDF)</span>
          </label>
          {profile.incomeDocPath && (
            <p className="text-xs text-green-600 mb-2">✓ Ya tenés un comprobante subido — podés reemplazarlo</p>
          )}
          <input
            name="income"
            type="file"
            accept="application/pdf"
            className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <p className="text-xs text-gray-400">
          Tus documentos se almacenan de forma segura y solo son visibles para las inmobiliarias a las que te postuled.
        </p>

        <SubmitButton pendingText="Subiendo..." className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors">
          Subir documentos →
        </SubmitButton>
      </form>
    </div>
  );
}
