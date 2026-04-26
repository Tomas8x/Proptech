export default function Loading() {
  return (
    <div>
      <div className="h-7 bg-gray-200 rounded-lg w-56 animate-pulse mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <div className="h-4 bg-gray-200 rounded-full w-24" />
                  <div className="h-4 bg-gray-100 rounded-full w-16" />
                </div>
                <div className="h-5 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="flex gap-3 mt-1">
                  <div className="h-4 bg-gray-100 rounded w-12" />
                  <div className="h-4 bg-gray-100 rounded w-16" />
                  <div className="h-4 bg-gray-200 rounded w-28" />
                </div>
              </div>
              <div className="w-14 h-14 bg-gray-200 rounded-full shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
