export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-200 rounded-xl" />
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 rounded w-28" />
          <div className="h-3 bg-gray-100 rounded w-48" />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Trend chart */}
      <div className="bg-white rounded-xl h-56 shadow-sm" />

      {/* Feedback health */}
      <div className="bg-white rounded-xl h-48 shadow-sm" />

      {/* Leaderboard + bootcamp */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-xl h-64 shadow-sm" />
        <div className="lg:col-span-2 bg-white rounded-xl h-64 shadow-sm" />
      </div>

      {/* Cities + schools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl h-48 shadow-sm" />
        <div className="bg-white rounded-xl h-48 shadow-sm" />
      </div>
    </div>
  )
}
