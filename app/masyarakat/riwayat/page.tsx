'use client'

import { useEffect, useState } from 'react'
import { 
  Loader2, MapPin, Clock, FileText, Search, Plus, 
  CheckCircle2, XCircle, Building2, AlertTriangle, 
  ShieldCheck, UserCog, MessageSquare, Star, Send 
} from 'lucide-react'
import AOS from 'aos'
import 'aos/dist/aos.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'

// --- Interfaces ---
interface LaporanWithDinas {
  id_laporan: string
  judul: string
  deskripsi: string
  kategori_laporan: string
  urgensi_laporan: string
  lokasi: string
  laporan_foto: string[]
  status: string 
  created_at: string
  confidence: number
  sumber_keputusan: string
  laporan_dinas: Array<{
    id_laporan_dinas: string
    status_dinas: string 
    catatan_dinas?: string
    dinas: {
      nama_dinas: string
    }
  }>
}

interface FeedbackData {
  id_feedback: string // Sesuaikan dengan PK di tabel database
  kategori: string
  isi_pesan: string
  rating: number
  created_at: string
}

export default function HistoryPage() {
  // State Data
  const [laporan, setLaporan] = useState<LaporanWithDinas[]>([])
  const [feedback, setFeedback] = useState<FeedbackData[]>([])
  
  // State UI
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'laporan' | 'feedback'>('laporan')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [error, setError] = useState('')

  useEffect(() => {
    AOS.init({ duration: 800, once: true })
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. Ambil User dari Auth Supabase
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('Sesi habis. Silakan login ulang.')
        setLoading(false)
        return
      }

      // 2. Ambil ID Masyarakat berdasarkan Email
      const { data: masyarakat } = await supabase
        .from('masyarakat')
        .select('id_masyarakat')
        .eq('email', user.email)
        .single()

      if (!masyarakat) {
        setError('Data masyarakat tidak ditemukan.')
        setLoading(false)
        return
      }

      // 3. Parallel Fetching (Laporan & Feedback)
      const [laporanRes, feedbackRes] = await Promise.all([
        // A. Fetch Laporan
        supabase
          .from('laporan')
          .select(`
            *,
            laporan_dinas (
              id_laporan_dinas, status_dinas, catatan_dinas,
              dinas ( nama_dinas )
            )
          `)
          .eq('id_masyarakat', masyarakat.id_masyarakat)
          .order('created_at', { ascending: false }),

        // B. Fetch Feedback
        supabase
          .from('feedback_masyarakat')
          .select('*')
          .eq('id_masyarakat', masyarakat.id_masyarakat)
          .order('created_at', { ascending: false })
      ])

      if (laporanRes.error) throw laporanRes.error
      if (feedbackRes.error) throw feedbackRes.error

      setLaporan(laporanRes.data || [])
      setFeedback(feedbackRes.data || [])

    } catch (err: any) {
      console.error(err)
      setError('Gagal memuat data.')
    } finally {
      setLoading(false)
    }
  }

  // --- Helpers ---
  const getParentStatusConfig = (status: string) => {
    switch (status) {
      case 'baru': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: '🆕 Menunggu Review' }
      case 'diproses': return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: '⚙️ Sedang Diproses' }
      case 'selesai': return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: '✅ Selesai' }
      case 'ditolak': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: '❌ Ditolak' }
      default: return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', label: '⏳ Menunggu' }
    }
  }

  const getDinasStatusConfig = (status: string) => {
    switch (status) {
      case 'menunggu_assign': return { color: 'bg-gray-100 text-gray-600 border-gray-200', icon: '⏳', label: 'Menunggu' }
      case 'ditugaskan': return { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '👷', label: 'Petugas OTW' }
      case 'sedang_dikerjakan': return { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: '🔨', label: 'Dikerjakan' }
      case 'menunggu_verifikasi_admin': return { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: '🔍', label: 'Verifikasi' }
      case 'selesai': return { color: 'bg-green-100 text-green-700 border-green-200', icon: '✅', label: 'Selesai' }
      case 'revisi': return { color: 'bg-red-100 text-red-700 border-red-200', icon: '⚠️', label: 'Revisi' }
      default: return { color: 'bg-gray-100 text-gray-500', icon: '❓', label: status }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  // --- Filtering Logic (Hanya untuk Laporan) ---
  const filteredLaporan = laporan.filter(item => {
    const matchesSearch = item.judul.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.kategori_laporan?.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (selectedFilter === 'all') return matchesSearch
    return matchesSearch && item.status === selectedFilter
  })

  // --- Stats Logic ---
  const stats = {
    total: laporan.length,
    menunggu: laporan.filter(l => l.status === 'baru').length,
    diproses: laporan.filter(l => l.status === 'diproses').length,
    selesai: laporan.filter(l => l.status === 'selesai').length
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#FDF7EE] pt-20">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-[#3E1C96] via-[#5429CC] to-[#6B35E8] py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Aktivitas Saya</h1>
            <p className="text-white/80 max-w-2xl mx-auto">Pantau riwayat laporan pengaduan dan feedback yang telah Anda kirimkan.</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 -mt-8">
          
          {/* TAB NAVIGATION SWITCHER */}
          <div className="flex justify-center mb-8">
             <div className="bg-white p-1.5 rounded-2xl shadow-lg border border-gray-100 inline-flex">
                <button
                  onClick={() => setActiveTab('laporan')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                    activeTab === 'laporan' 
                      ? 'bg-[#3E1C96] text-white shadow-md' 
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <FileText className="w-4 h-4" /> Riwayat Laporan
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs ml-1">{laporan.length}</span>
                </button>
                <button
                  onClick={() => setActiveTab('feedback')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                    activeTab === 'feedback' 
                      ? 'bg-[#3E1C96] text-white shadow-md' 
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" /> Riwayat Feedback
                  <span className={`px-2 py-0.5 rounded-full text-xs ml-1 ${activeTab === 'feedback' ? 'bg-white/20' : 'bg-gray-100'}`}>
                    {feedback.length}
                  </span>
                </button>
             </div>
          </div>

          {/* LOADING STATE */}
          {loading && (
             <div className="flex flex-col items-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-4" />
                <p className="text-gray-500">Memuat data...</p>
             </div>
          )}

          {/* CONTENT: LAPORAN */}
          {!loading && activeTab === 'laporan' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-2 md:gap-4 mb-8">
                {[
                  { label: 'Total', val: stats.total, bg: 'bg-white', text: 'text-gray-800' },
                  { label: 'Menunggu', val: stats.menunggu, bg: 'bg-blue-50', text: 'text-blue-700' },
                  { label: 'Diproses', val: stats.diproses, bg: 'bg-purple-50', text: 'text-purple-700' },
                  { label: 'Selesai', val: stats.selesai, bg: 'bg-green-50', text: 'text-green-700' },
                ].map((s, i) => (
                  <div key={i} className={`${s.bg} p-3 md:p-4 rounded-xl shadow-sm border border-gray-100 text-center`}>
                    <div className={`text-xl md:text-2xl font-bold ${s.text}`}>{s.val}</div>
                    <div className="text-[10px] md:text-xs font-medium text-gray-500 uppercase">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Search & Filter */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari judul atau kategori laporan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none shadow-sm"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {['all', 'baru', 'diproses', 'selesai'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setSelectedFilter(f)}
                      className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        selectedFilter === f 
                          ? 'bg-purple-600 text-white border-purple-600' 
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {f === 'all' ? 'SEMUA' : f.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* List Laporan */}
              {filteredLaporan.length > 0 ? (
                <div className="space-y-4 pb-12">
                  {filteredLaporan.map((item) => {
                    const statusConfig = getParentStatusConfig(item.status)
                    const isAiDecision = item.sumber_keputusan === 'ai' && item.confidence >= 70

                    return (
                      <div key={item.id_laporan} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                        {/* Header: Status & Tanggal */}
                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                              {statusConfig.label}
                            </span>
                            {isAiDecision ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                                <ShieldCheck className="w-3 h-3" /> AI Auto-Assign
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full border border-gray-200">
                                <UserCog className="w-3 h-3" /> Manual Review
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatDate(item.created_at)}
                          </span>
                        </div>

                        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
                          {/* Foto */}
                          <div 
                            onClick={() => item.laporan_foto?.[0] && setSelectedImage(item.laporan_foto[0])}
                            className="relative w-full md:w-48 h-48 md:h-32 rounded-xl overflow-hidden cursor-pointer flex-shrink-0 border border-gray-100 group"
                          >
                            {item.laporan_foto?.[0] ? (
                              <img src={item.laporan_foto[0]} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Bukti" />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-gray-400">
                                <FileText className="w-8 h-8 mb-2" />
                                <span className="text-xs">Tidak ada foto</span>
                              </div>
                            )}
                          </div>

                          {/* Detail Konten */}
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{item.judul}</h3>
                            <div className="flex items-center gap-2 mb-3">
                               <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded uppercase">{item.kategori_laporan}</span>
                               <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <MapPin className="w-3 h-3 text-red-500" /> {item.lokasi}
                               </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.deskripsi}</p>

                            {/* Dinas Handling */}
                            <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                              <p className="text-[10px] font-bold text-gray-400 uppercase mb-3 tracking-wider flex items-center gap-1">
                                <Building2 className="w-3 h-3"/> Unit Penanganan Dinas
                              </p>
                              
                              {item.status === 'baru' && (
                                <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-100 text-yellow-800 text-xs">
                                  <AlertTriangle className="w-4 h-4"/>
                                  <span>Menunggu admin pusat menunjuk dinas terkait.</span>
                                </div>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {item.laporan_dinas.map((ld) => {
                                  const dinasConfig = getDinasStatusConfig(ld.status_dinas)
                                  return (
                                    <div key={ld.id_laporan_dinas} className={`flex items-center justify-between p-2.5 rounded-lg border ${dinasConfig.color} bg-opacity-30`}>
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm text-xs border">
                                          {dinasConfig.icon}
                                        </div>
                                        <div>
                                          <p className="text-xs font-bold">{ld.dinas.nama_dinas}</p>
                                          <p className="text-[10px] opacity-80">{dinasConfig.label}</p>
                                        </div>
                                      </div>
                                      {ld.status_dinas === 'selesai' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-gray-900 font-bold mb-1">Belum ada laporan</h3>
                  <p className="text-gray-500 text-sm">Laporan yang Anda kirim akan muncul di sini.</p>
                </div>
              )}
            </>
          )}

          {/* CONTENT: FEEDBACK (Baru Ditambahkan) */}
          {!loading && activeTab === 'feedback' && (
            <div className="pb-12">
               {feedback.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {feedback.map((item) => (
                     <div key={item.id_feedback} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all">
                       <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-2">
                             <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 text-[10px] font-bold uppercase rounded-lg">
                               {item.kategori}
                             </span>
                          </div>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                             <Clock className="w-3 h-3" /> {formatDate(item.created_at)}
                          </span>
                       </div>
                       
                       {/* Rating Stars */}
                       {item.rating && (
                         <div className="flex gap-1 mb-3">
                           {[1, 2, 3, 4, 5].map((star) => (
                             <Star 
                               key={star} 
                               className={`w-4 h-4 ${star <= item.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} 
                             />
                           ))}
                         </div>
                       )}

                       <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 relative">
                         <MessageSquare className="w-8 h-8 text-gray-200 absolute right-4 bottom-4 rotate-12" />
                         <p className="text-sm text-gray-700 italic relative z-10">"{item.isi_pesan}"</p>
                       </div>

                       <div className="mt-4 flex items-center gap-2 text-xs text-green-600 font-medium">
                          <CheckCircle2 className="w-4 h-4" /> Terkirim ke Admin
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-gray-900 font-bold mb-1">Belum ada feedback</h3>
                    <p className="text-gray-500 text-sm mb-4">Anda belum pernah mengirimkan saran atau masukan.</p>
                    <a href="/masyarakat/feedback" className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors">
                      <Send className="w-4 h-4" /> Kirim Feedback
                    </a>
                 </div>
               )}
            </div>
          )}

        </div>
      </div>

      {/* FAB Buat Laporan Mobile (Hanya muncul di tab Laporan) */}
      {activeTab === 'laporan' && (
        <a href="/masyarakat/lapor" className="fixed bottom-6 right-6 md:hidden w-14 h-14 bg-[#3E1C96] rounded-full shadow-2xl flex items-center justify-center text-white z-40 hover:scale-110 transition-transform">
          <Plus className="w-8 h-8" />
        </a>
      )}

      {/* Modal Foto */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} className="max-w-full max-h-[80vh] rounded-lg shadow-2xl" alt="Preview" />
          <button className="absolute top-4 right-4 text-white bg-white/20 p-2 rounded-full hover:bg-white/40"><XCircle className="w-8 h-8"/></button>
        </div>
      )}

      <Footer />
    </>
  )
}