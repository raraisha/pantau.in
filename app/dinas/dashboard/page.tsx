'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Clock, CheckCircle, TrendingUp, AlertCircle, ArrowRight, Loader2, Filter, Building2, UserCheck, Users } from 'lucide-react'

type LaporanDinas = {
  id_laporan_dinas: string
  id_laporan: string
  id_dinas: string
  status_dinas: 'menunggu_assign' | 'ditugaskan' | 'sedang_dikerjakan' | 'selesai'
  catatan_dinas?: string
  tgl_diteruskan: string
  laporan: {
    id_laporan: string
    judul: string
    deskripsi?: string
    lokasi?: string
    kategori_laporan?: string
    status: string
    created_at: string
    masyarakat: {
      nama: string
      telp?: string
    }
  }
  petugas?: {
    nama: string
    email: string
    telp?: string
  }
}

export default function DashboardDinas() {
  const router = useRouter()
  const [laporanDinas, setLaporanDinas] = useState<LaporanDinas[]>([])
  const [filteredLaporan, setFilteredLaporan] = useState<LaporanDinas[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'semua' | 'menunggu_assign' | 'sudah_assign' | 'selesai'>('semua')
  const [dinasInfo, setDinasInfo] = useState<any>(null)
  const [statistik, setStatistik] = useState({
    total: 0,
    menunggu_assign: 0,
    sudah_assign: 0,
    selesai: 0,
  })

  useEffect(() => {
    AOS.init({ duration: 800, once: true })
    
    // Get dinas info from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setDinasInfo(user)
    
    if (user.id) {
      fetchLaporanDinas(user.id)
    }
  }, [])

  useEffect(() => {
    applyFilter()
  }, [laporanDinas, filterStatus])

  const fetchLaporanDinas = async (idDinas: string) => {
    try {
      // ✅ PERBAIKAN QUERY: Menggunakan nama tabel yang benar (bukan nama kolom)
      const { data, error } = await supabase
        .from('laporan_dinas')
        .select(`
          id_laporan_dinas,
          id_laporan,
          id_dinas,
          status_dinas,
          catatan_dinas,
          tgl_diteruskan,
          laporan:laporan!fk_laporan_dinas_laporan (
            id_laporan,
            judul,
            deskripsi,
            lokasi,
            kategori_laporan,
            status,
            created_at,
            masyarakat:masyarakat!fk_laporan_masyarakat (
              nama,
              telp
            )
          ),
          pelaksanaan (
            petugas:petugas!fk_pelaksanaan_petugas (
              nama,
              email,
              telp
            )
          )
        `)
        .eq('id_dinas', idDinas)
        .order('tgl_diteruskan', { ascending: false })

      if (error) {
        console.error('Error fetching laporan dinas:', error.message)
        setLoading(false)
        return
      }

      // Transform data
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        laporan: {
            ...item.laporan,
            // Handle array response if join returns array
            masyarakat: Array.isArray(item.laporan?.masyarakat) ? item.laporan.masyarakat[0] : item.laporan?.masyarakat
        },
        petugas: item.pelaksanaan?.[0]?.petugas || null
      }))

      setLaporanDinas(transformedData)
      hitungStatistik(transformedData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const applyFilter = () => {
    if (filterStatus === 'semua') {
      setFilteredLaporan(laporanDinas)
    } else if (filterStatus === 'sudah_assign') {
      setFilteredLaporan(laporanDinas.filter(item => 
        item.status_dinas === 'ditugaskan' || item.status_dinas === 'sedang_dikerjakan'
      ))
    } else {
      setFilteredLaporan(laporanDinas.filter(item => item.status_dinas === filterStatus))
    }
  }

  const hitungStatistik = (data: LaporanDinas[]) => {
    const total = data.length
    const menunggu_assign = data.filter((d) => d.status_dinas === 'menunggu_assign').length
    const sudah_assign = data.filter((d) => ['ditugaskan', 'sedang_dikerjakan'].includes(d.status_dinas)).length
    const selesai = data.filter((d) => d.status_dinas === 'selesai').length

    setStatistik({ total, menunggu_assign, sudah_assign, selesai })
  }

  const getStatusBadge = (status: string) => {
    const configs = {
      menunggu_assign: {
        bg: 'bg-gradient-to-r from-yellow-100 to-amber-100',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
        icon: <Clock className="w-4 h-4" />,
        label: 'Menunggu Assign'
      },
      ditugaskan: {
        bg: 'bg-gradient-to-r from-blue-100 to-cyan-100',
        text: 'text-blue-700',
        border: 'border-blue-200',
        icon: <UserCheck className="w-4 h-4" />,
        label: 'Ditugaskan'
      },
      sedang_dikerjakan: {
        bg: 'bg-gradient-to-r from-purple-100 to-fuchsia-100',
        text: 'text-purple-700',
        border: 'border-purple-200',
        icon: <TrendingUp className="w-4 h-4" />,
        label: 'Sedang Dikerjakan'
      },
      selesai: {
        bg: 'bg-gradient-to-r from-green-100 to-emerald-100',
        text: 'text-green-700',
        border: 'border-green-200',
        icon: <CheckCircle className="w-4 h-4" />,
        label: 'Selesai'
      }
    }

    const config = configs[status as keyof typeof configs] || configs.menunggu_assign

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${config.bg} ${config.text} border ${config.border}`}>
        {config.icon}
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Hari ini'
    if (diffDays === 1) return 'Kemarin'
    if (diffDays < 7) return `${diffDays} hari lalu`
    
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-[#FDF7EE] via-[#f8f4ff] to-[#FDF7EE] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-10" data-aos="fade-down">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#3E1C96] to-[#5B2CB8] rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#3E1C96] to-[#F04438]">
                  Dashboard {dinasInfo?.name || 'Dinas'}
                </h1>
                <p className="text-gray-500 text-sm mt-1">{dinasInfo?.wilayah_kerja || 'Wilayah Kerja'}</p>
              </div>
            </div>
            <p className="text-gray-600 text-lg max-w-3xl">
              Kelola dan tugaskan laporan ke petugas lapangan untuk penanganan yang cepat dan efektif.
            </p>
          </div>

          {statistik.menunggu_assign > 0 && (
            <div className="mt-8 p-6 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-2xl mb-8" data-aos="fade-up">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Perhatian!</h3>
                    <p className="text-gray-600">Ada <span className="font-bold text-yellow-600">{statistik.menunggu_assign}</span> laporan yang perlu ditugaskan ke petugas</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8" data-aos="fade-up">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{statistik.total}</span>
              </div>
              <p className="text-purple-100 font-medium">Total Laporan</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-400 to-amber-500 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{statistik.menunggu_assign}</span>
              </div>
              <p className="text-yellow-100 font-medium">Perlu Ditugaskan</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{statistik.sudah_assign}</span>
              </div>
              <p className="text-blue-100 font-medium">Sedang Dikerjakan</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-500 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{statistik.selesai}</span>
              </div>
              <p className="text-green-100 font-medium">Selesai</p>
            </div>
          </div>

          {/* Laporan Table Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-100" data-aos="fade-up" data-aos-delay="200">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8]">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  📋 Laporan Masuk
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="w-5 h-5 text-white" />
                  <div className="flex gap-2">
                    {(['semua', 'menunggu_assign', 'sudah_assign', 'selesai'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                          filterStatus === status
                            ? 'bg-white text-[#3E1C96] shadow-lg'
                            : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                      >
                        {status === 'semua' ? 'Semua' :
                         status === 'menunggu_assign' ? 'Perlu Ditugaskan' :
                         status === 'sudah_assign' ? 'Dikerjakan' : 'Selesai'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Table Content */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-[#3E1C96] mb-3" />
                <p className="text-gray-500">Memuat laporan...</p>
              </div>
            ) : filteredLaporan.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Judul Laporan</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pelapor</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Lokasi</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kategori</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Petugas</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredLaporan.map((item, index) => (
                      <tr 
                        key={item.id_laporan_dinas}
                        className={`hover:bg-purple-50/50 transition-all duration-200 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        }`}
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-[#3E1C96] max-w-xs truncate">
                            {item.laporan.judul}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(item.tgl_diteruskan)}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="font-semibold text-gray-800">
                              {item.laporan.masyarakat?.nama || 'Anonim'}
                            </p>
                            <p className="text-gray-600 text-xs">
                              {item.laporan.masyarakat?.telp || '-'}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700 max-w-xs truncate">
                            {item.laporan.lokasi || '-'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            {item.laporan.kategori_laporan || 'Umum'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {item.petugas ? (
                            <div className="text-sm">
                              <p className="font-semibold text-gray-800">
                                {item.petugas.nama}
                              </p>
                              <p className="text-gray-600 text-xs">
                                {item.petugas.telp || '-'}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 italic">Belum ditugaskan</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {getStatusBadge(item.status_dinas)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => router.push(`/dinas/laporan/detail/${item.id_laporan_dinas}`)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8] text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105"
                          >
                            {item.status_dinas === 'menunggu_assign' ? 'Tugaskan' : 'Kelola'}
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-10 h-10 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Belum Ada Laporan</h3>
                <p className="text-gray-600">Tidak ada laporan dengan status {
                  filterStatus === 'semua' ? 'apapun' :
                  filterStatus === 'menunggu_assign' ? 'menunggu penugasan' :
                  filterStatus === 'sudah_assign' ? 'sedang dikerjakan' : 'selesai'
                }.</p>
              </div>
            )}
          </div>

          {/* Summary Info */}
          {filteredLaporan.length > 0 && (
            <div className="mt-6 text-center text-gray-600" data-aos="fade-up">
              <p>Menampilkan <span className="font-bold text-[#3E1C96]">{filteredLaporan.length}</span> dari <span className="font-bold text-[#3E1C96]">{laporanDinas.length}</span> laporan</p>
            </div>
          )}

        </div>
      </div>
      <Footer />
    </>
  )
}