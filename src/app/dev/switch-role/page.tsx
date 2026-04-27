import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { switchRole } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

const ROLES = [
  { value: "INQUILINO", label: "Inquilino", color: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
  { value: "INMOBILIARIA", label: "Inmobiliaria", color: "bg-purple-100 text-purple-700 hover:bg-purple-200" },
  { value: "ADMIN", label: "Admin", color: "bg-red-100 text-red-700 hover:bg-red-200" },
] as const;

export default async function SwitchRolePage() {
  if (process.env.NODE_ENV === "production") notFound();

  const session = await auth();
  if (!session?.user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">No hay sesión activa. <a href="/login" className="text-blue-600 hover:underline">Iniciar sesión</a></p>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user) notFound();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl border border-gray-200 p-8 w-full max-w-sm space-y-6">
        <div>
          <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-1">Dev tool</p>
          <h1 className="text-lg font-semibold text-gray-900">Cambiar rol</h1>
          <p className="text-sm text-gray-500 mt-1">
            {user.name ?? user.email}
            {user.role && (
              <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                {user.role}
              </span>
            )}
          </p>
        </div>

        <div className="space-y-2">
          {ROLES.map(({ value, label, color }) => (
            <form
              key={value}
              action={async () => { "use server"; await switchRole(user.id, value); }}
            >
              <SubmitButton
                pendingText={`Cambiando a ${label}...`}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${color} ${user.role === value ? "ring-2 ring-offset-1 ring-current" : ""}`}
              >
                {user.role === value ? `✓ ${label} (actual)` : label}
              </SubmitButton>
            </form>
          ))}
        </div>

        <p className="text-xs text-gray-600 text-center">
          Cambia el rol en la DB y cierra la sesión para que el JWT se actualice.
        </p>
      </div>
    </div>
  );
}
