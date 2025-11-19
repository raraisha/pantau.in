'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { supabase } from '@/lib/supabase'
import { ClipboardList, Clock, CheckCircle, Loader2, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react'

type Laporan = {
  id: string
  judul: string
  status: 'menunggu' | 'diproses' | 'selesai'
  created_at: string
  deskripsi?: string
  petugas_id?: string
}

export default function DashboardPetugas() {
  const [laporan, setLaporan] = useState<Laporan[]>([])
  const [loading, setLoading] = useState(true)
  const [petugas_id, setPetugasId] = useState<string>('')
  const [statistik, setStatistik] = useState({
    total: 0,
    menunggu: 0,
    diproses: 0,
    selesai: 0,
  })

  useEffect(() => {
    AOS.init({ duration: 800, once: true })
    getPetugasIdFromAuth()
  }, [])

  const getPetugasIdFromAuth = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error('Error getting user:', authError?.message)
        setLoading(false)
        return
      }

      setPetugasId(user.id)
      fetchLaporanPetugas(user.id)
    } catch (err) {
      console.error('Error:', err)
      setLoading(false)
    }
  }

  const fetchLaporanPetugas = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('laporan')
        .select('id, judul, status, created_at, deskripsi, petugas_id')
        .eq('petugas_id', id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching laporan petugas:', error.message)
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
              🛠️ Dashboard Petugas
            </h1>
            <p className="text-gray-600 text-lg max-w-3xl">
              Kelola dan pantau semua laporan yang ditugaskan kepada Anda dengan efisien dan transparan.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8" data-aos="fade-up">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{statistik.total}</span>
              </div>
              <p className="text-purple-100 font-medium">Total Tugas</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-400 to-amber-500 text-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{statistik.menunggu}</span>
              </div>
              <p className="text-yellow-100 font-medium">Menunggu</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Loader2 className="w-8 h-8 opacity-80 animate-spin" />
                <span className="text-3xl font-bold">{statistik.diproses}</span>
              </div>
              <p className="text-blue-100 font-medium">Diproses</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-500 text-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{statistik.selesai}</span>
              </div>
              <p className="text-green-100 font-medium">Selesai</p>
            </div>
          </div>

          {/* Laporan Table */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-100" data-aos="fade-up" data-aos-delay="200">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8]">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                📂 Laporan Ditugaskan
              </h2>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-[#3E1C96] mb-3" />
                <p className="text-gray-500">Memuat laporan...</p>
              </div>
            ) : laporan.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Judul Laporan</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Deskripsi</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {laporan.map((item, index) => (
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
                        <td className="px-6 py-4 text-center">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => (window.location.href = `/petugas/laporan/${item.id}`)}
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
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Belum Ada Tugas</h3>
                <p className="text-gray-600">Belum ada laporan yang ditugaskan kepada Anda.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}