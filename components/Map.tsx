'use client'

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useState } from 'react'
import { LatLngExpression } from 'leaflet'

// Marker draggable
function DraggableMarker({
  position,
  setPosition,
  setLokasi,
}: {
  position: LatLngExpression | null
  setPosition: (pos: LatLngExpression) => void
  setLokasi: (pos: { lat: number; lng: number }) => void
}) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng
      const newPos: LatLngExpression = [lat, lng]
      setPosition(newPos)
      setLokasi({ lat, lng })
    },
  })

  return position ? (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target
          const latLng = marker.getLatLng()
          setPosition([latLng.lat, latLng.lng])
          setLokasi({ lat: latLng.lat, lng: latLng.lng })
        },
      }}
    />
  ) : null
}

export default function Map({ setLokasi }: { setLokasi: (pos: { lat: number; lng: number }) => void }) {
  const [position, setPosition] = useState<LatLngExpression | null>(null)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<any[]>([])

  // Search lokasi pake Nominatim API
  const handleSearch = async () => {
    if (!search) return
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}`
    )
    const data = await res.json()
    setResults(data)
  }

  const handleSelect = (lat: string, lon: string) => {
    const newPos: LatLngExpression = [parseFloat(lat), parseFloat(lon)]
    setPosition(newPos)
    setLokasi({ lat: parseFloat(lat), lng: parseFloat(lon) })
    setResults([])
  }

  // Gunakan lokasi GPS user
  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          const newPos: LatLngExpression = [latitude, longitude]
          setPosition(newPos)
          setLokasi({ lat: latitude, lng: longitude })
        },
        (err) => {
          alert('Gagal mendeteksi lokasi: ' + err.message)
        }
      )
    } else {
      alert('Browser tidak mendukung geolokasi.')
    }
  }

  return (
    <div>
      {/* Search bar + Gunakan Lokasi Saya */}
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari lokasi (contoh: Alun-Alun Bandung)"
          className="w-full p-2 border rounded-md text-black"
        />
        <button
          type="button"
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Cari
        </button>
        <button
          type="button"
          onClick={handleUseMyLocation}
          className="px-4 py-2 bg-green-600 text-white rounded-md"
        >
          Gunakan Lokasi Saya
        </button>
      </div>

      {/* Search results */}
      {results.length > 0 && (
        <ul className="bg-white border rounded-md max-h-40 overflow-y-auto mb-2 text-black">
          {results.map((r, i) => (
            <li
              key={i}
              onClick={() => handleSelect(r.lat, r.lon)}
              className="p-2 hover:bg-gray-100 cursor-pointer"
            >
              {r.display_name}
            </li>
          ))}
        </ul>
      )}

      {/* Map */}
      <MapContainer
        center={position || [-6.9175, 107.6191]} // default Bandung
        zoom={13}
        style={{ height: '300px', width: '100%' }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DraggableMarker position={position} setPosition={setPosition} setLokasi={setLokasi} />
      </MapContainer>
    </div>
  )
}
