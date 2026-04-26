import { verifyRole } from "@/lib/dal";
import { NavLink } from "@/components/NavLink";
import { SubmitButton } from "@/components/SubmitButton";
import { signOut } from "@/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await verifyRole("ADMIN");

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-gray-900">PropTech <span className="text-xs text-red-500 font-semibold ml-1">Admin</span></span>
            <NavLink href="/admin">Panel</NavLink>
            <NavLink href="/admin/agencias">Agencias</NavLink>
            <NavLink href="/admin/inquilinos">Inquilinos</NavLink>
            <NavLink href="/admin/documentos">Documentos</NavLink>
          </div>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
            <SubmitButton className="text-sm text-gray-500 hover:text-gray-900 transition-colors" pendingText="Saliendo...">Salir</SubmitButton>
          </form>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
