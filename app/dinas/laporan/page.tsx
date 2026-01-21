'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { supabase } from '@/lib/supabase'
import { 
  ClipboardList, Users, Clock, CheckCircle, AlertCircle, ArrowRight, 
  Loader2, Filter, MapPin, Calendar, User, Phone, FileText, 
  Search, ChevronDown, X, UserPlus, TrendingUp, Eye, Download
} from 'lucide-react'

type LaporanDinas = {
  id_laporan_dinas: string
  id_laporan: string
  id_dinas: string
  status_dinas: 'menunggu_assign' | 'sudah_assign' | 'selesai'
  catatan_dinas?: string
  tgl_diteruskan: string
  laporan: {
    id_laporan: string
    judul: string
    deskripsi?: string
    lokasi?: string
    kategori_laporan?: string
    urgensi_laporan?: string
    status: string
    created_at: string
    laporan_foto?: string
    masyarakat: {
      nama: string
      telp?: string
      email?: string
    }
  }
  petugas?: {
    id_petugas: string
    nama: string
    email: string
    telp?: string
  }
}

type Petugas = {
  id_petugas: string
  nama: string
  email: string
  telp?: string
  beban_kerja: number
}

export default function DinasLaporanMasukPage() {
  const [laporanDinas, setLaporanDinas] = useState<LaporanDinas[]>([])
  const [filteredLaporan, setFilteredLaporan] = useState<LaporanDinas[]>([])
  const [allPetugas, setAllPetugas] = useState<Petugas[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<
  'semua' | 'menunggu_assign' | 'sudah_assign' | 'selesai'
>('semua')

  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'terbaru' | 'urgensi' | 'lokasi'>('terbaru')
  const [dinasInfo, setDinasInfo] = useState<any>(null)
  
  // Modal states
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedLaporan, setSelectedLaporan] = useState<LaporanDinas | null>(null)
  const [selectedPetugas, setSelectedPetugas] = useState<string>('')
  const [catatanDinas, setCatatanDinas] = useState('')
  const [assignLoading, setAssignLoading] = useState(false)

  const [statistik, setStatistik] = useState({
    total: 0,
    menunggu_assign: 0,
    sudah_assign: 0,
    selesai: 0,
  })

  useEffect(() => {
    AOS.init({ duration: 800, once: true })
    
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setDinasInfo(user)
    
    if (user.id) {
      fetchLaporanDinas(user.id)
      fetchPetugas(user.id)
    }
  }, [])

  useEffect(() => {
    applyFilters()
  }, [laporanDinas, filterStatus, searchQuery, sortBy])

  const fetchLaporanDinas = async (idDinas: string) => {
    try {
      const { data, error } = await supabase
        .from('laporan_dinas')
        .select(`
          id_laporan_dinas,
          id_laporan,
          id_dinas,
          status_dinas,
          catatan_dinas,
          tgl_diteruskan,
          laporan:id_laporan (
            id_laporan,
            judul,
            deskripsi,
            lokasi,
            kategori_laporan,
            urgensi_laporan,
            status,
            created_at,
            laporan_foto,
            masyarakat:id_masyarakat (
              nama,
              telp,
              email
            )
          ),
          pelaksanaan (
            petugas:id_petugas (
              id_petugas,
              nama,
              email,
              telp
            )
          )
        `)
        .eq('id_dinas', idDinas)
        .order('tgl_diteruskan', { ascending: false })

      if (error) throw error

      const transformedData = (data || []).map(item => ({
        ...item,
        petugas: item.pelaksanaan?.[0]?.petugas || null
      }))

      setLaporanDinas(transformedData)
      hitungStatistik(transformedData)
    } catch (err) {
      console.error('Error fetching laporan:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPetugas = async (idDinas: string) => {
    try {
      const { data, error } = await supabase
        .from('petugas')
        .select('id_petugas, nama, email, telp, beban_kerja, status_aktif')
        .eq('id_dinas', idDinas)
        .eq('status_aktif', true)
        .order('beban_kerja', { ascending: true })

      if (!error && data) {
        setAllPetugas(data)
      }
    } catch (err) {
      console.error('Error fetching petugas:', err)
    }
  }

  const applyFilters = () => {
    let result = [...laporanDinas]

    // Filter by status
    if (filterStatus !== 'semua') {
      result = result.filter(item => item.status_dinas === filterStatus)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(item => 
        item.laporan.judul.toLowerCase().includes(query) ||
        item.laporan.lokasi?.toLowerCase().includes(query) ||
        item.laporan.masyarakat?.nama.toLowerCase().includes(query)
      )
    }

    // Sort
    if (sortBy === 'terbaru') {
      result.sort((a, b) => new Date(b.tgl_diteruskan).getTime() - new Date(a.tgl_diteruskan).getTime())
    } else if (sortBy === 'urgensi') {
      const urgensiOrder = { 'tinggi': 3, 'sedang': 2, 'rendah': 1 }
      result.sort((a, b) => {
        const urgA = urgensiOrder[a.laporan.urgensi_laporan as keyof typeof urgensiOrder] || 0
        const urgB = urgensiOrder[b.laporan.urgensi_laporan as keyof typeof urgensiOrder] || 0
        return urgB - urgA
      })
    } else if (sortBy === 'lokasi') {
      result.sort((a, b) => (a.laporan.lokasi || '').localeCompare(b.laporan.lokasi || ''))
    }

    setFilteredLaporan(result)
  }

  const hitungStatistik = (data: LaporanDinas[]) => {
    setStatistik({
      total: data.length,
      menunggu_assign: data.filter(d => d.status_dinas === 'menunggu_assign').length,
      sudah_assign: data.filter(d => d.status_dinas === 'sudah_assign').length,
      selesai: data.filter(d => d.status_dinas === 'selesai').length,
    })
  }

  const handleOpenAssignModal = (laporan: LaporanDinas) => {
    setSelectedLaporan(laporan)
    setSelectedPetugas('')
    setCatatanDinas(laporan.catatan_dinas || '')
    setShowAssignModal(true)
  }

 const handleAssignPetugas = async () => {
  if (!selectedLaporan || !selectedPetugas) return

  setAssignLoading(true)
  try {
    // 1. Masukkan ke tabel pelaksanaan (Inilah yang akan dibaca di dashboard petugas)
    const { error: pelaksanaanError } = await supabase
      .from('pelaksanaan')
      .insert({
        id_laporan_dinas: selectedLaporan.id_laporan_dinas,
        id_petugas: selectedPetugas,
        status_pelaksanaan: 'belum_mulai',
        deskripsi_tindakan: catatanDinas || 'Petugas ditugaskan oleh dinas',
        // Tambahkan timestamp jika ada kolomnya
        created_at: new Date().toISOString() 
      })

    if (pelaksanaanError) throw pelaksanaanError

    // 2. Update status di tabel laporan_dinas
    const { error: updateError } = await supabase
      .from('laporan_dinas')
      .update({
        status_dinas: 'berjalan',
        catatan_dinas: catatanDinas
      })
      .eq('id_laporan_dinas', selectedLaporan.id_laporan_dinas)

    if (updateError) throw updateError

    // 3. Update beban kerja petugas (Opsional tapi bagus untuk monitoring)
    const petugas = allPetugas.find(p => p.id_petugas === selectedPetugas)
    if (petugas) {
      await supabase
        .from('petugas')
        .update({ beban_kerja: (petugas.beban_kerja || 0) + 1 })
        .eq('id_petugas', selectedPetugas)
    }

    // Beri notifikasi sukses atau refresh data
    alert('Berhasil menugaskan petugas!')
    fetchLaporanDinas(dinasInfo.id)
    setShowAssignModal(false)
    
  } catch (err) {
    console.error('Error:', err)
    alert('Gagal: ' + err.message)
  } finally {
    setAssignLoading(false)
  }
}

const getStatusBadge = (status: string) => {
    const configs = {
      menunggu_assign: {
        bg: 'bg-gradient-to-r from-yellow-100 to-amber-100',
        text: 'text-yellow-700',
        border: 'border-yellow-300',
        icon: <Clock className="w-4 h-4" />,
        label: 'Belum di Assign'
      },
      berjalan: {
        bg: 'bg-gradient-to-r from-blue-100 to-cyan-100',
        text: 'text-blue-700',
        border: 'border-blue-300',
        icon: <Users className="w-4 h-4" />,
        label: 'Sedang Berjalan'
      },
      menunggu_verifikasi_dinas: {
        bg: 'bg-gradient-to-r from-purple-100 to-indigo-100',
        text: 'text-purple-700',
        border: 'border-purple-300',
        icon: <AlertCircle className="w-4 h-4" />,
        label: 'Menunggu Verifikasi Dinas'
      },
      menunggu_verifikasi_admin: {
        bg: 'bg-gradient-to-r from-green-100 to-emerald-100',
        text: 'text-green-700',
        border: 'border-green-300',
        icon: <CheckCircle className="w-4 h-4" />,
        label: 'Selesai' // Di UI tampil Selesai, di DB menunggu_verifikasi_admin
      }
    }

    const config = configs[status as keyof typeof configs] || configs.menunggu_assign

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${config.bg} ${config.text} border-2 ${config.border} shadow-sm`}>
        {config.icon}
        {config.label}
      </span>
    )
  }
  const getUrgensiTag = (urgensi?: string) => {
    const configs = {
      tinggi: { bg: 'bg-red-100', text: 'text-red-700', label: '🔥 Tinggi' },
      sedang: { bg: 'bg-orange-100', text: 'text-orange-700', label: '⚠️ Sedang' },
      rendah: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'ℹ️ Rendah' }
    }

    const config = configs[urgensi as keyof typeof configs] || configs.rendah

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-[#FDF7EE] via-[#f8f4ff] to-[#FDF7EE] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-10" data-aos="fade-down">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#3E1C96] to-[#F04438] mb-3">
              📨 Laporan Masuk
            </h1>
            <p className="text-gray-600 text-lg">
              Kelola dan tugaskan laporan ke petugas lapangan untuk penanganan optimal
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8" data-aos="fade-up">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 opacity-90" />
                <span className="text-4xl font-bold">{statistik.total}</span>
              </div>
              <p className="text-purple-100 font-semibold text-sm">Total Laporan</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-400 to-amber-500 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 opacity-90" />
                <span className="text-4xl font-bold">{statistik.menunggu_assign}</span>
              </div>
              <p className="text-yellow-100 font-semibold text-sm">Perlu Ditugaskan</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 opacity-90" />
                <span className="text-4xl font-bold">{statistik.sudah_assign}</span>
              </div>
              <p className="text-blue-100 font-semibold text-sm">Sedang Dikerjakan</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-500 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-8 h-8 opacity-90" />
                <span className="text-4xl font-bold">{statistik.selesai}</span>
              </div>
              <p className="text-green-100 font-semibold text-sm">Selesai</p>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 p-6 mb-6" data-aos="fade-up" data-aos-delay="100">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan judul, lokasi, atau pelapor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3E1C96] focus:border-[#3E1C96] outline-none text-sm transition-all bg-white font-medium"
                />
              </div>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-black appearance-none px-6 py-3.5 pr-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3E1C96] focus:border-[#3E1C96] outline-none text-sm font-semibold bg-white cursor-pointer hover:border-gray-300 transition-all"
                >
                  <option value="terbaru">📅 Terbaru</option>
                  <option value="urgensi">🔥 Urgensi</option>
                  <option value="lokasi">📍 Lokasi</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>

{/* Filter Status */}
<div className="flex gap-2 flex-wrap">
  {(['semua', 'menunggu_assign', 'berjalan', 'menunggu_verifikasi_dinas', 'menunggu_verifikasi_admin'] as const).map((status) => (
    <button
      key={status}
      onClick={() => setFilterStatus(status)}
      className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
        filterStatus === status
          ? 'bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8] text-white shadow-lg scale-105'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {status === 'semua' ? 'Semua' :
       status === 'menunggu_assign' ? 'Belum di Assign' :
       status === 'berjalan' ? 'Berjalan' :
       status === 'menunggu_verifikasi_dinas' ? 'Perlu Verifikasi' : 'Selesai'}
    </button>
  ))}
</div>
            </div>
          </div>

          {/* Laporan Cards */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-[#3E1C96] mb-4" />
              <p className="text-gray-600 font-medium">Memuat laporan...</p>
            </div>
          ) : filteredLaporan.length > 0 ? (
            <div className="grid grid-cols-1 gap-6" data-aos="fade-up" data-aos-delay="200">
              {filteredLaporan.map((item) => (
                <div
                  key={item.id_laporan_dinas}
                  className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all hover:scale-[1.01] group"
                >
                  <div className="p-6">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-[#3E1C96] group-hover:text-[#F04438] transition-colors">
                            {item.laporan.judul}
                          </h3>
                          {getUrgensiTag(item.laporan.urgensi_laporan)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {formatDate(item.tgl_diteruskan)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <FileText className="w-4 h-4" />
                            {item.laporan.kategori_laporan || 'Umum'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(item.status_dinas)}
                      </div>
                    </div>

                    {/* Deskripsi */}
                    <p className="text-gray-700 text-sm mb-4 line-clamp-2 leading-relaxed">
                      {item.laporan.deskripsi || '-'}
                    </p>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gradient-to-br from-gray-50 to-purple-50/30 rounded-xl border border-gray-100">
                      {/* Pelapor */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pelapor</p>
                          <p className="font-bold text-gray-800">{item.laporan.masyarakat?.nama || '-'}</p>
                          <p className="text-xs text-gray-600">{item.laporan.masyarakat?.telp || '-'}</p>
                        </div>
                      </div>

                      {/* Lokasi */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Lokasi</p>
                          <p className="font-bold text-gray-800">{item.laporan.lokasi || '-'}</p>
                        </div>
                      </div>

                      {/* Petugas */}
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          item.petugas ? 'bg-gradient-to-br from-green-500 to-emerald-500' : 'bg-gray-300'
                        }`}>
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Petugas</p>
                          {item.petugas ? (
                            <>
                              <p className="font-bold text-gray-800">{item.petugas.nama}</p>
                              <p className="text-xs text-gray-600">{item.petugas.telp || '-'}</p>
                            </>
                          ) : (
                            <p className="font-bold text-gray-400 italic">Belum ditugaskan</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => window.location.href = `/dinas/laporan/detail/${item.id_laporan_dinas}`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-bold rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all hover:shadow-lg"
                      >
                        <Eye className="w-4 h-4" />
                        Lihat Detail
                      </button>
                      
                      {item.status_dinas === 'menunggu_assign' && (
                        <button
                          onClick={() => handleOpenAssignModal(item)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8] text-white font-bold rounded-xl hover:shadow-xl transition-all hover:scale-105"
                        >
                          <UserPlus className="w-4 h-4" />
                          Tugaskan Petugas
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white/95 rounded-2xl shadow-xl" data-aos="fade-up">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-12 h-12 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Tidak Ada Laporan</h3>
              <p className="text-gray-600">Tidak ada laporan yang sesuai dengan filter Anda.</p>
            </div>
          )}

          {/* Summary */}
          {filteredLaporan.length > 0 && (
            <div className="mt-8 text-center text-gray-600 font-medium" data-aos="fade-up">
              <p>Menampilkan <span className="font-bold text-[#3E1C96] text-lg">{filteredLaporan.length}</span> dari <span className="font-bold text-[#3E1C96] text-lg">{laporanDinas.length}</span> laporan</p>
            </div>
          )}
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && selectedLaporan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" data-aos="zoom-in" data-aos-duration="300">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8] text-white p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <UserPlus className="w-6 h-6" />
                  Tugaskan Petugas
                </h2>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-purple-100 mt-2 text-sm">
                Pilih petugas yang akan menangani laporan ini
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Laporan Info */}
              <div className="p-4 bg-gradient-to-br from-gray-50 to-purple-50 rounded-xl border-2 border-purple-100">
                <h3 className="font-bold text-gray-800 mb-2">{selectedLaporan.laporan.judul}</h3>
                <p className="text-sm text-gray-600 mb-3">{selectedLaporan.laporan.lokasi}</p>
                <div className="flex items-center gap-2">
                  {getUrgensiTag(selectedLaporan.laporan.urgensi_laporan)}
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs font-semibold text-gray-600">{selectedLaporan.laporan.kategori_laporan}</span>
                </div>
              </div>

              {/* Pilih Petugas */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700">
                  Pilih Petugas
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {allPetugas.length > 0 ? (
                    allPetugas.map((petugas) => (
                      <label
                        key={petugas.id_petugas}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedPetugas === petugas.id_petugas
                            ? 'border-[#3E1C96] bg-purple-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="petugas"
                          value={petugas.id_petugas}
                          checked={selectedPetugas === petugas.id_petugas}
                          onChange={(e) => setSelectedPetugas(e.target.value)}
                          className="w-5 h-5 text-[#3E1C96] focus:ring-[#3E1C96]"
                        />
                        <div className="flex-1">
                          <p className="font-bold text-gray-800">{petugas.nama}</p>
                          <p className="text-sm text-gray-600">{petugas.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-semibold text-gray-500">
                              Beban Kerja: {petugas.beban_kerja || 0} tugas
                            </span>
                            {petugas.beban_kerja === 0 && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                                Tersedia
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="font-semibold">Tidak ada petugas tersedia</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Catatan */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700">
                  Catatan untuk Petugas (Opsional)
                </label>
                <textarea
                  value={catatanDinas}
                  onChange={(e) => setCatatanDinas(e.target.value)}
                  placeholder="Berikan instruksi atau catatan khusus untuk petugas..."
                  rows={4}
                  className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3E1C96] focus:border-[#3E1C96] outline-none text-sm resize-none font-medium"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-6 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleAssignPetugas}
                  disabled={!selectedPetugas || assignLoading}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8] text-white font-bold rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {assignLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Tugaskan Sekarang
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}