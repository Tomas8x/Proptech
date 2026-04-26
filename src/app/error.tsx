"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Algo salió mal</h1>
          <p className="text-gray-500 text-sm mb-6">{error.message ?? "Error inesperado. Intentá de nuevo."}</p>
          <button onClick={reset} className="cursor-pointer bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700">
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
