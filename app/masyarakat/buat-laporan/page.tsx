'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'
import { Loader2, CheckCircle } from 'lucide-react'
import Footer from '@/components/Footer'

// Load Leaflet map client-side only
const MapContainer = dynamic(() => import('@/components/Map'), { ssr: false })

export default function BuatLaporanPage() {
  const [judul, setJudul] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [lokasi, setLokasi] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let fotoUrl = null

      // Upload foto ke Supabase Storage
      if (foto) {
        const fileName = `${Date.now()}-${foto.name}`
        const { error } = await supabase.storage
          .from('laporan-foto')
          .upload(fileName, foto)

        if (error) throw error

        const { data: publicUrl } = supabase.storage
          .from('laporan-foto')
          .getPublicUrl(fileName)

        fotoUrl = publicUrl.publicUrl
      }

      const user = JSON.parse(localStorage.getItem('user') || '{}')

      const { error: insertError } = await supabase.from('laporan').insert([
        {
          user_id: user.id,
          judul,
          deskripsi,
          latitude: lokasi?.lat,
          longitude: lokasi?.lng,
          foto_url: fotoUrl,
        },
      ])

      if (insertError) throw insertError

      setSuccess('Laporan berhasil dikirim 🎉')
      setJudul('')
      setDeskripsi('')
      setFoto(null)
      setLokasi(null)

      setTimeout(() => setSuccess(''), 4000)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-[#FDF7EE] to-[#f8f4ff] pt-24 px-6 flex justify-center">
        <form
          onSubmit={handleSubmit}
          className="bg-white/80 backdrop-blur-lg border border-gray-200 p-8 rounded-2xl shadow-lg w-full max-w-3xl space-y-6 text-gray-800"
        >
          <h1 className="text-3xl font-bold text-[#3E1C96]">📝 Buat Laporan</h1>

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-700 border border-green-200 animate-fade-in">
              <CheckCircle className="w-5 h-5" />
              <span>{success}</span>
            </div>
          )}

          {/* Judul */}
          <div className="relative">
            <input
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              className="peer w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#3E1C96] focus:border-[#3E1C96] outline-none text-sm"
              required
            />
            <label className="absolute left-3 -top-2.5 bg-white px-1 text-xs text-gray-600 peer-focus:text-[#3E1C96] transition">
              Judul
            </label>
          </div>

          {/* Deskripsi */}
          <div className="relative">
            <textarea
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              rows={4}
              className="peer w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#3E1C96] focus:border-[#3E1C96] outline-none text-sm"
              required
            />
            <label className="absolute left-3 -top-2.5 bg-white px-1 text-xs text-gray-600 peer-focus:text-[#3E1C96] transition">
              Deskripsi
            </label>
          </div>

          {/* Foto */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Upload Foto</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFoto(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 
                         file:rounded-lg file:border-0 
                         file:text-sm file:font-medium
                         file:bg-[#F04438] file:text-white 
                         hover:file:bg-[#d43a2e]"
            />
          </div>

          {/* Lokasi */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Tentukan Lokasi</label>
            <div className="rounded-lg overflow-hidden border shadow-sm">
              <MapContainer setLokasi={setLokasi} />
            </div>
            {lokasi && (
              <p className="text-sm mt-2 text-gray-600">
                📍 Lokasi dipilih: <span className="font-medium">{lokasi.lat}, {lokasi.lng}</span>
              </p>
            )}
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-white 
                       bg-gradient-to-r from-[#3E1C96] to-[#F04438] 
                       hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Mengirim...
              </>
            ) : (
              'Kirim Laporan'
            )}
          </button>
        </form>
      </div>
      <Footer />
    </>
  )
}
