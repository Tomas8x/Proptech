export default function Loading() {
  return (
    <div className="max-w-2xl space-y-5 animate-pulse">
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="h-4 bg-gray-200 rounded-full w-24" />
          <div className="h-4 bg-gray-100 rounded-full w-20" />
        </div>
        <div className="h-7 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 bg-gray-100 rounded w-24" />
              <div className="h-5 bg-gray-200 rounded w-28" />
            </div>
          ))}
        </div>
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-2/3" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <div className="h-10 bg-gray-200 rounded-lg w-full" />
      </div>
    </div>
  );
}
