'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { 
  ArrowLeft, MapPin, CheckCircle, Image as ImageIcon, Phone, ThumbsUp, ThumbsDown, 
  UserCheck, UserPlus, X, History, CalendarDays, AlertTriangle, Loader2
} from 'lucide-react'

// --- Types ---
type DetailLaporan = {
  id_laporan_dinas: string
  id_dinas: string
  status_dinas: string
  catatan_dinas: string
  laporan: {
    judul: string
    deskripsi: string
    lokasi: string
    kategori_laporan: string
    laporan_foto: string[]
    masyarakat: {
      nama: string
      telp: string
    }
  }
  pelaksanaan: {
    id_pelaksanaan: string
    status_pelaksanaan: string
    foto_sesudah: string[]
    deskripsi_tindakan: string
    created_at: string
    petugas: {  
      nama: string
      telp: string
    }
  }[]
}

type Petugas = {
  id_petugas: string
  nama: string
  telp: string
  jabatan: string
  beban_kerja: number
}

export default function DetailLaporanDinas() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DetailLaporan | null>(null)
  
  // State Modals
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [listPetugas, setListPetugas] = useState<Petugas[]>([])
  const [selectedPetugas, setSelectedPetugas] = useState<string>('')
  const [loadingPetugas, setLoadingPetugas] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [catatanPenolakan, setCatatanPenolakan] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (params.id) fetchDetail()
  }, [params.id])

  const fetchDetail = async () => {
    try {
      setLoading(true)
      const { data: result, error } = await supabase
        .from('laporan_dinas')
        .select(`
          *,
          laporan:laporan!fk_laporan_dinas_laporan (
            judul, deskripsi, lokasi, kategori_laporan, laporan_foto,
            masyarakat:masyarakat!fk_laporan_masyarakat (nama, telp)
          ),
          pelaksanaan (
            id_pelaksanaan, status_pelaksanaan, foto_sesudah, deskripsi_tindakan, created_at,
            petugas:petugas!fk_pelaksanaan_petugas (nama, telp)
          )
        `)
        .eq('id_laporan_dinas', params.id)
        .single()

      if (error) throw error
      
      if (result.pelaksanaan) {
        result.pelaksanaan.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      }

      const formattedData = {
        ...result,
        laporan: {
          ...result.laporan,
          masyarakat: Array.isArray(result.laporan.masyarakat) ? result.laporan.masyarakat[0] : result.laporan.masyarakat
        },
        pelaksanaan: result.pelaksanaan || []
      }

      setData(formattedData)
    } catch (err: any) {
      console.error("Error fetching detail:", err.message)
    } finally {
      setLoading(false)
    }
  }

  // --- ACTIONS ---
  const fetchPetugas = async () => {
    if (!data?.id_dinas) return
    try {
      setLoadingPetugas(true)
      const { data: petugas, error } = await supabase
        .from('petugas')
        .select('id_petugas, nama, telp, jabatan, beban_kerja')
        .eq('id_dinas', data.id_dinas)
        .eq('status_aktif', true)
        .order('beban_kerja', { ascending: true })

      if (error) throw error
      setListPetugas(petugas || [])
      setShowAssignModal(true)
    } catch (err: any) {
      alert("Gagal: " + err.message)
    } finally {
      setLoadingPetugas(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedPetugas) return alert("Pilih petugas!")
    try {
      setActionLoading(true)
      const { error: dinasError } = await supabase
        .from('laporan_dinas')
        .update({
          status_dinas: 'ditugaskan',
          updated_at: new Date().toISOString()
        })
        .eq('id_laporan_dinas', params.id)

      if (dinasError) throw new Error(dinasError.message)

      alert("✅ Berhasil menugaskan petugas!")
      setShowAssignModal(false)
      fetchDetail()
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSetujui = async () => {
    try {
      setActionLoading(true)
      // STATUS BERUBAH: Dari 'menunggu_verifikasi_dinas' -> 'menunggu_verifikasi_admin' (Pusat)
      const { error } = await supabase
        .from('laporan_dinas')
        .update({ 
          status_dinas: 'menunggu_verifikasi_admin',
          catatan_dinas: 'Disetujui oleh Dinas Terkait. Menunggu approval pusat.'
        })
        .eq('id_laporan_dinas', params.id)

      if (error) throw error
      setShowApproveModal(false)
      fetchDetail()
      alert("✅ Laporan di-ACC Dinas & diteruskan ke Pusat!")
    } catch (err: any) {
      alert("Gagal: " + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleTolak = async () => {
    if (!catatanPenolakan.trim()) return alert("Wajib isi catatan!")
    try {
      setActionLoading(true)
      // STATUS BERUBAH: Dari 'menunggu_verifikasi_dinas' -> 'sedang_dikerjakan' (Kembali ke Petugas)
      const { error } = await supabase
        .from('laporan_dinas')
        .update({ 
          status_dinas: 'sedang_dikerjakan', 
          catatan_dinas: `[REVISI DINAS] ${catatanPenolakan}`
        })
        .eq('id_laporan_dinas', params.id)

      if (error) throw error
      setShowRejectModal(false)
      setCatatanPenolakan('')
      fetchDetail()
      alert("⚠️ Dikembalikan ke petugas untuk revisi.")
    } catch (err: any) {
      alert("Gagal: " + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDF7EE]">
      <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-4" />
      <p className="text-purple-600 font-medium">Memuat Data...</p>
    </div>
  )

  if (!data) return <div className="text-center py-20">Data tidak ditemukan</div>

  // --- LOGIC UI & STATUS FLOW ---
  const lastUpdate = data.pelaksanaan?.[0]
  const isMenungguAssign = data.status_dinas === 'menunggu_assign'
  const isMenungguPusat = data.status_dinas === 'menunggu_verifikasi_admin'
  const isSelesaiTotal = data.status_dinas === 'selesai'
  
  // 🔥 STATUS PENTING UNTUK DINAS
  const isMenungguVerifikasiDinas = data.status_dinas === 'menunggu_verifikasi_dinas'

  // Tombol Validasi HANYA muncul saat status 'menunggu_verifikasi_dinas'
  const canVerify = isMenungguVerifikasiDinas

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* HEADER COMPACT */}
          <div className="mb-6 flex items-center justify-between">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-purple-700 font-bold transition-colors">
              <div className="bg-white p-2 rounded-full border border-gray-200 shadow-sm"><ArrowLeft className="w-4 h-4" /></div>
              <span className="hidden md:inline">Kembali</span>
            </button>
            <div className="flex items-center gap-3">
               <span className="text-sm text-gray-500">Status Saat Ini:</span>
               <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${
                   data.status_dinas === 'selesai' ? 'bg-green-100 text-green-700 border-green-200' : 
                   data.status_dinas === 'menunggu_verifikasi_dinas' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                   'bg-yellow-100 text-yellow-700 border-yellow-200'
               }`}>
                   {data.status_dinas.replace(/_/g, ' ')}
               </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full lg:h-[calc(100vh-180px)]">
            
            {/* KIRI: DETAIL LAPORAN */}
            <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto pr-2 custom-scrollbar">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h1 className="text-2xl font-black text-gray-900 mb-4 leading-tight">{data.laporan?.judul}</h1>
                
                <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden mb-4 border border-gray-200 relative group shadow-inner">
                  {data.laporan?.laporan_foto?.[0] ? (
                    <img src={data.laporan.laporan_foto[0]} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Kondisi Awal" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400"><ImageIcon/></div>
                  )}
                  <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/20">FOTO PELAPOR</div>
                </div>

                <div className="space-y-4 text-sm">
                  <div className="flex gap-3 items-start p-3 bg-gray-50 rounded-xl">
                    <MapPin className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-gray-900 mb-1">Lokasi</p>
                        <p className="text-gray-600 leading-snug">{data.laporan?.lokasi}</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <p className="font-bold text-purple-900 mb-2 text-xs uppercase tracking-wide">Deskripsi Masalah</p>
                    <p className="text-purple-800 leading-relaxed">"{data.laporan?.deskripsi}"</p>
                  </div>

                  <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 rounded-full flex items-center justify-center font-bold shadow-sm">
                      {data.laporan?.masyarakat?.nama?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{data.laporan?.masyarakat?.nama}</p>
                      <p className="text-xs text-gray-500">{data.laporan?.masyarakat?.telp}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* KANAN: WORKSPACE (Fixed Height) */}
            <div className="lg:col-span-8 flex flex-col h-full bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
                
                {/* 1. Header Workspace */}
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                            <History className="w-6 h-6"/>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Riwayat Penanganan</h3>
                            <p className="text-xs text-gray-500">Tracking aktivitas petugas lapangan</p>
                        </div>
                    </div>
                    {lastUpdate?.petugas && (
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-[10px] font-bold text-blue-600">
                                {lastUpdate.petugas.nama.charAt(0)}
                            </div>
                            <span className="text-xs font-bold text-gray-700">{lastUpdate.petugas.nama}</span>
                        </div>
                    )}
                </div>

                {/* 2. Scrollable Timeline Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30 custom-scrollbar relative">
                    {/* Jika Belum Ada Petugas */}
                    {isMenungguAssign && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                            <div className="w-24 h-24 bg-yellow-50 rounded-full flex items-center justify-center mb-4 animate-bounce border-4 border-yellow-100">
                                <UserPlus className="w-10 h-10 text-yellow-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Belum Ada Petugas</h3>
                            <p className="text-gray-500 max-w-sm mb-6">Tugaskan seseorang untuk menangani laporan ini.</p>
                            <button onClick={fetchPetugas} disabled={loadingPetugas} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2">
                                {loadingPetugas ? <Loader2 className="animate-spin w-4 h-4"/> : <UserPlus className="w-4 h-4"/>}
                                Pilih Petugas
                            </button>
                        </div>
                    )}

                    {/* Timeline List */}
                    {!isMenungguAssign && data.pelaksanaan.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <AlertTriangle className="w-12 h-12 mb-2 opacity-20"/>
                            <p>Menunggu update pertama dari petugas...</p>
                        </div>
                    )}

                    {!isMenungguAssign && data.pelaksanaan.length > 0 && (
                        <div className="space-y-6 relative pl-4 pb-4">
                            {/* Garis Vertikal */}
                            <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-200"></div>

                            {data.pelaksanaan.map((item) => (
                                <div key={item.id_pelaksanaan} className="relative pl-10 group">
                                    {/* Dot */}
                                    <div className={`absolute left-[13px] top-6 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm z-10 
                                        ${item.status_pelaksanaan === 'selesai' ? 'bg-green-500 ring-2 ring-green-100' : 'bg-blue-500 ring-2 ring-blue-100'}
                                    `}></div>

                                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider 
                                                    ${item.status_pelaksanaan === 'selesai' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                                                    {item.status_pelaksanaan === 'selesai' ? 'Laporan Final' : 'Update Progres'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-lg">
                                                <CalendarDays className="w-3 h-3"/>
                                                {new Date(item.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', hour:'2-digit', minute:'2-digit'})}
                                            </div>
                                        </div>

                                        <p className="text-gray-700 text-sm mb-4 leading-relaxed font-medium">"{item.deskripsi_tindakan}"</p>

                                        {item.foto_sesudah && item.foto_sesudah.length > 0 && (
                                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                                {item.foto_sesudah.map((url, fIdx) => (
                                                    <div key={fIdx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-100 shrink-0 cursor-zoom-in group/img">
                                                        <img src={url} className="w-full h-full object-cover transition-transform group-hover/img:scale-110" alt="Bukti"/>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 3. Footer Action (Fixed at Bottom) */}
                <div className="p-5 border-t border-gray-200 bg-white shrink-0 z-20">
                    {canVerify ? (
                        <div className="animate-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-2 mb-3 bg-orange-50 text-orange-800 px-4 py-2 rounded-lg text-sm font-bold border border-orange-100">
                                <CheckCircle className="w-4 h-4"/> Petugas melaporkan pekerjaan selesai. Silakan Verifikasi.
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setShowRejectModal(true)} className="flex-1 py-3.5 bg-white border-2 border-red-100 text-red-600 rounded-xl font-bold hover:bg-red-50 hover:border-red-200 transition-all flex justify-center gap-2 items-center">
                                    <ThumbsDown className="w-5 h-5"/> TOLAK / REVISI
                                </button>
                                <button onClick={() => setShowApproveModal(true)} className="flex-[2] py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-green-200 hover:scale-[1.01] transition-all flex justify-center gap-2 items-center">
                                    <ThumbsUp className="w-5 h-5"/> ACC & KIRIM PUSAT
                                </button>
                            </div>
                        </div>
                    ) : isMenungguPusat ? (
                        <div className="w-full py-3 bg-purple-50 text-purple-700 rounded-xl font-bold text-center border border-purple-100 flex items-center justify-center gap-2">
                            <UserCheck className="w-5 h-5"/> Menunggu Approval Pusat
                        </div>
                    ) : isSelesaiTotal ? (
                        <div className="w-full py-3 bg-green-50 text-green-700 rounded-xl font-bold text-center border border-green-100 flex items-center justify-center gap-2">
                            <CheckCircle className="w-5 h-5"/> Kasus Selesai
                        </div>
                    ) : !isMenungguAssign && (
                        <div className="w-full py-3 bg-gray-50 text-gray-400 rounded-xl font-bold text-center border border-gray-100 text-sm flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin"/> Menunggu Petugas Selesai...
                        </div>
                    )}
                </div>

            </div>
          </div>
        </div>
      </main>

      {/* --- MODAL ASSIGN --- */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-black text-gray-800">Tugaskan Petugas</h3>
              <button onClick={() => setShowAssignModal(false)} className="bg-white p-2 rounded-full hover:bg-gray-200 transition-colors"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-5 max-h-[50vh] overflow-y-auto space-y-3 custom-scrollbar">
              {listPetugas.length > 0 ? listPetugas.map((p) => (
                <div key={p.id_petugas} onClick={() => setSelectedPetugas(p.id_petugas)}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${selectedPetugas === p.id_petugas ? 'border-purple-600 bg-purple-50' : 'border-gray-100 hover:border-purple-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">{p.nama.charAt(0)}</div>
                    <div><p className="font-bold text-gray-800 text-sm">{p.nama}</p><p className="text-xs text-gray-500">{p.jabatan}</p></div>
                  </div>
                  {selectedPetugas === p.id_petugas && <CheckCircle className="w-5 h-5 text-purple-600" />}
                </div>
              )) : <div className="text-center text-gray-500 py-4">Tidak ada petugas.</div>}
            </div>
            <div className="p-5 border-t border-gray-100"><button onClick={handleAssign} disabled={actionLoading || !selectedPetugas} className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold shadow-lg">{actionLoading ? 'Memproses...' : 'Konfirmasi'}</button></div>
          </div>
        </div>
      )}

      {/* MODAL APPROVE & REJECT */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center">
                <h3 className="text-black font-bold text-lg mb-4">ACC Pekerjaan?</h3>
                <p className="text-sm text-gray-500 mb-6">Status akan berubah dan diteruskan ke Admin Pusat.</p>
                <div className="flex gap-2"><button onClick={() => setShowApproveModal(false)} className="text-black flex-1 py-2 bg-gray-100 rounded-lg font-bold">Batal</button><button onClick={handleSetujui} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold">Ya, ACC</button></div>
            </div>
        </div>
      )}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl max-w-md w-full">
                <h3 className="font-bold text-lg mb-4 text-red-600">Revisi Pekerjaan</h3>
                <textarea value={catatanPenolakan} onChange={(e) => setCatatanPenolakan(e.target.value)} className="w-full h-24 p-3 border rounded-lg mb-4 text-sm" placeholder="Alasan penolakan..."></textarea>
                <div className="flex gap-2"><button onClick={() => setShowRejectModal(false)} className="flex-1 py-2 bg-gray-100 rounded-lg font-bold">Batal</button><button onClick={handleTolak} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold">Kirim Revisi</button></div>
            </div>
        </div>
      )}

      <Footer />
    </div>
  )
}