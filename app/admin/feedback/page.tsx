'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { supabase } from '@/lib/supabase'
import { 
  Clock, 
  Loader2, 
  TrendingUp, 
  AlertCircle, 
  Search, 
  Calendar,
  ShieldCheck,
  LayoutDashboard,
  MessageSquare,
  Star,
  User,
  Trash2,
  ThumbsUp,
  Bug
} from 'lucide-react'

// --- Types ---
type Masyarakat = {
  nama: string
  email: string
}

type Feedback = {
  id_feedback: string // Pastikan primary key tabel feedback benar (biasanya id atau id_feedback)
  kategori: string
  isi_pesan: string
  rating: number
  created_at: string
  masyarakat: Masyarakat | null // Join ke tabel masyarakat
}

export default function ManajemenFeedback() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [filtered, setFiltered] = useState<Feedback[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'Saran Fitur' | 'Laporan Bug / Error' | 'Kinerja Petugas' | 'Lainnya'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  
  // State untuk statistik
  const [statistik, setStatistik] = useState({
    total: 0,
    avgRating: 0,
    saranFitur: 0,
    laporanBug: 0,
    kinerjaPetugas: 0,
  })

  useEffect(() => {
    AOS.init({ duration: 800, once: true })
    fetchFeedback()
  }, [])

  useEffect(() => {
    filterFeedback()
  }, [activeTab, feedback, searchQuery])

  const fetchFeedback = async () => {
    try {
      setLoading(true)
      // Query ke feedback_masyarakat & join ke masyarakat
      const { data, error } = await supabase
        .from('feedback_masyarakat')
        .select(`
          *,
          masyarakat (
            nama,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedData: Feedback[] = (data || []) as Feedback[]
      setFeedback(formattedData)
      hitungStatistik(formattedData)
    } catch (err: any) {
      console.error('Fetch Error:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const hitungStatistik = (data: Feedback[]) => {
    const totalRating = data.reduce((acc, curr) => acc + (curr.rating || 0), 0)
    const countRating = data.filter(d => d.rating > 0).length
    
    setStatistik({
      total: data.length,
      avgRating: countRating > 0 ? Number((totalRating / countRating).toFixed(1)) : 0,
      saranFitur: data.filter((d) => d.kategori === 'Saran Fitur').length,
      laporanBug: data.filter((d) => d.kategori === 'Laporan Bug / Error').length,
      kinerjaPetugas: data.filter((d) => d.kategori === 'Kinerja Petugas').length,
    })
  }

  const filterFeedback = () => {
    let result = [...feedback]

    // Filter by Tab (Kategori)
    if (activeTab !== 'all') {
      result = result.filter((d) => d.kategori === activeTab)
    }

    // Filter by Search (Pesan, Nama Pengirim, Email)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((d) =>
        d.isi_pesan.toLowerCase().includes(q) ||
        (d.masyarakat?.nama || '').toLowerCase().includes(q) ||
        (d.masyarakat?.email || '').toLowerCase().includes(q)
      )
    }

    setFiltered(result)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Helper untuk render bintang
  const renderStars = (rating: number) => {
    if (!rating) return <span className="text-xs text-gray-400 italic">Tanpa Rating</span>
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-3.5 h-3.5 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
          />
        ))}
        <span className="ml-1 text-xs font-bold text-gray-700">({rating})</span>
      </div>
    )
  }

  // Fungsi Hapus (Opsional/Simulasi)
  const handleDelete = async (id: string) => {
    if(confirm('Hapus feedback ini?')) {
        const { error } = await supabase.from('feedback_masyarakat').delete().eq('id_feedback', id) // Sesuaikan PK
        if(!error) fetchFeedback()
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-[#FDF7EE] via-[#f8f4ff] to-[#FDF7EE] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Section */}
          <div className="mb-10" data-aos="fade-down">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#3E1C96] to-[#F04438] mb-3 leading-tight">
              💬 Panel Kendali Feedback
            </h1>
            <p className="text-gray-600 text-lg max-w-3xl font-medium">
              Monitor aspirasi, saran, dan penilaian kepuasan dari masyarakat secara real-time.
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8" data-aos="fade-up">
            {/* Card 1: Total */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <MessageSquare className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{statistik.total}</span>
              </div>
              <p className="text-purple-100 font-medium">Total Masukan</p>
            </div>

            {/* Card 2: Avg Rating */}
            <div className="bg-gradient-to-br from-yellow-400 to-amber-500 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <Star className="w-8 h-8 opacity-80 fill-white" />
                <span className="text-3xl font-bold">{statistik.avgRating}</span>
              </div>
              <p className="text-yellow-100 font-medium">Rata-rata Rating</p>
            </div>

            {/* Card 3: Saran Fitur */}
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{statistik.saranFitur}</span>
              </div>
              <p className="text-blue-100 font-medium">Saran Fitur</p>
            </div>

            {/* Card 4: Laporan Bug */}
            <div className="bg-gradient-to-br from-red-500 to-orange-500 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <Bug className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{statistik.laporanBug}</span>
              </div>
              <p className="text-red-100 font-medium">Laporan Bug</p>
            </div>

            {/* Card 5: Kinerja Petugas */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-500 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <ThumbsUp className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{statistik.kinerjaPetugas}</span>
              </div>
              <p className="text-green-100 font-medium">Kinerja Petugas</p>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-100" data-aos="fade-up" data-aos-delay="200">
            
            {/* Table Header & Search */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8]">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  📂 Data Feedback Masuk
                </h2>
                <div className="relative min-w-[300px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Cari pesan atau nama pengirim..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/60 focus:bg-white/20 outline-none transition-all text-sm"
                  />
                </div>
              </div>
              
              {/* Tab Filter */}
              <div className="flex gap-2 mt-6 overflow-x-auto pb-2 scrollbar-hide">
                {(['all', 'Saran Fitur', 'Laporan Bug / Error', 'Kinerja Petugas', 'Lainnya'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      activeTab === tab
                        ? 'bg-white text-[#3E1C96] shadow-lg'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {tab === 'all' ? 'SEMUA' : tab.toUpperCase()}
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
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Pengirim</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tanggal</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kategori & Rating</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Isi Pesan</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((item, index) => (
                      <tr 
                        key={item.id_feedback || index} 
                        className={`hover:bg-purple-50/50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-[#3E1C96]">
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-800 text-sm line-clamp-1">
                                {item.masyarakat?.nama || 'Anonim'}
                              </p>
                              <p className="text-xs text-gray-500 line-clamp-1">
                                {item.masyarakat?.email || 'Email tidak tersedia'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {formatDate(item.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-block px-2 py-1 rounded-md text-[10px] font-bold border max-w-fit ${
                              item.kategori === 'Laporan Bug / Error' ? 'bg-red-50 text-red-700 border-red-100' :
                              item.kategori === 'Saran Fitur' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                              'bg-green-50 text-green-700 border-green-100'
                            }`}>
                              {item.kategori}
                            </span>
                            {renderStars(item.rating)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 line-clamp-2 italic">
                            "{item.isi_pesan}"
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleDelete(item.id_feedback)}
                            className="inline-flex items-center justify-center p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors group"
                            title="Hapus Feedback"
                          >
                            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-24">
                <ShieldCheck className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-800 uppercase">Data Tidak Ditemukan</h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">Tidak ada feedback yang sesuai dengan kriteria pencarian atau filter Anda.</p>
              </div>
            )}
          </div>

          {/* Summary */}
          {filtered.length > 0 && (
            <div className="mt-6 flex justify-between items-center px-4">
              <p className="text-sm font-medium text-gray-500">
                Menampilkan <span className="font-bold text-[#3E1C96]">{filtered.length}</span> feedback
              </p>
              <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <LayoutDashboard className="w-4 h-4" /> Feedback Monitoring
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}