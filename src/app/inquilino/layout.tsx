import { verifyRole } from "@/lib/dal";
import { NavLink } from "@/components/NavLink";
import { SubmitButton } from "@/components/SubmitButton";
import { signOut } from "@/auth";

export default async function InquilinoLayout({ children }: { children: React.ReactNode }) {
  const user = await verifyRole("INQUILINO");

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-gray-900">PropTech</span>
            <NavLink href="/inquilino">Inicio</NavLink>
            <NavLink href="/inquilino/pasaporte">Mi Pasaporte</NavLink>
            <NavLink href="/inquilino/propiedades">Propiedades</NavLink>
            <NavLink href="/inquilino/postulaciones">Mis Postulaciones</NavLink>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">{user.email}</span>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
              <SubmitButton className="text-sm text-gray-500 hover:text-gray-900 transition-colors" pendingText="Saliendo...">Salir</SubmitButton>
            </form>
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
