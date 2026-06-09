'use client'
import { useState, useRef, useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { Satellite, Map as MapIcon, Maximize2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Session } from '@/types'

const PAKISTAN_CENTER: [number, number] = [30.3753, 69.3451]
const PAKISTAN_ZOOM = 5
const ESRI_ROAD = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
const ESRI_SAT  = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

type MapSession = Session & { latitude: number; longitude: number }

interface Province {
  name: string
  bounds?: [[number, number], [number, number]]
  center?: [number, number]
  zoom?: number
}

const PROVINCES: Province[] = [
  { name: 'Punjab',      bounds: [[27.7, 69.3], [34.0, 75.4]] },
  { name: 'Sindh',       bounds: [[23.5, 66.7], [28.5, 71.1]] },
  { name: 'KPK',         bounds: [[31.0, 69.2], [36.9, 74.1]] },
  { name: 'Balochistan', bounds: [[24.8, 60.9], [32.1, 70.3]] },
  { name: 'Islamabad',   center: [33.72, 73.06], zoom: 12 },
  { name: 'AJK',         bounds: [[33.1, 73.2], [35.1, 74.7]] },
  { name: 'GB',          bounds: [[35.0, 72.0], [37.2, 77.5]] },
]

function ProvinceController({ target }: { target: Province | null }) {
  const map = useMap()
  const prevKey = useRef('')
  useEffect(() => {
    const key = target?.name ?? '__all__'
    if (key === prevKey.current) return
    prevKey.current = key
    if (!target) {
      map.flyTo(PAKISTAN_CENTER, PAKISTAN_ZOOM, { duration: 1 })
    } else if (target.bounds) {
      map.flyToBounds(target.bounds as L.LatLngBoundsExpression, { duration: 1, padding: [30, 30] })
    } else if (target.center) {
      map.flyTo(target.center, target.zoom ?? 11, { duration: 1 })
    }
  }, [target, map])
  return null
}

function MapInstance({ onReady }: { onReady: (m: L.Map) => void }) {
  const map = useMap()
  const done = useRef(false)
  useEffect(() => {
    if (!map || done.current) return
    done.current = true
    onReady(map)
  }, [map, onReady])
  return null
}

export default function SessionMap({ sessions }: { sessions: Session[] }) {
  const [selected, setSelected]       = useState<Province | null>(null)
  const [isSatellite, setIsSatellite] = useState(false)
  const mapRef = useRef<L.Map | null>(null)

  const mapped = sessions.filter(
    (s): s is MapSession => s.latitude != null && s.longitude != null
  )

  function fitAll() {
    if (!mapRef.current || mapped.length === 0) return
    if (mapped.length === 1) {
      mapRef.current.setView([mapped[0].latitude, mapped[0].longitude], 14)
    } else {
      const bounds = L.latLngBounds(mapped.map(s => [s.latitude, s.longitude] as [number, number]))
      mapRef.current.fitBounds(bounds, { padding: [50, 50] })
    }
  }

  return (
    <div className="space-y-3">
      {/* Province quick-zoom pills */}
      <div className="flex flex-wrap gap-2">
        {PROVINCES.map(p => (
          <button key={p.name} type="button"
            onClick={() => setSelected(prev => prev?.name === p.name ? null : p)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              selected?.name === p.name
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
            }`}>
            {p.name}
          </button>
        ))}
        {selected && (
          <button type="button" onClick={() => setSelected(null)}
            className="px-3 py-1 text-xs rounded-full border border-gray-200 bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
            Reset view
          </button>
        )}
      </div>

      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border shadow-sm" style={{ height: 500 }}>
        <MapContainer
          center={PAKISTAN_CENTER}
          zoom={PAKISTAN_ZOOM}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
          zoomControl
        >
          <TileLayer
            key={isSatellite ? 'sat' : 'road'}
            url={isSatellite ? ESRI_SAT : ESRI_ROAD}
            attribution="Tiles &copy; Esri"
            maxZoom={20}
          />
          <MapInstance onReady={m => { mapRef.current = m }} />
          <ProvinceController target={selected} />

          {mapped.map(s => (
            <CircleMarker
              key={s.id}
              center={[s.latitude, s.longitude]}
              radius={9}
              fillColor="#2563eb"
              color="#1d4ed8"
              weight={2}
              fillOpacity={0.9}
            >
              <Popup maxWidth={260} className="p-0">
                <div className="p-3 min-w-[210px]" style={{ fontFamily: 'inherit' }}>
                  <p className="font-semibold text-gray-800 text-sm leading-tight mb-1">{s.topic}</p>
                  <p className="text-xs text-gray-500 mb-0.5">{s.school}</p>
                  {s.city && <p className="text-xs text-gray-400 mb-1.5">{s.city}</p>}
                  {s.bootcamp && (
                    <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 mb-2">
                      {(s.bootcamp as any).name ?? s.bootcamp}
                    </span>
                  )}
                  <div className="flex gap-3 text-xs text-gray-500 mb-1.5">
                    <span>👥 {(s as any).attendance_count ?? 0}</span>
                    <span>📝 {(s as any).feedback_count ?? 0}</span>
                  </div>
                  {(s.trainers ?? []).length > 0 && (
                    <p className="text-xs text-gray-500 mb-1">
                      {(s.trainers as any[]).map(t => t?.name ?? t).join(', ')}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mb-2">{formatDate(s.date)}</p>
                  <a href={`/sessions/${s.id}`}
                    className="text-xs font-semibold text-blue-600 hover:underline">
                    View Session →
                  </a>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Satellite toggle */}
        <button type="button" onClick={() => setIsSatellite(s => !s)}
          title={isSatellite ? 'Road view' : 'Satellite view'}
          className="absolute top-3 left-3 z-[1000] w-8 h-8 bg-white rounded shadow-md border flex items-center justify-center hover:bg-gray-50 transition-colors">
          {isSatellite
            ? <MapIcon className="w-4 h-4 text-gray-600" />
            : <Satellite className="w-4 h-4 text-gray-600" />}
        </button>

        {/* Fit all */}
        {mapped.length > 0 && (
          <button type="button" onClick={fitAll}
            className="absolute top-3 right-3 z-[1000] bg-white text-xs font-medium text-gray-700 px-3 py-1.5 rounded-md shadow-md border hover:bg-gray-50 transition-colors flex items-center gap-1.5">
            <Maximize2 className="w-3 h-3" /> Fit All
          </button>
        )}

        {/* Empty state */}
        {mapped.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[500]">
            <div className="bg-white/90 rounded-xl px-6 py-4 text-center shadow-sm">
              <p className="text-sm font-medium text-gray-500">No sessions with coordinates yet</p>
              <p className="text-xs text-gray-400 mt-1">Add a map location when creating sessions</p>
            </div>
          </div>
        )}
      </div>

      {mapped.length > 0 && (
        <p className="text-xs text-gray-400 text-right">
          {mapped.length} of {sessions.length} sessions plotted · click a dot for details
        </p>
      )}
    </div>
  )
}
