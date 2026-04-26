"use client";

export default function InmobiliariaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-red-200 p-8 text-center max-w-md">
      <h2 className="font-semibold text-gray-900 mb-2">Ocurrió un error</h2>
      <p className="text-gray-500 text-sm mb-6">{error.message ?? "No pudimos cargar esta página. Intentá de nuevo."}</p>
      <button onClick={reset} className="cursor-pointer bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700">
        Reintentar
      </button>
    </div>
  );
}
