'use client'
import { useState, useRef, useEffect, useMemo } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import { Search, X, Satellite, Map as MapIcon, LocateFixed } from 'lucide-react'

const PAKISTAN_CENTER: [number, number] = [30.3753, 69.3451]
const ESRI_ROAD = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
const ESRI_SAT  = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

interface Props {
  value: { lat: number; lng: number } | null
  onChange: (v: { lat: number; lng: number } | null) => void
}

function ClickHandler({ onMapClick }: { onMapClick: (p: { lat: number; lng: number }) => void }) {
  useMapEvents({ click: (e) => onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng }) })
  return null
}

function FlyController({ target }: { target: { lat: number; lng: number } | null }) {
  const map = useMap()
  const prevKey = useRef('')
  useEffect(() => {
    if (!map || !target) return
    const key = `${target.lat.toFixed(6)},${target.lng.toFixed(6)}`
    if (key === prevKey.current) return
    prevKey.current = key
    map.flyTo([target.lat, target.lng], 15, { duration: 0.8 })
  }, [target, map])
  return null
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    return (data.display_name as string) ?? ''
  } catch {
    return ''
  }
}

export default function LocationPicker({ value, onChange }: Props) {
  const [query, setQuery]         = useState('')
  const [results, setResults]     = useState<NominatimResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [address, setAddress]     = useState('')
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(value)
  const [isSatellite, setIsSatellite] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapRef  = useRef<HTMLDivElement>(null)

  const pinIcon = useMemo(() => L.divIcon({
    className: '',
    html: `<div style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35))">
      <svg viewBox="0 0 28 42" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="42">
        <path d="M14 0C6.27 0 0 6.27 0 14c0 9.8 14 28 14 28S28 23.8 28 14C28 6.27 21.73 0 14 0z" fill="#2563eb"/>
        <circle cx="14" cy="14" r="6" fill="white"/>
      </svg>
    </div>`,
    iconSize: [28, 42],
    iconAnchor: [14, 42],
  }), [])

  // Close dropdown on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setShowResults(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  function handleQueryChange(val: string) {
    setQuery(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!val.trim()) { setResults([]); setShowResults(false); return }

    timerRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&countrycodes=pk&format=json&limit=6`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const data: NominatimResult[] = await res.json()
        setResults(data)
        setShowResults(data.length > 0)
      } catch { /* network */ }
      setSearching(false)
    }, 400)
  }

  function selectResult(r: NominatimResult) {
    const pos = { lat: parseFloat(r.lat), lng: parseFloat(r.lon) }
    const parts = r.display_name.split(',')
    setQuery(parts[0])
    setAddress(parts.slice(0, 2).join(','))
    setResults([])
    setShowResults(false)
    setFlyTarget(pos)
    onChange(pos)
  }

  async function handleMapClick(pos: { lat: number; lng: number }) {
    onChange(pos)
    // don't re-fly on click — just update pin; address resolves async
    const addr = await reverseGeocode(pos.lat, pos.lng)
    setAddress(addr)
  }

  async function handleDragEnd(e: L.LeafletEvent) {
    const latlng = (e.target as L.Marker).getLatLng()
    const pos = { lat: latlng.lat, lng: latlng.lng }
    onChange(pos)
    const addr = await reverseGeocode(pos.lat, pos.lng)
    setAddress(addr)
  }

  function locate() {
    navigator.geolocation?.getCurrentPosition(async (pos) => {
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      onChange(loc)
      setFlyTarget(loc)
      const addr = await reverseGeocode(loc.lat, loc.lng)
      setAddress(addr)
    })
  }

  function clear() {
    onChange(null)
    setAddress('')
    setFlyTarget(null)
    setQuery('')
    setResults([])
  }

  return (
    <div className="space-y-2">
      {/* Search */}
      <div ref={wrapRef} className="relative z-[1000]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            placeholder="Search for a school, area or landmark in Pakistan…"
            className="w-full rounded-md border border-input bg-background pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {query && (
            <button type="button"
              onClick={() => { setQuery(''); setResults([]); setShowResults(false) }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {(showResults || searching) && (
          <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            {searching && (
              <div className="px-4 py-2.5 text-sm text-gray-400">Searching…</div>
            )}
            {!searching && results.map(r => (
              <button key={r.place_id} type="button" onMouseDown={() => selectResult(r)}
                className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-gray-50 last:border-0">
                <p className="text-sm font-medium text-gray-800">{r.display_name.split(',')[0]}</p>
                <p className="text-xs text-gray-400 truncate">
                  {r.display_name.split(',').slice(1, 3).join(',')}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border" style={{ height: 260 }}>
        <MapContainer
          center={PAKISTAN_CENTER}
          zoom={5}
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
          <FlyController target={flyTarget} />
          <ClickHandler onMapClick={handleMapClick} />
          {value && (
            <Marker
              position={[value.lat, value.lng]}
              icon={pinIcon}
              draggable
              eventHandlers={{ dragend: handleDragEnd }}
            />
          )}
        </MapContainer>

        {/* Overlay controls */}
        <div className="absolute bottom-3 left-3 flex flex-col gap-1.5 z-[1000]">
          <button type="button" onClick={() => setIsSatellite(s => !s)}
            title={isSatellite ? 'Road view' : 'Satellite view'}
            className="w-8 h-8 bg-white rounded shadow-md border flex items-center justify-center hover:bg-gray-50 transition-colors">
            {isSatellite
              ? <MapIcon className="w-4 h-4 text-gray-600" />
              : <Satellite className="w-4 h-4 text-gray-600" />}
          </button>
          <button type="button" onClick={locate} title="Use my location"
            className="w-8 h-8 bg-white rounded shadow-md border flex items-center justify-center hover:bg-gray-50 transition-colors">
            <LocateFixed className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Status */}
      {value ? (
        <div className="flex items-center justify-between">
          <p className="text-xs text-green-600 font-medium truncate pr-4">
            {address || `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`}
          </p>
          <button type="button" onClick={clear}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors shrink-0">
            Clear
          </button>
        </div>
      ) : (
        <p className="text-xs text-gray-400">
          Search above or click the map to drop a pin — drag to fine-tune position
        </p>
      )}
    </div>
  )
}
