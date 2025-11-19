'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { supabase } from '@/lib/supabase'
import { Clock, CheckCircle, Loader2, TrendingUp, AlertCircle, ArrowRight, Search, Calendar } from 'lucide-react'

type Laporan = {
  id: string
  judul: string
  deskripsi?: string
  status: 'menunggu' | 'diproses' | 'selesai'
  created_at: string
  users?: {
    nama: string
    email: string
  }
}

export default function ManajemenLaporan() {
  const [laporan, setLaporan] = useState<Laporan[]>([])
  const [filtered, setFiltered] = useState<Laporan[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'menunggu' | 'diproses' | 'selesai'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
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
    filterLaporan()
  }, [activeTab, laporan, searchQuery])

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
          petugas:petugas_id (nama, email )
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

  const hitungStatistik = (data: Laporan[]) => {
    const total = data.length
    const menunggu = data.filter((d) => d.status === 'menunggu').length
    const diproses = data.filter((d) => d.status === 'diproses').length
    const selesai = data.filter((d) => d.status === 'selesai').length

    setStatistik({ total, menunggu, diproses, selesai })
  }

  const filterLaporan = () => {
    let result = laporan

    // Filter by tab
    if (activeTab !== 'all') {
      result = result.filter((d) => d.status === activeTab)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((d) =>
        d.judul.toLowerCase().includes(query) ||
        d.deskripsi?.toLowerCase().includes(query) ||
        d.users?.nama.toLowerCase().includes(query)
      )
    }

    setFiltered(result)
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

  const tabs = [
    { id: 'all', label: 'Semua', icon: TrendingUp, count: statistik.total },
    { id: 'menunggu', label: 'Menunggu', icon: Clock, count: statistik.menunggu },
    { id: 'diproses', label: 'Diproses', icon: Loader2, count: statistik.diproses },
    { id: 'selesai', label: 'Selesai', icon: CheckCircle, count: statistik.selesai },
  ]

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-[#FDF7EE] via-[#f8f4ff] to-[#FDF7EE] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-10" data-aos="fade-down">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#3E1C96] to-[#F04438] mb-3">
              📊 Manajemen Laporan
            </h1>
            <p className="text-gray-600 text-lg max-w-3xl">
              Kelola laporan masyarakat secara cepat, transparan, dan terorganisir dengan sistem yang terintegrasi.
            </p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8" data-aos="fade-up">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`p-6 rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105 ${
                    isActive
                      ? 'bg-gradient-to-br from-[#3E1C96] to-[#5B2CB8] text-white shadow-xl scale-105'
                      : 'bg-white text-gray-800 hover:shadow-xl'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-8 h-8 ${isActive ? 'opacity-80' : 'opacity-60'}`} />
                    <span className="text-2xl font-bold">{tab.count}</span>
                  </div>
                  <p className={`font-medium ${isActive ? 'text-white/90' : 'text-gray-600'}`}>
                    {tab.label}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Search Bar */}
          <div className="mb-6" data-aos="fade-up" data-aos-delay="100">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari judul, deskripsi, atau nama petugas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-[#3E1C96] focus:ring-2 focus:ring-[#3E1C96]/20 outline-none transition-all text-black"
              />
            </div>
          </div>

          {/* Laporan Table */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-100" data-aos="fade-up" data-aos-delay="200">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8]">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                📂 Daftar Laporan
              </h2>
            </div>

            {/* Table Content */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-[#3E1C96] mb-3" />
                <p className="text-gray-500">Memuat laporan...</p>
              </div>
            ) : filtered.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Judul</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Deskripsi</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Petugas</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((item, index) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-purple-50/50 transition-all duration-200 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        }`}
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-[#3E1C96] max-w-xs truncate">
                            {item.judul}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700 max-w-md line-clamp-2">
                            {item.deskripsi || '-'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap">
                            <Calendar className="w-4 h-4 opacity-60" />
                            {formatDate(item.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="font-semibold text-gray-800">
                              {item.users?.nama || '-'}
                            </p>
                            <p className="text-gray-600 text-xs">
                              {item.users?.email || '-'}
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
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {searchQuery ? 'Tidak Ada Hasil Pencarian' : 'Belum Ada Laporan'}
                </h3>
                <p className="text-gray-600">
                  {searchQuery
                    ? 'Coba ubah kata kunci pencarian Anda'
                    : 'Tidak ada laporan untuk tab yang dipilih'}
                </p>
              </div>
            )}
          </div>

          {/* Result Summary */}
          {filtered.length > 0 && (
            <div className="mt-6 text-center text-gray-600" data-aos="fade-up">
              <p>Menampilkan <span className="font-bold text-[#3E1C96]">{filtered.length}</span> dari <span className="font-bold text-[#3E1C96]">{laporan.length}</span> laporan</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}