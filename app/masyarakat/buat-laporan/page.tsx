'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'
import { Loader2, CheckCircle, AlertCircle, Upload, MapPin, FileText, Image } from 'lucide-react'
import Footer from '@/components/Footer'

const MapContainer = dynamic(() => import('@/components/Map'), { ssr: false })

export default function BuatLaporanPage() {
  const [judul, setJudul] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [lokasi, setLokasi] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFoto(file)
    
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setFotoPreview(null)
    }
  }

  const sendEmailNotification = async (email: string, nama: string, laporanJudul: string, laporanDeskripsi: string, laporanId: string) => {
    try {
      const response = await fetch('/api/send-email-laporan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: email,
          userName: nama,
          laporanJudul,
          laporanDeskripsi,
          laporanId
        })
      })

      if (!response.ok) {
        console.warn('Email notification failed, but laporan was submitted')
      }
    } catch (err) {
      console.warn('Email sending failed:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Validasi input
      if (!judul.trim() || !deskripsi.trim()) {
        setError('Judul dan deskripsi harus diisi!')
        setLoading(false)
        return
      }

      // Get user dari auth
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id

      if (!userId) {
        setError("Kamu belum login. Silakan login terlebih dahulu.")
        setLoading(false)
        return
      }

      // Get user email dan nama
      const { data: userDataFromDB } = await supabase
        .from('users')
        .select('email, nama')
        .eq('id', userId)
        .single()

      if (!userDataFromDB?.email) {
        setError("Email user tidak ditemukan")
        setLoading(false)
        return
      }

      let fotoUrl = null

      // Upload foto jika ada
      if (foto) {
        const fileName = `${Date.now()}-${foto.name.replace(/\s+/g, '-')}`
        const { data, error: uploadError } = await supabase.storage
          .from('laporan-foto')
          .upload(fileName, foto, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw new Error(`Gagal upload foto: ${uploadError.message}`)

        const { data: publicUrl } = supabase.storage
          .from('laporan-foto')
          .getPublicUrl(fileName)

        fotoUrl = publicUrl.publicUrl
      }

      // Insert laporan
      const { data: laporanData, error: insertError } = await supabase
        .from('laporan')
        .insert([
          {
            judul,
            deskripsi,
            latitude: lokasi?.lat,
            longitude: lokasi?.lng,
            laporan_foto: fotoUrl,
            user_id: userId,
            status: 'menunggu'
          }
        ])
        .select()

      if (insertError) throw insertError

      const laporanId = laporanData?.[0]?.id || 'N/A'

      // Send email notification (async, tidak perlu tunggu)
      sendEmailNotification(
        userDataFromDB.email,
        userDataFromDB.nama || 'Pengguna',
        judul,
        deskripsi,
        laporanId
      )

      setSuccess('✓ Laporan berhasil dikirim! Email konfirmasi telah dikirim ke email Anda.')
      setJudul('')
      setDeskripsi('')
      setFoto(null)
      setFotoPreview(null)
      setLokasi(null)

      // Redirect ke halaman laporan setelah 3 detik
      setTimeout(() => {
        window.location.href = '/masyarakat/buat-laporan'
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengirim laporan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-[#FDF7EE] via-[#f8f4ff] to-[#FDF7EE] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#3E1C96] to-[#F04438] mb-3">
              Buat Laporan Disini
            </h1>
            <p className="text-gray-600 text-lg">
              Laporkan masalah di sekitarmu untuk lingkungan yang lebih baik
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-xl border-2 border-gray-100 p-8 md:p-10 rounded-3xl shadow-2xl space-y-8">
            {/* Success Alert */}
            {success && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-2 border-green-200 shadow-sm animate-fade-in">
                <CheckCircle className="w-6 h-6 flex-shrink-0" />
                <span className="font-medium">{success}</span>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-2 border-red-200 shadow-sm">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Judul Input */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <FileText className="w-4 h-4 text-[#3E1C96]" />
                Judul Laporan *
              </label>
              <input
                type="text"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Contoh: Jalan berlubang di depan sekolah"
                className="text-black w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3E1C96] focus:border-[#3E1C96] outline-none text-sm transition-all bg-white hover:border-gray-300"
                required
              />
            </div>

            {/* Deskripsi Textarea */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <FileText className="w-4 h-4 text-[#3E1C96]" />
                Deskripsi Lengkap *
              </label>
              <textarea
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                rows={5}
                placeholder="Jelaskan masalah secara detail..."
                className="text-black w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3E1C96] focus:border-[#3E1C96] outline-none text-sm transition-all resize-none bg-white hover:border-gray-300"
                required
              />
            </div>

            {/* Upload Foto */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Image className="w-4 h-4 text-[#3E1C96]" />
                Upload Foto (Opsional)
              </label>
              
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center gap-3 w-full px-6 py-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#3E1C96] hover:bg-purple-50/50 transition-all group"
                >
                  <Upload className="w-5 h-5 text-gray-400 group-hover:text-[#3E1C96] transition-colors" />
                  <span className="text-sm text-gray-600 group-hover:text-[#3E1C96] font-medium transition-colors">
                    {foto ? foto.name : 'Klik untuk upload gambar'}
                  </span>
                </label>
              </div>

              {/* Image Preview */}
              {fotoPreview && (
                <div className="relative group">
                  <img
                    src={fotoPreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-xl border-2 border-purple-200 shadow-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFoto(null)
                      setFotoPreview(null)
                      const fileInput = document.getElementById('file-upload') as HTMLInputElement
                      if (fileInput) fileInput.value = ''
                    }}
                    className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Map Location */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <MapPin className="w-4 h-4 text-red-500" />
                Tentukan Lokasi
              </label>
              <div className="rounded-xl overflow-hidden border-2 border-gray-200 shadow-md h-80">
                <MapContainer setLokasi={setLokasi} />
              </div>
              {lokasi && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200">
                  <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Lokasi dipilih:</span>{' '}
                    <span className="font-mono text-xs">{lokasi.lat.toFixed(6)}, {lokasi.lng.toFixed(6)}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-white text-lg
                       bg-gradient-to-r from-[#3E1C96] via-[#5B2CB8] to-[#F04438] 
                       hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                       transition-all duration-200 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Mengirim Laporan...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Kirim Laporan</span>
                </>
              )}
            </button>

            {/* Info Text */}
            <p className="text-xs text-center text-gray-500 mt-4">
              Laporan kamu akan diverifikasi oleh admin dan akan segera ditindaklanjuti. Email konfirmasi akan dikirim ke email terdaftar Anda.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}