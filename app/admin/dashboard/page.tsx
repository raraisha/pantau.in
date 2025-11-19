'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { supabase } from '@/lib/supabase'
import { ClipboardList, Users, Clock, CheckCircle, TrendingUp, AlertCircle, ArrowRight, Loader2, Filter } from 'lucide-react'

type Laporan = {
  id: string
  judul: string
  deskripsi?: string
  status: 'menunggu' | 'diproses' | 'selesai'
  created_at: string
  petugas?: {
    nama: string
    email: string
  }
}

export default function DashboardAdmin() {
  const [laporan, setLaporan] = useState<Laporan[]>([])
  const [filteredLaporan, setFilteredLaporan] = useState<Laporan[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'semua' | 'menunggu' | 'diproses' | 'selesai'>('semua')
  const [statistik, setStatistik] = useState({
    total: 0,
    menunggu: 0,
    diproses: 0,
    selesai: 0,
  })

  useEffect(() => {
    AOS.init({ duration: 800, once: true })
    fetchLaporan()
  }, [])

  useEffect(() => {
    applyFilter()
  }, [laporan, filterStatus])

  const fetchLaporan = async () => {
    try {
      const { data, error } = await supabase
        .from('laporan')
        .select(`
          id,
          judul,
          deskripsi,
          status,
          created_at,
          petugas:petugas_id (
            id,
            nama,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching laporan:', error.message)
        setLoading(false)
        return
      }

      setLaporan(data || [])
      hitungStatistik(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const applyFilter = () => {
    if (filterStatus === 'semua') {
      setFilteredLaporan(laporan)
    } else {
      setFilteredLaporan(laporan.filter(item => item.status === filterStatus))
    }
  }

  const hitungStatistik = (data: Laporan[]) => {
    const total = data.length
    const menunggu = data.filter((d) => d.status === 'menunggu').length
    const diproses = data.filter((d) => d.status === 'diproses').length
    const selesai = data.filter((d) => d.status === 'selesai').length

    setStatistik({ total, menunggu, diproses, selesai })
  }

  const getStatusBadge = (status: string) => {
    const configs = {
      menunggu: {
        bg: 'bg-gradient-to-r from-yellow-100 to-amber-100',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
        icon: <Clock className="w-4 h-4" />,
        label: 'Menunggu'
      },
      diproses: {
        bg: 'bg-gradient-to-r from-blue-100 to-cyan-100',
        text: 'text-blue-700',
        border: 'border-blue-200',
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        label: 'Diproses'
      },
      selesai: {
        bg: 'bg-gradient-to-r from-green-100 to-emerald-100',
        text: 'text-green-700',
        border: 'border-green-200',
        icon: <CheckCircle className="w-4 h-4" />,
        label: 'Selesai'
      }
    }

    const config = configs[status as keyof typeof configs] || configs.menunggu

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${config.bg} ${config.text} border ${config.border}`}>
        {config.icon}
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
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
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#3E1C96] to-[#F04438] mb-3">
              📊 Dashboard Admin
            </h1>
            <p className="text-gray-600 text-lg max-w-3xl">
              Kelola laporan masyarakat secara cepat, transparan, dan terorganisir dengan sistem manajemen terintegrasi.
            </p>
          </div>

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
                <span className="text-3xl font-bold">{statistik.menunggu}</span>
              </div>
              <p className="text-yellow-100 font-medium">Menunggu</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{statistik.diproses}</span>
              </div>
              <p className="text-blue-100 font-medium">Diproses</p>
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
                  📂 Semua Laporan
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="w-5 h-5 text-white" />
                  <div className="flex gap-2">
                    {(['semua', 'menunggu', 'diproses', 'selesai'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                          filterStatus === status
                            ? 'bg-white text-[#3E1C96] shadow-lg'
                            : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
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
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Deskripsi</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Petugas</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredLaporan.map((item, index) => (
                      <tr 
                        key={item.id}
                        className={`hover:bg-purple-50/50 transition-all duration-200 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        }`}
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-[#3E1C96] max-w-xs">
                            {item.judul}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700 max-w-md line-clamp-2">
                            {item.deskripsi || '-'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 whitespace-nowrap">
                            {formatDate(item.created_at)}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="font-semibold text-gray-800">
                              {item.petugas?.nama || '-'}
                            </p>
                            <p className="text-gray-600 text-xs">
                              {item.petugas?.email || '-'}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => (window.location.href = `/admin/laporan/${item.id}`)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8] text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105"
                          >
                            Kelola
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
                <p className="text-gray-600">Tidak ada laporan dengan status {filterStatus === 'semua' ? 'apapun' : filterStatus}.</p>
              </div>
            )}
          </div>

          {/* Summary Info */}
          {filteredLaporan.length > 0 && (
            <div className="mt-6 text-center text-gray-600" data-aos="fade-up">
              <p>Menampilkan <span className="font-bold text-[#3E1C96]">{filteredLaporan.length}</span> dari <span className="font-bold text-[#3E1C96]">{laporan.length}</span> laporan</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}