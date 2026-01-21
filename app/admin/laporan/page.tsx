'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { supabase } from '@/lib/supabase'
import { 
  Clock, 
  CheckCircle, 
  Loader2, 
  TrendingUp, 
  AlertCircle, 
  ArrowRight, 
  Search, 
  Calendar,
  ShieldCheck,
  Building2,
  Filter,
  LayoutDashboard
} from 'lucide-react'

// --- Types ---
type LaporanDinas = {
  status_dinas: string
  nama_dinas: string
}

type Laporan = {
  id: string
  judul: string
  deskripsi?: string
  status: string
  created_at: string
  laporan_dinas: LaporanDinas[]
}

export default function ManajemenLaporan() {
  const [laporan, setLaporan] = useState<Laporan[]>([])
  const [filtered, setFiltered] = useState<Laporan[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'menunggu' | 'progres' | 'menunggu_verifikasi_admin' | 'selesai'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  
  const [statistik, setStatistik] = useState({
    total: 0,
    menunggu: 0,
    progres: 0,
    verifAdmin: 0,
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
      setLoading(true)
      const { data, error } = await supabase
        .from('laporan')
        .select(`
          id:id_laporan,
          judul,
          deskripsi,
          status,
          created_at,
          laporan_dinas (
            status_dinas, 
            dinas:id_dinas (
              nama_dinas
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedData: Laporan[] = (data || []).map((item: any) => ({
        ...item,
        laporan_dinas: item.laporan_dinas?.map((ld: any) => ({
          status_dinas: ld.status_dinas,
          nama_dinas: ld.dinas?.nama_dinas || 'Dinas Tidak Diketahui'
        })) || []
      }))

      setLaporan(formattedData)
      hitungStatistik(formattedData)
    } catch (err: any) {
      console.error('Fetch Error:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const hitungStatistik = (data: Laporan[]) => {
    setStatistik({
      total: data.length,
      menunggu: data.filter((d) => d.status === 'menunggu').length,
      progres: data.filter((d) => d.laporan_dinas?.some(ld => ld.status_dinas === 'diproses')).length,
      verifAdmin: data.filter((d) => d.laporan_dinas?.some(ld => ld.status_dinas === 'menunggu_verifikasi_admin')).length,
      selesai: data.filter((d) => d.status === 'selesai').length,
    })
  }

  const filterLaporan = () => {
    let result = [...laporan]

    if (activeTab !== 'all') {
      if (activeTab === 'progres') {
        result = result.filter((d) => d.laporan_dinas?.some(ld => ld.status_dinas === 'diproses'))
      } else if (activeTab === 'menunggu_verifikasi_admin') {
        result = result.filter((d) => d.laporan_dinas?.some(ld => ld.status_dinas === 'menunggu_verifikasi_admin'))
      } else {
        result = result.filter((d) => d.status === activeTab)
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((d) =>
        d.judul.toLowerCase().includes(q) ||
        d.laporan_dinas?.some(ld => ld.nama_dinas.toLowerCase().includes(q))
      )
    }

    setFiltered(result)
  }

  const getStatusBadge = (item: Laporan) => {
    const pendingVerifCount = item.laporan_dinas?.filter(ld => ld.status_dinas === 'menunggu_verifikasi_admin').length

    if (pendingVerifCount > 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border border-orange-200 shadow-sm">
          <AlertCircle className="w-4 h-4" />
          {pendingVerifCount} Verif Admin
        </span>
      )
    }

    if (item.status === 'selesai') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200 shadow-sm">
          <CheckCircle className="w-4 h-4" />
          Selesai
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200 shadow-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Diproses
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-[#FDF7EE] via-[#f8f4ff] to-[#FDF7EE] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Section */}
          <div className="mb-10" data-aos="fade-down">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#3E1C96] to-[#F04438] mb-3 leading-tight">
              📊 Panel Kendali Laporan
            </h1>
            <p className="text-gray-600 text-lg max-w-3xl font-medium">
              Verifikasi hasil kerja dinas terkait secara spesifik untuk setiap laporan.
            </p>
          </div>

          {/* Statistics Cards - Sama dengan Dashboard Admin */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8" data-aos="fade-up">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{statistik.total}</span>
              </div>
              <p className="text-purple-100 font-medium">Total Laporan</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-400 to-amber-500 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{statistik.menunggu}</span>
              </div>
              <p className="text-yellow-100 font-medium">Menunggu</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <Loader2 className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{statistik.progres}</span>
              </div>
              <p className="text-blue-100 font-medium">Diproses</p>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-orange-500 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{statistik.verifAdmin}</span>
              </div>
              <p className="text-red-100 font-medium">Verif Admin</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-500 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{statistik.selesai}</span>
              </div>
              <p className="text-green-100 font-medium">Selesai</p>
            </div>
          </div>

          {/* Table Container - Sama dengan Dashboard Admin */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-100" data-aos="fade-up" data-aos-delay="200">
            
            {/* Table Header & Search */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8]">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  📂 Manajemen Data Laporan
                </h2>
                <div className="relative min-w-[300px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Cari laporan atau dinas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/60 focus:bg-white/20 outline-none transition-all text-sm"
                  />
                </div>
              </div>
              
              {/* Tab Filter */}
              <div className="flex gap-2 mt-6 overflow-x-auto pb-2 scrollbar-hide">
                {(['all', 'menunggu', 'progres', 'menunggu_verifikasi_admin', 'selesai'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      activeTab === tab
                        ? 'bg-white text-[#3E1C96] shadow-lg'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {tab === 'all' ? 'SEMUA' : tab.replace(/_/g, ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Content */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-[#3E1C96] mb-3" />
                <p className="text-gray-500 font-semibold uppercase tracking-widest text-xs">Menarik Data...</p>
              </div>
            ) : filtered.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Info Laporan</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tanggal</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Dinas Terlibat</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((item, index) => {
                      const hasUrgent = item.laporan_dinas?.some(ld => ld.status_dinas === 'menunggu_verifikasi_admin')
                      return (
                        <tr 
                          key={item.id} 
                          className={`hover:bg-purple-50/50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                        >
                          <td className="px-6 py-4">
                            <p className="font-bold text-[#3E1C96] text-base line-clamp-1">{item.judul}</p>
                            <p className="text-xs text-gray-500 line-clamp-1 font-medium italic">{item.deskripsi || '-'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {formatDate(item.created_at)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {item.laporan_dinas.map((ld, idx) => (
                                <div key={idx} className="flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded-md text-[10px] font-bold text-gray-600 shadow-sm">
                                  <Building2 className="w-3 h-3 text-[#3E1C96]" />
                                  {ld.nama_dinas}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {getStatusBadge(item)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => (window.location.href = `/admin/laporan/${item.id}`)}
                              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all hover:scale-105 shadow-md ${
                                hasUrgent 
                                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' 
                                : 'bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8] text-white'
                              }`}
                            >
                              {hasUrgent ? 'VERIFIKASI' : 'KELOLA'}
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-24">
                <ShieldCheck className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-800 uppercase">Data Tidak Ditemukan</h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">Tidak ada laporan yang sesuai dengan kriteria pencarian atau filter Anda.</p>
              </div>
            )}
          </div>

          {/* Summary */}
          {filtered.length > 0 && (
            <div className="mt-6 flex justify-between items-center px-4">
              <p className="text-sm font-medium text-gray-500">
                Menampilkan <span className="font-bold text-[#3E1C96]">{filtered.length}</span> laporan
              </p>
              <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <LayoutDashboard className="w-4 h-4" /> System Verified
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}