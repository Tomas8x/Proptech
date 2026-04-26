import { verifyRole } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { NavLink } from "@/components/NavLink";
import { SubmitButton } from "@/components/SubmitButton";
import { signOut } from "@/auth";

export default async function InmobiliariaLayout({ children }: { children: React.ReactNode }) {
  const user = await verifyRole("INMOBILIARIA");
  const profile = await prisma.inmobiliariaProfile.findUnique({ where: { userId: user.id } });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-gray-900">PropTech</span>
            {profile && (
              <>
                <NavLink href="/inmobiliaria">Panel</NavLink>
                <NavLink href="/inmobiliaria/propiedades">Propiedades</NavLink>
                <NavLink href="/inmobiliaria/transacciones">Transacciones</NavLink>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 hidden sm:block">{profile?.companyName ?? user.email}</span>
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
