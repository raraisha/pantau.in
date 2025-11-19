'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { FileText, Clock, Info, FolderOpen, TrendingUp, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'

type Laporan = {
  id: string
  judul: string
  status: string
  created_at: string
  deskripsi?: string
}

export default function DashboardUser() {
  const [user, setUser] = useState<{ id?: string; name?: string; email?: string } | null>(null)
  const [laporan, setLaporan] = useState<Laporan[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    menunggu: 0,
    diproses: 0,
    selesai: 0
  })

  useEffect(() => {
    AOS.init({ duration: 800, once: true })
    fetchUserAndLaporan()
  }, [])

  const fetchUserAndLaporan = async () => {
    try {
      // Get authenticated user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) {
        console.error('User not authenticated')
        setLoading(false)
        return
      }

      setUser({
        id: authUser.id,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email
      })

      // Fetch laporan
      const { data, error } = await supabase
        .from('laporan')
        .select('id, judul, status, created_at, deskripsi')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching laporan:', error.message)
        setLoading(false)
        return
      }

      const laporanData = data || []
      setLaporan(laporanData)

      // Calculate stats
      setStats({
        total: laporanData.length,
        menunggu: laporanData.filter(l => l.status?.toLowerCase() === 'menunggu' || !l.status).length,
        diproses: laporanData.filter(l => l.status?.toLowerCase() === 'diproses').length,
        selesai: laporanData.filter(l => l.status?.toLowerCase() === 'selesai').length
      })

    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || 'menunggu'
    
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
        icon: <CheckCircle2 className="w-4 h-4" />,
        label: 'Selesai'
      }
    }

    const config = configs[statusLower as keyof typeof configs] || configs.menunggu

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
              Halo, {user?.name || 'Masyarakat'} 
            </h1>
            <p className="text-gray-600 text-lg max-w-3xl">
              Selamat datang di <span className="font-bold text-[#3E1C96]">Pantau.in</span> – 
              Platform pelaporan publik yang mudah, cepat, dan transparan untuk menciptakan lingkungan yang lebih baik.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8" data-aos="fade-up">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{stats.total}</span>
              </div>
              <p className="text-purple-100 font-medium">Total Laporan</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-400 to-amber-500 text-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{stats.menunggu}</span>
              </div>
              <p className="text-yellow-100 font-medium">Menunggu</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Loader2 className="w-8 h-8 opacity-80 animate-spin" />
                <span className="text-3xl font-bold">{stats.diproses}</span>
              </div>
              <p className="text-blue-100 font-medium">Diproses</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-500 text-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle2 className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{stats.selesai}</span>
              </div>
              <p className="text-green-100 font-medium">Selesai</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10" data-aos="fade-up" data-aos-delay="100">
            <a 
              href="/masyarakat/buat-laporan" 
              className="group bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-[#3E1C96]"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl group-hover:scale-110 transition-transform">
                  <FileText className="text-[#3E1C96]" size={28} />
                </div>
                <h3 className="text-xl font-bold text-[#3E1C96]">Buat Laporan</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">Sampaikan aduan atau laporan baru dengan cepat dan mudah langsung dari sini.</p>
              <div className="mt-4 text-[#F04438] font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                Mulai Lapor <span>→</span>
              </div>
            </a>

            <a 
              href="/masyarakat/riwayat" 
              className="group bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-[#3E1C96]"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl group-hover:scale-110 transition-transform">
                  <FolderOpen className="text-[#3E1C96]" size={28} />
                </div>
                <h3 className="text-xl font-bold text-[#3E1C96]">Riwayat Laporan</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">Pantau status laporan Anda yang sedang diproses atau sudah diselesaikan.</p>
              <div className="mt-4 text-[#F04438] font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                Lihat Riwayat <span>→</span>
              </div>
            </a>

            <a 
              href="/cara-lapor" 
              className="group bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-[#3E1C96]"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl group-hover:scale-110 transition-transform">
                  <Info className="text-[#3E1C96]" size={28} />
                </div>
                <h3 className="text-xl font-bold text-[#3E1C96]">Cara Lapor</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">Panduan lengkap untuk memastikan laporan Anda diterima dengan baik.</p>
              <div className="mt-4 text-[#F04438] font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                Pelajari <span>→</span>
              </div>
            </a>
          </div>

          {/* Recent Reports */}
          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-100" data-aos="fade-up" data-aos-delay="200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#3E1C96] flex items-center gap-2">
                📊 Laporan Terbaru
              </h2>
              <a 
                href="/masyarakat/riwayat" 
                className="text-sm text-[#F04438] font-semibold hover:underline flex items-center gap-1"
              >
                Lihat Semua <span>→</span>
              </a>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-10 h-10 animate-spin text-[#3E1C96] mb-3" />
                <p className="text-gray-500">Memuat laporan...</p>
              </div>
            ) : laporan.length > 0 ? (
              <div className="space-y-3">
                {laporan.slice(0, 5).map((item, index) => (
                  <div 
                    key={item.id}
                    className="group p-4 rounded-xl hover:bg-purple-50/50 transition-all duration-200 border border-gray-100 hover:border-purple-200 hover:shadow-md"
                    data-aos="fade-up"
                    data-aos-delay={index * 50}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 mb-1 group-hover:text-[#3E1C96] transition-colors">
                          {item.judul}
                        </h3>
                        {item.deskripsi && (
                          <p className="text-sm text-gray-600 line-clamp-1 mb-2">
                            {item.deskripsi}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(item.created_at)}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusBadge(item.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-10 h-10 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Belum Ada Laporan</h3>
                <p className="text-gray-600 mb-6">Anda belum membuat laporan apapun. Yuk mulai buat laporan pertama!</p>
                <a 
                  href="/masyarakat/buat-laporan"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#3E1C96] to-[#F04438] text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                >
                  <FileText className="w-5 h-5" />
                  Buat Laporan Sekarang
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}