export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 bg-gray-200 rounded-lg w-48" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-200 rounded w-2/3" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
            </div>
            <div className="h-6 bg-gray-200 rounded-full w-24" />
          </div>
          <div className="h-4 bg-gray-100 rounded w-full" />
        </div>
      ))}
    </div>
  );
}
