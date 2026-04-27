import { signIn } from "@/auth";

export const dynamic = "force-dynamic";

const DEV_ACCOUNTS = [
  { email: "admin@proptech.com", label: "Admin", color: "bg-red-50 text-red-700 hover:bg-red-100 border-red-200" },
  { email: "palermo@proptech.com", label: "Palermo Propiedades", color: "bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200" },
  { email: "bsas@proptech.com", label: "BuenosAires Propiedades", color: "bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200" },
  { email: "capital@proptech.com", label: "Capital Real Estate", color: "bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200" },
];

export default function LoginPage() {
  const devPassword = process.env.DEV_PASSWORD;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-sm w-full px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">PropTech</h1>
          <p className="text-gray-500 text-sm">Plataforma inteligente de alquileres</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-6">
          {/* Google SSO */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Ingresá a tu cuenta</h2>
            <p className="text-sm text-gray-500 mb-6">Usamos Google para autenticarte de forma segura.</p>
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-xl px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continuar con Google
              </button>
            </form>
          </div>

          {/* Dev quick-login — only renders when DEV_PASSWORD is set */}
          {devPassword && (
            <div className="border-t border-gray-100 pt-5">
              <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-3">Dev access</p>
              <div className="space-y-2">
                {DEV_ACCOUNTS.map(({ email, label, color }) => (
                  <form
                    key={email}
                    action={async () => {
                      "use server";
                      await signIn("credentials", { email, password: devPassword, redirectTo: "/" });
                    }}
                  >
                    <button
                      type="submit"
                      className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${color}`}
                    >
                      {label}
                      <span className="ml-1.5 opacity-50">{email}</span>
                    </button>
                  </form>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          Al continuar aceptás los términos de uso de la plataforma.
        </p>
      </div>
    </main>
  );
}
