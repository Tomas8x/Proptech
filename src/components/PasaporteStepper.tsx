const STEPS = [
  { label: "Perfil" },
  { label: "Documentos" },
  { label: "Scores" },
];

export function PasaporteStepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((step, i) => {
        const num = i + 1;
        const done = num < current;
        const active = num === current;

        return (
          <div key={step.label} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${
                  done
                    ? "bg-green-500 border-green-500 text-white"
                    : active
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-gray-300 text-gray-400"
                }`}
              >
                {done ? "✓" : num}
              </div>
              <span
                className={`text-sm font-medium ${
                  active ? "text-gray-900" : done ? "text-gray-500" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-3 h-0.5 w-12 rounded-full transition-colors duration-300 ${done ? "bg-green-400" : "bg-gray-200"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
