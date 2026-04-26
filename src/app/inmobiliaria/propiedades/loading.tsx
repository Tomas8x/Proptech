export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <div className="h-7 bg-gray-200 rounded-lg w-36" />
          <div className="h-4 bg-gray-100 rounded w-24" />
        </div>
        <div className="h-9 bg-gray-200 rounded-lg w-36" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <div className="h-4 bg-gray-200 rounded-full w-20" />
                  <div className="h-4 bg-gray-100 rounded-full w-14" />
                </div>
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
              <div className="text-right space-y-2">
                <div className="h-5 bg-gray-200 rounded w-28" />
                <div className="h-3 bg-gray-100 rounded w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
