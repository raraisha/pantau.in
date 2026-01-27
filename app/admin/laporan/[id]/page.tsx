'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, Calendar, User, Building2, 
  CheckCircle, XCircle, Loader2, 
  Sparkles, BrainCircuit, Send, CheckSquare, Square,
  MapPin, Clock, AlertTriangle, ChevronRight, Hash,
  Camera, Search, MousePointerClick, MessageSquare // ✅ Icon sudah lengkap
} from 'lucide-react'
import 'leaflet/dist/leaflet.css'

// --- Types ---
type Masyarakat = {
  id_masyarakat: string
  nama: string
  email: string
  telp: string
}

type Dinas = {
  id_dinas: string
  nama_dinas: string
}

type Pelaksanaan = {
  foto_sesudah: string[] | null
  deskripsi_tindakan: string
  waktu_selesai: string
}

type LaporanDinas = {
  id_laporan_dinas: string 
  status_dinas: string
  catatan_dinas: string | null
  dinas: Dinas
  pelaksanaan: Pelaksanaan[] 
}

type LaporanDetail = {
  id_laporan: string
  judul: string
  deskripsi: string
  kategori_laporan: string
  status: string
  lokasi: string
  latitude: number
  longitude: number
  laporan_foto: string[] | null
  created_at: string
  saran_ai: string[] | null
  ai_reasoning: string | null
  confidence: number | null
  masyarakat: Masyarakat 
  laporan_dinas: LaporanDinas[] 
}

export default function DetailKelolaLaporan() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)

  const [laporan, setLaporan] = useState<LaporanDetail | null>(null)
  
  // State untuk Data Dinas
  const [dinasList, setDinasList] = useState<Dinas[]>([]) 
  const [selectedDinasIds, setSelectedDinasIds] = useState<string[]>([]) 
  const [searchQuery, setSearchQuery] = useState('') // State untuk Search Manual
  
  // State UI
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // --- 1. Fetch Data ---
  useEffect(() => {
    if (id) {
        fetchLaporanDetail()
        fetchListDinas()
    }
  }, [id])

  // --- 2. Load Map ---
  useEffect(() => {
    if (laporan && laporan.latitude && laporan.longitude && mapRef.current && !mapInstance.current) {
      const loadMap = async () => {
        const L = (await import('leaflet')).default
        if (mapInstance.current) {
          mapInstance.current.remove()
          mapInstance.current = null
        }
        mapInstance.current = L.map(mapRef.current!).setView([laporan.latitude, laporan.longitude], 15)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstance.current)
        
        const icon = L.divIcon({
          className: 'bg-transparent',
          html: `<div style="background-color: #7C3AED; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>`
        })
        L.marker([laporan.latitude, laporan.longitude], { icon }).addTo(mapInstance.current).bindPopup(laporan.lokasi)
      }
      loadMap()
    }
  }, [laporan])

  const fetchListDinas = async () => {
    const { data } = await supabase.from('dinas').select('id_dinas, nama_dinas').order('nama_dinas')
    if (data) setDinasList(data)
  }

  const fetchLaporanDetail = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('laporan')
        .select(`
          *,
          masyarakat!fk_laporan_masyarakat (
            id_masyarakat, nama, email, telp
          ),
          laporan_dinas (
            id_laporan_dinas, status_dinas, catatan_dinas,
            dinas ( nama_dinas ),
            pelaksanaan ( foto_sesudah, deskripsi_tindakan, waktu_selesai )
          )
        `)
        .eq('id_laporan', id)
        .single()

      if (error) throw error

      const formattedData = {
        ...data,
        masyarakat: Array.isArray(data.masyarakat) ? data.masyarakat[0] : data.masyarakat,
        laporan_dinas: data.laporan_dinas?.map((ld: any) => ({
          ...ld,
          dinas: Array.isArray(ld.dinas) ? ld.dinas[0] : ld.dinas,
          pelaksanaan: ld.pelaksanaan || []
        }))
      }

      setLaporan(formattedData as any)

      // Auto-check saran AI jika status masih baru
      if (formattedData.status === 'menunggu_verifikasi' && formattedData.saran_ai) {
        setSelectedDinasIds(formattedData.saran_ai)
      }

    } catch (err: any) {
      console.error('Error fetching:', err)
      setError('Gagal memuat data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleDinas = (idDinas: string) => {
    if (selectedDinasIds.includes(idDinas)) {
        setSelectedDinasIds(prev => prev.filter(id => id !== idDinas))
    } else {
        setSelectedDinasIds(prev => [...prev, idDinas])
    }
  }

  const handleDispatch = async () => {
    if (selectedDinasIds.length === 0) {
        alert("Pilih minimal 1 dinas untuk menangani laporan ini.")
        return
    }

    setProcessing(true)
    try {
        const insertData = selectedDinasIds.map(idDinas => ({
            id_laporan: id,
            id_dinas: idDinas,
            status_dinas: 'menunggu_assign',
            catatan_dinas: 'Ditugaskan oleh Admin (Verifikasi Manual)'
        }))

        const { error: insertError } = await supabase.from('laporan_dinas').insert(insertData)
        if (insertError) throw insertError

        const { error: updateError } = await supabase
            .from('laporan')
            .update({ status: 'diproses' })
            .eq('id_laporan', id)
        
        if (updateError) throw updateError

        setSuccess(`✅ Berhasil menugaskan ${selectedDinasIds.length} dinas!`)
        fetchLaporanDetail() 

    } catch (err: any) {
        setError("Gagal menugaskan: " + err.message)
    } finally {
        setProcessing(false)
    }
  }

  const handleVerifikasiSubTask = async (idLaporanDinas: string, isApproved: boolean) => {
    setProcessing(true)
    try {
      const newStatus = isApproved ? 'selesai' : 'revisi'
      const catatan = isApproved ? 'Disetujui Admin Pusat.' : 'Ditolak Admin Pusat. Mohon perbaiki.'

      const { error } = await supabase
        .from('laporan_dinas')
        .update({ status_dinas: newStatus, catatan_dinas: catatan })
        .eq('id_laporan_dinas', idLaporanDinas)

      if (error) throw error
      
      if (isApproved) await cekStatusUtamaOtomatis()
      
      fetchLaporanDetail()
      setSuccess(`Laporan dinas berhasil di-${isApproved ? 'terima' : 'kembalikan'}.`)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const cekStatusUtamaOtomatis = async () => {
    const { data: allDinas } = await supabase
      .from('laporan_dinas')
      .select('status_dinas')
      .eq('id_laporan', id)

    if (allDinas && allDinas.length > 0) {
       const allFinished = allDinas.every((item: any) => item.status_dinas === 'selesai')
       if (allFinished) {
          await supabase.from('laporan').update({ 
             status: 'selesai', 
             waktu_selesai: new Date().toISOString() 
          }).eq('id_laporan', id)
       }
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      menunggu_verifikasi: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      diproses: 'text-blue-600 bg-blue-50 border-blue-200',
      selesai: 'text-green-600 bg-green-50 border-green-200',
    }
    return colors[status] || 'text-gray-600 bg-gray-50 border-gray-200'
  }

  const getSubTaskStatusColor = (status: string) => {
     const colors: Record<string, string> = {
        menunggu_assign: 'bg-gray-100 text-gray-500',
        ditugaskan: 'bg-blue-100 text-blue-700',
        sedang_dikerjakan: 'bg-purple-100 text-purple-700',
        menunggu_verifikasi_admin: 'bg-orange-100 text-orange-700 animate-pulse border border-orange-200',
        selesai: 'bg-green-100 text-green-700',
        revisi: 'bg-red-100 text-red-700'
     }
     return colors[status] || 'bg-gray-100 text-gray-500'
  }

  // 🔥 LOGIKA FILTER & SORTING (AI + Manual Search)
  const filteredAndSortedDinas = dinasList
    .filter(d => d.nama_dinas.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const isASuggested = laporan?.saran_ai?.includes(a.id_dinas) || false
      const isBSuggested = laporan?.saran_ai?.includes(b.id_dinas) || false
      
      // AI Suggested tetap paling atas
      if (isASuggested && !isBSuggested) return -1
      if (!isASuggested && isBSuggested) return 1
      return a.nama_dinas.localeCompare(b.nama_dinas)
    })

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDF7EE]">
      <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
      <p className="text-gray-500 font-medium">Memuat Laporan...</p>
    </div>
  )

  if (!laporan) return <div className="min-h-screen flex items-center justify-center text-gray-500">Data laporan tidak ditemukan.</div>

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#F8F9FB] pt-24 pb-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Nav */}
          <div className="flex items-center justify-between mb-8">
             <button onClick={() => router.back()} className="group flex items-center gap-2 text-gray-500 hover:text-purple-700 font-medium transition-colors">
               <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center group-hover:border-purple-200 group-hover:bg-purple-50">
                  <ArrowLeft className="w-4 h-4" />
               </div>
               Kembali
             </button>
             <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
                <span>Admin</span> <ChevronRight className="w-3 h-3"/> <span>Verifikasi Laporan</span> <ChevronRight className="w-3 h-3"/> <span className="text-gray-800 font-bold">#{laporan.id_laporan.substring(0,6)}</span>
             </div>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl mb-6 flex items-start gap-3 shadow-sm animate-in slide-in-from-top-2">
               <XCircle className="w-5 h-5 shrink-0 mt-0.5"/> 
               <div><p className="font-bold">Terjadi Kesalahan</p><p className="text-sm">{error}</p></div>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-100 text-green-700 p-4 rounded-2xl mb-6 flex items-start gap-3 shadow-sm animate-in slide-in-from-top-2">
               <CheckCircle className="w-5 h-5 shrink-0 mt-0.5"/> 
               <div><p className="font-bold">Berhasil!</p><p className="text-sm">{success}</p></div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* KOLOM UTAMA (LEFT - 8 cols) */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* CARD UTAMA: DETAIL LAPORAN */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header Card */}
                <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
                   <div className="flex flex-wrap gap-3 mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusColor(laporan.status)}`}>
                         {laporan.status.replace(/_/g, ' ')}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-gray-100 text-gray-600 border border-gray-200">
                         {laporan.kategori_laporan}
                      </span>
                   </div>
                   <h1 className="text-3xl font-black text-gray-900 leading-tight mb-2">{laporan.judul}</h1>
                   <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4"/> {new Date(laporan.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric'})}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4"/> {new Date(laporan.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit'})}</span>
                   </div>
                </div>

                {/* Body Card */}
                <div className="p-8">
                   <div className="prose max-w-none text-gray-700 mb-8 leading-relaxed">
                      <p>{laporan.deskripsi}</p>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Foto Laporan</p>
                         {laporan.laporan_foto && laporan.laporan_foto[0] ? (
                           <div className="rounded-2xl overflow-hidden shadow-md border border-gray-100 h-64 group relative">
                              <img src={laporan.laporan_foto[0]} alt="Foto Pelapor" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"/>
                           </div>
                         ) : (
                           <div className="h-64 bg-gray-50 rounded-2xl flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200">
                             <Camera className="w-8 h-8 mb-2 opacity-50"/>
                             <span className="text-sm">Tidak ada foto dilampirkan</span>
                           </div>
                         )}
                      </div>
                      <div className="space-y-2">
                         <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Lokasi Kejadian</p>
                         <div className="rounded-2xl overflow-hidden shadow-md border border-gray-100 h-64 relative">
                            <div ref={mapRef} className="w-full h-full z-0" />
                            <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-sm border border-white/50 z-[400]">
                               <div className="flex items-start gap-2">
                                  <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5"/>
                                  <p className="text-xs font-medium text-gray-700 line-clamp-2">{laporan.lokasi}</p>
                                </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              </div>

              {/* CARD AI ANALYSIS */}
              <div className="bg-gradient-to-br from-[#F5F3FF] to-white rounded-3xl shadow-sm border border-[#E9D5FF] p-8 relative overflow-hidden">
                 <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-purple-200 rounded-full blur-3xl opacity-20"></div>
                 
                 <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                       <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-purple-600">
                          <Sparkles className="w-6 h-6 animate-pulse"/>
                       </div>
                       <div>
                          <h2 className="text-lg font-black text-gray-900">Analisis AI Assistant</h2>
                          <p className="text-sm text-purple-600 font-medium">Powered by Intelligent Classification</p>
                       </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div>
                           <div className="flex justify-between items-end mb-2">
                              <span className="text-sm font-bold text-gray-600">Confidence Score</span>
                              <span className="text-2xl font-black text-purple-700">{laporan.confidence || 0}%</span>
                           </div>
                           <div className="h-4 bg-purple-100 rounded-full overflow-hidden shadow-inner">
                              <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out" style={{ width: `${laporan.confidence || 0}%` }}></div>
                           </div>
                           <p className="text-xs text-gray-400 mt-2">Tingkat keyakinan sistem terhadap kategori dinas.</p>
                        </div>
                        <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-purple-100 shadow-sm">
                           <p className="text-sm text-gray-700 italic leading-relaxed">
                              "<span className="font-semibold text-purple-700">Insight:</span> {laporan.ai_reasoning || 'Analisis tidak tersedia.'}"
                           </p>
                        </div>
                    </div>
                 </div>
              </div>

              {/* SECTION: DISPATCHER / PROGRESS */}
              {laporan.status === 'menunggu_verifikasi' ? (
                 <div className="bg-white rounded-3xl shadow-lg border-2 border-orange-100 p-8 animate-in fade-in-50">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                           <CheckSquare className="w-6 h-6"/>
                        </div>
                        <div>
                           <h2 className="text-xl font-black text-gray-900">Verifikasi & Penugasan</h2>
                           <p className="text-sm text-gray-500">Tentukan dinas yang bertanggung jawab.</p>
                        </div>
                    </div>

                    <div className="flex gap-3 text-sm text-gray-600 mb-6 bg-orange-50 p-4 rounded-xl border border-orange-200">
                        <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0"/>
                        <p>
                            Tanda <span className="text-purple-700 font-bold bg-purple-100 px-2 rounded-md mx-1">✨ Saran AI</span> adalah rekomendasi otomatis.
                            <br/>
                            <strong>Jika salah/kurang, silakan cari dinas lain di bawah ini.</strong>
                        </p>
                    </div>

                    {/* 🔥 SEARCH BAR (MANUAL ASSIGN) 🔥 */}
                    <div className="relative mb-4 group">
                        <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
                        <input 
                           type="text" 
                           placeholder="Cari dinas manual (contoh: Damkar, Perhubungan)..."
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredAndSortedDinas.length === 0 ? (
                            <div className="col-span-2 text-center py-8 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                <Search className="w-8 h-8 mx-auto mb-2 opacity-20"/>
                                Dinas "{searchQuery}" tidak ditemukan.
                            </div>
                        ) : (
                            filteredAndSortedDinas.map((dinas) => {
                                const isSelected = selectedDinasIds.includes(dinas.id_dinas)
                                const isAiSuggested = laporan.saran_ai?.includes(dinas.id_dinas)

                                return (
                                    <div 
                                        key={dinas.id_dinas}
                                        onClick={() => handleToggleDinas(dinas.id_dinas)}
                                        className={`group relative flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border-2 ${
                                            isSelected 
                                            ? 'bg-purple-50 border-purple-600 shadow-md ring-1 ring-purple-200' 
                                            : 'bg-white border-gray-100 hover:border-purple-300 hover:bg-purple-50/50'
                                        }`}
                                    >
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors border ${isSelected ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-gray-300 text-gray-300 group-hover:border-purple-400'}`}>
                                            {isSelected && <CheckCircle className="w-4 h-4"/>}
                                        </div>
                                        
                                        <div className="flex-1">
                                            <p className={`font-bold text-sm ${isSelected ? 'text-purple-900' : 'text-gray-700'}`}>{dinas.nama_dinas}</p>
                                        </div>
                                        
                                        {isAiSuggested && (
                                           <span className="absolute top-0 right-0 -mt-2 -mr-2 text-[10px] bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-2 py-0.5 rounded-full font-bold shadow-sm z-10 flex items-center gap-1">
                                              <Sparkles className="w-3 h-3"/> AI
                                           </span>
                                        )}
                                        
                                        {/* Badge Manual Pick */}
                                        {isSelected && !isAiSuggested && (
                                            <span className="absolute top-0 right-0 -mt-2 -mr-2 text-[10px] bg-gray-700 text-white px-2 py-0.5 rounded-full font-bold shadow-sm z-10 flex items-center gap-1 animate-in zoom-in">
                                              <MousePointerClick className="w-3 h-3"/> Manual
                                            </span>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                            Terpilih: <span className="font-bold text-purple-700">{selectedDinasIds.length} Dinas</span>
                        </p>
                        <button 
                            onClick={handleDispatch}
                            disabled={processing || selectedDinasIds.length === 0}
                            className="py-3 px-8 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-purple-200 transition-all flex items-center gap-2"
                        >
                            {processing ? <Loader2 className="animate-spin w-4 h-4"/> : <Send className="w-4 h-4"/>}
                            Tugaskan Sekarang
                        </button>
                    </div>
                 </div>
              ) : (
                /* STATUS PROGRESS VIEW (Sama seperti sebelumnya) */
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                           <Building2 className="w-6 h-6"/>
                        </div>
                        <h2 className="text-2xl font-black text-gray-900">Progres Pengerjaan</h2>
                    </div>

                    {laporan.laporan_dinas.length === 0 && (
                        <div className="p-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-center text-gray-400">
                           Belum ada dinas yang ditugaskan.
                        </div>
                    )}

                    <div className="space-y-6">
                      {laporan.laporan_dinas.map((ld) => (
                        <div key={ld.id_laporan_dinas} className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-500 shadow-sm">
                                   {ld.dinas.nama_dinas.charAt(0)}
                                </div>
                                <div>
                                   <h3 className="text-lg font-bold text-gray-900">{ld.dinas.nama_dinas}</h3>
                                   <p className="text-xs text-gray-500 font-medium">ID Tugas: #{ld.id_laporan_dinas.substring(0,8)}</p>
                                </div>
                             </div>
                             
                             <div className="flex items-center gap-3">
                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${getSubTaskStatusColor(ld.status_dinas)}`}>
                                   {ld.status_dinas.replace(/_/g, ' ')}
                                </span>
                                
                                {ld.status_dinas === 'menunggu_verifikasi_admin' && (
                                   <div className="flex gap-2">
                                      <button onClick={() => handleVerifikasiSubTask(ld.id_laporan_dinas, true)} disabled={processing} 
                                        className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors shadow-sm" title="Terima Pekerjaan">
                                        {processing ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4"/>}
                                      </button>
                                      <button onClick={() => handleVerifikasiSubTask(ld.id_laporan_dinas, false)} disabled={processing}
                                        className="bg-white border border-red-200 text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors shadow-sm" title="Tolak / Revisi">
                                        <XCircle className="w-4 h-4"/>
                                      </button>
                                   </div>
                                )}
                             </div>
                          </div>

                          <div className="p-6">
                             {ld.catatan_dinas && (
                               <div className="flex gap-3 bg-blue-50/50 p-4 rounded-xl mb-6 border border-blue-100">
                                  <MessageSquare className="w-5 h-5 text-blue-500 shrink-0"/>
                                  <div>
                                     <p className="text-xs font-bold text-blue-500 uppercase mb-1">Catatan Sistem/Admin</p>
                                     <p className="text-sm text-gray-700 italic">"{ld.catatan_dinas}"</p>
                                  </div>
                               </div>
                             )}

                             <div className="space-y-3">
                                <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                   <Camera className="w-4 h-4 text-gray-400"/> Bukti Lapangan
                                </p>
                                {ld.pelaksanaan && ld.pelaksanaan.length > 0 ? (
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {ld.pelaksanaan.map((pel, idx) => (
                                      pel.foto_sesudah?.map((fotoUrl, fIdx) => (
                                        <a key={`${idx}-${fIdx}`} href={fotoUrl} target="_blank" className="group relative aspect-square rounded-xl overflow-hidden border border-gray-200 cursor-zoom-in">
                                          <img src={fotoUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Bukti" />
                                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"/>
                                        </a>
                                      ))
                                    ))}
                                  </div>
                                ) : (
                                  <div className="p-6 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
                                     <p className="text-sm text-gray-400">Belum ada dokumentasi foto dari petugas.</p>
                                  </div>
                                )}
                             </div>

                             {ld.pelaksanaan && ld.pelaksanaan[0]?.deskripsi_tindakan && (
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                   <p className="text-sm font-bold text-gray-900 mb-2">Laporan Tindakan:</p>
                                   <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl">
                                      {ld.pelaksanaan[0].deskripsi_tindakan}
                                   </p>
                                </div>
                             )}
                          </div>
                        </div>
                      ))}
                    </div>
                </div>
              )}
            </div>

            {/* KOLOM KANAN: SIDEBAR INFO */}
            <div className="lg:col-span-4 space-y-8">
               <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 sticky top-24">
                  <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                     <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-700">
                        <User className="w-6 h-6"/>
                     </div>
                     <div>
                        <h3 className="font-bold text-gray-900">Informasi Pelapor</h3>
                        <p className="text-xs text-gray-500">Data masyarakat yang melapor</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md transform rotate-3">
                      {laporan.masyarakat?.nama?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="font-bold text-lg text-gray-800 leading-tight">{laporan.masyarakat?.nama || 'Tanpa Nama'}</p>
                      <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold uppercase rounded mt-1">Masyarakat Umum</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-500"><Send className="w-4 h-4"/></div>
                       <div className="overflow-hidden">
                          <p className="text-xs text-gray-400 font-bold uppercase">Email</p>
                          <p className="text-sm font-medium text-gray-800 truncate">{laporan.masyarakat?.email || '-'}</p>
                       </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-500"><Hash className="w-4 h-4"/></div>
                       <div>
                          <p className="text-xs text-gray-400 font-bold uppercase">Telepon</p>
                          <p className="text-sm font-medium text-gray-800">{laporan.masyarakat?.telp || '-'}</p>
                       </div>
                    </div>
                  </div>
               </div>
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}