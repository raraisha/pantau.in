'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import { Send, Loader2, AlertCircle, CheckCircle, User, Mail, ArrowLeft, MapPin, Calendar, FileText, Award } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type Laporan = {
  id: string
  judul: string
  deskripsi?: string
  status: 'menunggu' | 'diproses' | 'selesai'
  created_at: string
  latitude?: number
  longitude?: number
  catatan_petugas?: string
  petugas_id?: string
  user_id?: string
  laporan_foto?: string
  petugas?: {
    id: string
    nama: string
    email: string
  }
  users?: {
    id: string
    nama: string
    email: string
  }
}

type Petugas = {
  id: string
  nama: string
  email: string
}

export default function KelolaMasaLaporan() {
  const params = useParams()
  const laporan_id = params.id as string

  const [laporan, setLaporan] = useState<Laporan | null>(null)
  const [petugas, setPetugas] = useState<Petugas[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPetugas, setSelectedPetugas] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchLaporanDetail()
    fetchPetugas()
  }, [laporan_id])

  useEffect(() => {
    if (laporan?.latitude && laporan?.longitude) {
      setTimeout(() => {
        const map = L.map('map').setView([laporan.latitude, laporan.longitude], 15)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map)
        L.marker([laporan.latitude, laporan.longitude]).addTo(map)
      }, 100)
    }
  }, [laporan])

  const fetchLaporanDetail = async () => {
    try {
      const { data, error } = await supabase
        .from('laporan')
        .select('*')
        .eq('id', laporan_id)
        .single()

      if (error) {
        setError('Laporan tidak ditemukan')
        setLoading(false)
        return
      }

      let petugasData = null
      let userData = null

      if (data?.petugas_id) {
        const { data: p } = await supabase
          .from('petugas')
          .select('*')
          .eq('id', data.petugas_id)
          .single()
        petugasData = p
      }

      if (data?.user_id) {
        const { data: u } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user_id)
          .single()
        userData = u
      }

      setLaporan({ ...data, petugas: petugasData, users: userData })
    } catch (err) {
      console.error(err)
      setError('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const fetchPetugas = async () => {
    try {
      const { data } = await supabase.from('petugas').select('*').order('nama')
      setPetugas(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const handleAssignPetugas = async () => {
    if (!selectedPetugas) {
      setError('Pilih petugas terlebih dahulu')
      return
    }
    setAssigning(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase
        .from('laporan')
        .update({ petugas_id: selectedPetugas, status: 'diproses' })
        .eq('id', laporan_id)

      if (error) {
        setError('Gagal assign petugas')
        return
      }

      setSuccess('Petugas berhasil di-assign!')
      setSelectedPetugas('')
      setTimeout(() => fetchLaporanDetail(), 1000)
    } catch {
      setError('Terjadi kesalahan')
    } finally {
      setAssigning(false)
    }
  }

  const handleKirimEmail = async () => {
    setSending(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: laporan?.users?.email,
          userName: laporan?.users?.nama,
          laporanJudul: laporan?.judul,
          laporanDeskripsi: laporan?.deskripsi,
          petugasNama: laporan?.petugas?.nama,
          catatanPetugas: laporan?.catatan_petugas
        })
      })

      if (!response.ok) {
        setError('Gagal kirim email')
        return
      }

      setSuccess('Email berhasil dikirim!')
    } catch {
      setError('Gagal mengirim email')
    } finally {
      setSending(false)
    }
  }

  const openInMaps = () => {
    if (laporan?.latitude && laporan?.longitude) {
      const url = `https://www.google.com/maps?q=${laporan.latitude},${laporan.longitude}`
      window.open(url, '_blank')
    }
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'menunggu':
        return { bg: 'bg-gradient-to-r from-yellow-50 to-orange-50', border: 'border-yellow-200', text: 'text-yellow-800', badge: 'bg-yellow-100 text-yellow-700' }
      case 'diproses':
        return { bg: 'bg-gradient-to-r from-blue-50 to-cyan-50', border: 'border-blue-200', text: 'text-blue-800', badge: 'bg-blue-100 text-blue-700' }
      case 'selesai':
        return { bg: 'bg-gradient-to-r from-green-50 to-emerald-50', border: 'border-green-200', text: 'text-green-800', badge: 'bg-green-100 text-green-700' }
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', badge: 'bg-gray-100 text-gray-700' }
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center pt-24 bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
            <p className="text-gray-600 font-medium">Memuat laporan...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (!laporan) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center pt-24 bg-gradient-to-br from-red-50 to-orange-100">
          <AlertCircle className="w-20 h-20 text-red-500 mb-4" />
          <h2 className="text-3xl font-bold text-gray-800">Laporan Tidak Ditemukan</h2>
          <p className="text-gray-600 mt-2">Laporan yang Anda cari tidak tersedia</p>
        </div>
        <Footer />
      </>
    )
  }

  const statusConfig = getStatusConfig(laporan.status)

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <button onClick={() => window.history.back()} className="group flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-semibold transition-all duration-200">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Kembali
          </button>

          {/* Alert Messages */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-5 py-4 rounded-xl mb-6 flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border-2 border-green-200 text-green-700 px-5 py-4 rounded-xl mb-6 flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{success}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT COLUMN - Laporan Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header Card */}
              <div className={`${statusConfig.bg} border-2 ${statusConfig.border} rounded-2xl p-6`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className={`text-3xl font-bold ${statusConfig.text} mb-2`}>{laporan.judul}</h1>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <p className="text-sm">{formatDate(laporan.created_at)}</p>
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-full font-bold text-xs ${statusConfig.badge} whitespace-nowrap`}>
                    {laporan.status === 'menunggu' ? '⏳ Menunggu' : laporan.status === 'diproses' ? '⚙️ Diproses' : '✓ Selesai'}
                  </span>
                </div>
              </div>

              {/* Image */}
              {laporan.laporan_foto && (
                <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200">
                  <img src={laporan.laporan_foto} alt={laporan.judul} className="w-full h-64 object-cover" />
                </div>
              )}

              {/* Description */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-800">Deskripsi</h3>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-5 rounded-xl border border-gray-200">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">{laporan.deskripsi || '-'}</p>
                </div>
              </div>

              {/* Location */}
              {(laporan.latitude && laporan.longitude) && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-800">Lokasi Laporan</h3>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200 mb-4 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Koordinat GPS</p>
                      <p className="text-sm font-mono font-bold text-gray-800">
                        {laporan.latitude.toFixed(6)}, {laporan.longitude.toFixed(6)}
                      </p>
                    </div>
                    <button
                      onClick={openInMaps}
                      className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-3 py-2 rounded-lg font-semibold text-sm transition-all duration-200 hover:shadow-lg"
                    >
                      <MapPin className="w-4 h-4" />
                      Maps
                    </button>
                  </div>
                  <div id="map" className="w-full h-60 rounded-xl overflow-hidden shadow-lg border border-gray-200"></div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN - Admin Actions */}
            <div className="lg:col-span-1 space-y-6">
              {/* User Information */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <User className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-800">Pelapor</h3>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Nama</p>
                    <p className="font-bold text-gray-800 text-sm">{laporan.users?.nama || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-2">
                      <Mail className="w-3 h-3" /> Email
                    </p>
                    <a href={`mailto:${laporan.users?.email}`} className="text-blue-600 hover:text-blue-700 font-semibold break-all transition-colors text-xs">
                      {laporan.users?.email || '-'}
                    </a>
                  </div>
                </div>
              </div>

              {/* Status-specific sections */}
              {laporan.status === 'menunggu' && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <h3 className="font-bold text-lg text-gray-800 mb-3">Assign Petugas</h3>
                  <select
                    value={selectedPetugas}
                    onChange={(e) => setSelectedPetugas(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-gray-900 bg-white mb-3 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200 font-medium text-sm"
                  >
                    <option value="">-- Pilih Petugas --</option>
                    {petugas && petugas.length > 0 ? (
                      petugas.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nama || 'Nama tidak tersedia'} - {p.email || 'Email tidak tersedia'}
                        </option>
                      ))
                    ) : (
                      <option disabled>Tidak ada petugas tersedia</option>
                    )}
                  </select>
                  <button
                    onClick={handleAssignPetugas}
                    disabled={assigning || !selectedPetugas}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2 rounded-lg font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200 text-sm"
                  >
                    {assigning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Assign...
                      </>
                    ) : (
                      <>
                        <Award className="w-4 h-4" />
                        Assign
                      </>
                    )}
                  </button>
                </div>
              )}

              {laporan.status === 'diproses' && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <h3 className="font-bold text-lg text-gray-800 mb-3">Petugas Penangani</h3>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200 space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Nama</p>
                      <p className="font-bold text-gray-800 text-sm">{laporan.petugas?.nama || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-2">
                        <Mail className="w-3 h-3" /> Email
                      </p>
                      <p className="text-blue-600 font-semibold text-xs">{laporan.petugas?.email || '-'}</p>
                    </div>
                  </div>
                </div>
              )}

              {laporan.status === 'selesai' && (
                <>
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <h3 className="font-bold text-lg text-gray-800 mb-3">Petugas Penangani</h3>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200 space-y-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Nama</p>
                        <p className="font-bold text-gray-800 text-sm">{laporan.petugas?.nama || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-2">
                          <Mail className="w-3 h-3" /> Email
                        </p>
                        <p className="text-green-600 font-semibold text-xs">{laporan.petugas?.email || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <h3 className="font-bold text-lg text-gray-800 mb-3">Catatan Petugas</h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-xs">{laporan.catatan_petugas || 'Tidak ada catatan'}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleKirimEmail}
                    disabled={sending}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-lg font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200 text-sm"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Kirim Email
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}