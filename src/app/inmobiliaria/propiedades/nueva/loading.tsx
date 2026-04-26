export default function Loading() {
  return (
    <div className="max-w-xl space-y-4 animate-pulse">
      <div className="h-7 bg-gray-200 rounded-lg w-48" />
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-4 bg-gray-100 rounded w-36" />
            <div className="h-10 bg-gray-200 rounded-lg w-full" />
          </div>
        ))}
        <div className="h-10 bg-gray-300 rounded-lg w-full" />
      </div>
    </div>
  );
}
