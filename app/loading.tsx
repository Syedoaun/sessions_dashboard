export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero */}
      <div className="h-32 bg-blue-200 rounded-2xl" />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 bg-gray-100 rounded-xl" />
            <div className="space-y-2 flex-1">
              <div className="h-3 bg-gray-100 rounded w-3/4" />
              <div className="h-6 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>

      {/* Feedback health */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-xl" />
        ))}
      </div>

      {/* Recent sessions cards */}
      <div className="space-y-3">
        <div className="h-5 bg-gray-100 rounded w-40" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 h-36 shadow-sm" />
          ))}
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-xl h-64 shadow-sm" />
        <div className="lg:col-span-2 bg-white rounded-xl h-64 shadow-sm" />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl h-48 shadow-sm" />
    </div>
  )
}
