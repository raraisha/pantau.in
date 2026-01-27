'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { 
  Loader2, CheckCircle, Play, Camera, 
  ArrowLeft, MapPin, AlertCircle, Info, Clock, Send,
  History, Hammer, Flag, X, CalendarDays, AlertTriangle
} from 'lucide-react'

// --- Types ---
type DetailTugas = {
  id_laporan_dinas: string
  status_dinas: string
  catatan_dinas: string
  laporan: {
    judul: string
    deskripsi: string
    lokasi: string
    laporan_foto: string[] | string 
    created_at: string
  }
  pelaksanaan: {
    id_pelaksanaan: string
    deskripsi_tindakan: string
    foto_sesudah: string[]
    status_pelaksanaan: string 
    created_at: string
  }[]
}

export default function DetailTugasPetugas() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [tugas, setTugas] = useState<DetailTugas | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  
  // State Form
  const [deskripsi, setDeskripsi] = useState('')
  const [fotos, setFotos] = useState<File[]>([])
  const [fotoPreviews, setFotoPreviews] = useState<string[]>([])
  const [modeKerja, setModeKerja] = useState<'progres' | 'selesai'>('progres')

  // 🔥 STATE TOAST 🔥
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' })

  // Helper Toast
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000)
  }

  // 1. Fetch Data
  useEffect(() => {
    if (id) fetchDetailTugas()
  }, [id])

  const fetchDetailTugas = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('laporan_dinas')
        .select(`
          id_laporan_dinas, status_dinas, catatan_dinas,
          laporan (
            judul, deskripsi, lokasi, laporan_foto, created_at
          ),
          pelaksanaan (
            id_pelaksanaan, deskripsi_tindakan, foto_sesudah, status_pelaksanaan, created_at
          )
        `)
        .eq('id_laporan_dinas', id)
        .maybeSingle()

      if (error) throw error

      if (data) {
        if (data.pelaksanaan && Array.isArray(data.pelaksanaan)) {
          data.pelaksanaan.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        }
        
        const cleanData = {
            ...data,
            laporan: Array.isArray(data.laporan) ? data.laporan[0] : data.laporan
        }
        setTugas(cleanData as any)
      } else {
        setTugas(null)
      }
    } catch (err: any) {
      console.error("Error fetching:", err.message)
    } finally {
      setLoading(false)
    }
  }

  // 2. Handle Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFotos([...fotos, ...newFiles])
      const newPreviews = newFiles.map(file => URL.createObjectURL(file))
      setFotoPreviews([...fotoPreviews, ...newPreviews])
    }
  }

  const removeFoto = (index: number) => {
    const newFotos = [...fotos]
    const newPreviews = [...fotoPreviews]
    newFotos.splice(index, 1)
    newPreviews.splice(index, 1)
    setFotos(newFotos)
    setFotoPreviews(newPreviews)
  }

  // 3. Mulai Kerja
  const handleMulaiKerja = async () => {
    try {
      setActionLoading(true)
      const { error } = await supabase
        .from('laporan_dinas')
        .update({ status_dinas: 'sedang_dikerjakan' })
        .eq('id_laporan_dinas', id)

      if (error) throw error
      showToast("Status diperbarui! Selamat bekerja.")
      fetchDetailTugas()
    } catch (err: any) {
      showToast("Gagal update: " + err.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // 4. Submit Laporan
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!deskripsi.trim()) return showToast("Harap isi deskripsi hasil kerja!", 'error')
    if (fotos.length === 0) return showToast("Harap unggah minimal 1 foto bukti!", 'error')

    try {
      setActionLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Sesi habis")
      
      const { data: petugasData } = await supabase
        .from('petugas')
        .select('id_petugas')
        .eq('email', user.email)
        .single()
      
      const idPetugas = petugasData?.id_petugas

      // Upload Foto
      const uploadedUrls: string[] = []
      for (const file of fotos) {
        const fileExt = file.name.split('.').pop()
        const fileName = `progres-${id}-${Date.now()}-${Math.random()}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('bukti_laporan').upload(fileName, file)
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('bukti_laporan').getPublicUrl(fileName)
        uploadedUrls.push(urlData.publicUrl)
      }

      // Insert Pelaksanaan
      const { error: insertError } = await supabase.from('pelaksanaan').insert({
        id_laporan_dinas: id,
        id_petugas: idPetugas,
        deskripsi_tindakan: deskripsi,
        foto_sesudah: uploadedUrls,
        status_pelaksanaan: modeKerja,
        waktu_mulai: new Date().toISOString(),
        waktu_selesai: new Date().toISOString()
      })

      if (insertError) throw insertError

      // Update Status Laporan Dinas
      let statusBaru = 'sedang_dikerjakan'
      if (modeKerja === 'selesai') {
        statusBaru = 'menunggu_verifikasi_dinas'
      }

      const { error: updateError } = await supabase
        .from('laporan_dinas')
        .update({ 
            status_dinas: statusBaru,
            updated_at: new Date().toISOString()
        })
        .eq('id_laporan_dinas', id)

      if (updateError) throw updateError

      showToast(modeKerja === 'selesai' ? "Tugas Selesai! Menunggu verifikasi." : "Progres berhasil disimpan!")
      
      if (modeKerja === 'selesai') {
        setTimeout(() => router.push('/petugas/tugas'), 1500)
      } else {
        setDeskripsi('')
        setFotos([])
        setFotoPreviews([])
        fetchDetailTugas()
      }

    } catch (err: any) {
      console.error("Error submit:", err)
      showToast("Gagal mengirim: " + err.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDF7EE]">
      <Loader2 className="w-12 h-12 animate-spin text-[#3E1C96] mb-4" />
      <p className="text-[#3E1C96] font-medium">Memuat tugas...</p>
    </div>
  )

  if (!tugas) return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
      <p className="text-gray-600 font-bold">Data tidak ditemukan</p>
      <button onClick={() => router.push('/petugas/tugas')} className="mt-4 px-6 py-2 bg-[#3E1C96] text-white rounded-xl">Kembali</button>
    </div>
  )

  const fotoLaporan = Array.isArray(tugas.laporan?.laporan_foto) && tugas.laporan.laporan_foto.length > 0
    ? tugas.laporan.laporan_foto[0]
    : typeof tugas.laporan?.laporan_foto === 'string' 
      ? tugas.laporan.laporan_foto 
      : 'https://via.placeholder.com/400'

  const isTaskFinished = tugas.status_dinas === 'menunggu_verifikasi_dinas' || tugas.status_dinas === 'selesai'

  return (
    <>
      <Navbar />
      
      {/* 🔥 TOAST NOTIFICATION COMPONENT 🔥 */}
      <div className={`fixed top-24 right-5 z-50 transition-all duration-500 transform ${toast.show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
        <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border-l-4 ${toast.type === 'success' ? 'bg-white border-green-500 text-green-800' : 'bg-white border-red-500 text-red-800'}`}>
            {toast.type === 'success' ? <CheckCircle className="w-6 h-6 text-green-500"/> : <AlertTriangle className="w-6 h-6 text-red-500"/>}
            <div>
                <h4 className="font-bold text-sm">{toast.type === 'success' ? 'Berhasil' : 'Gagal'}</h4>
                <p className="text-xs font-medium opacity-80">{toast.message}</p>
            </div>
            <button onClick={() => setToast(prev => ({...prev, show: false}))} className="ml-4 text-gray-400 hover:text-gray-600"><X className="w-4 h-4"/></button>
        </div>
      </div>

      <div className="min-h-screen bg-[#FDF7EE] pt-24 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => router.push('/petugas/tugas')} className="flex items-center gap-2 text-gray-500 mb-6 hover:text-[#3E1C96] transition-all font-medium">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* KIRI: FORM & DATA UTAMA */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Card Detail Laporan */}
              <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 bg-[#3E1C96] text-white flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    <h1 className="text-lg font-bold">Informasi Penugasan</h1>
                  </div>
                  <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/20`}>
                    {tugas.status_dinas.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="p-8">
                  <h2 className="text-3xl font-black text-gray-900 mb-4 leading-tight">{tugas.laporan?.judul}</h2>
                  <div className="flex items-center gap-2 text-gray-500 mb-8 bg-gray-50 p-3 rounded-xl w-fit">
                    <MapPin className="w-4 h-4 text-red-500" /> 
                    <span className="text-sm font-medium">{tugas.laporan?.lokasi}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Deskripsi Laporan</h4>
                      <p className="text-gray-700 text-sm leading-relaxed">{tugas.laporan?.deskripsi}</p>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
                      <h4 className="text-[10px] font-black text-purple-700 uppercase mb-2 tracking-widest">Instruksi Dinas</h4>
                      <p className="text-purple-900 italic text-sm font-semibold">"{tugas.catatan_dinas || 'Lakukan perbaikan sesuai SOP.'}"</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* TIMELINE RIWAYAT PENGERJAAN */}
              {tugas.pelaksanaan && tugas.pelaksanaan.length > 0 && (
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <History className="w-5 h-5 text-[#3E1C96]"/> Riwayat Pengerjaan
                        </h3>
                        <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full font-medium">
                            {tugas.pelaksanaan.length} Aktivitas
                        </span>
                    </div>
                    
                    <div className="relative pl-4 space-y-8">
                        <div className="absolute left-[23px] top-2 bottom-4 w-0.5 bg-indigo-100"></div>

                        {tugas.pelaksanaan.map((item, idx) => (
                            <div key={item.id_pelaksanaan} className="relative pl-10 group">
                                <div className={`absolute left-[15px] top-5 w-4 h-4 rounded-full border-[3px] border-white shadow-sm z-10 
                                    ${item.status_pelaksanaan === 'selesai' ? 'bg-green-500 ring-2 ring-green-100' : 'bg-blue-500 ring-2 ring-blue-100'}
                                `}></div>
                                
                                <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                                        <div className="flex items-center gap-2">
                                            <CalendarDays className="w-4 h-4 text-gray-400"/>
                                            <span className="text-xs font-bold text-gray-700">
                                                {new Date(item.created_at).toLocaleDateString('id-ID', {
                                                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                                                })}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-medium px-2 border-l border-gray-200">
                                                {new Date(item.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wide w-fit 
                                            ${item.status_pelaksanaan === 'selesai' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                            {item.status_pelaksanaan === 'selesai' ? 'Selesai & Final' : 'Update Progres'}
                                        </span>
                                    </div>

                                    <div className="bg-gray-50/50 p-3 rounded-xl mb-4">
                                        <p className="text-sm text-gray-600 leading-relaxed font-medium">{item.deskripsi_tindakan}</p>
                                    </div>
                                    
                                    {item.foto_sesudah && item.foto_sesudah.length > 0 && (
                                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                            {item.foto_sesudah.map((url, fIdx) => (
                                                <div key={fIdx} className="relative shrink-0 w-20 h-20 group/img rounded-xl overflow-hidden cursor-zoom-in border border-gray-100">
                                                    <img src={url} className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-110" alt="Bukti" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
              )}

              {/* CARD AREA KERJA PETUGAS */}
              <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8">
                
                {tugas.status_dinas === 'menunggu_assign' || tugas.status_dinas === 'ditugaskan' ? (
                  <div className="text-center py-6">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <Play className="w-10 h-10 text-blue-600 ml-1" />
                    </div>
                    <h3 className="text-xl font-black text-gray-800 mb-2">Konfirmasi Mulai Tugas</h3>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">Klik tombol di bawah jika Anda sudah di lokasi dan siap melakukan perbaikan.</p>
                    <button onClick={handleMulaiKerja} disabled={actionLoading} 
                      className="w-full py-4 bg-[#3E1C96] text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all">
                      {actionLoading ? <Loader2 className="animate-spin mx-auto" /> : 'SAYA MULAI BEKERJA'}
                    </button>
                  </div>
                
                ) : !isTaskFinished ? (
                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                      <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-gray-800">Update Pengerjaan</h3>
                        <p className="text-xs text-gray-400">Laporkan perkembangan atau penyelesaian tugas.</p>
                      </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase mb-3 tracking-widest">Jenis Laporan</label>
                        <div className="grid grid-cols-2 gap-4">
                          <label className={`cursor-pointer border-2 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all ${
                            modeKerja === 'progres' 
                              ? 'border-blue-500 bg-blue-50 text-blue-700' 
                              : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200'
                          }`}>
                            <input type="radio" name="mode" value="progres" checked={modeKerja === 'progres'} onChange={() => setModeKerja('progres')} className="hidden"/>
                            <Hammer className="w-6 h-6"/>
                            <span className="font-bold text-sm">Update Progres</span>
                            <span className="text-[10px] text-center opacity-80">Pekerjaan masih berlanjut</span>
                          </label>

                          <label className={`cursor-pointer border-2 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all ${
                            modeKerja === 'selesai' 
                              ? 'border-green-500 bg-green-50 text-green-700' 
                              : 'border-gray-200 bg-white text-gray-600 hover:border-green-200'
                          }`}>
                            <input type="radio" name="mode" value="selesai" checked={modeKerja === 'selesai'} onChange={() => setModeKerja('selesai')} className="hidden"/>
                            <Flag className="w-6 h-6"/>
                            <span className="font-bold text-sm">Selesai & Final</span>
                            <span className="text-[10px] text-center opacity-80">Pekerjaan tuntas 100%</span>
                          </label>
                        </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase mb-3 tracking-widest">Bukti Foto (Sesudah)</label>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                          {fotoPreviews.map((src, idx) => (
                              <div key={idx} className="relative shrink-0 w-24 h-24 rounded-2xl overflow-hidden border border-gray-200 shadow-sm group">
                                  <img src={src} className="w-full h-full object-cover"/>
                                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                                  <button type="button" onClick={() => removeFoto(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-colors"><X className="w-3 h-3"/></button>
                              </div>
                          ))}
                          <label className="shrink-0 w-24 h-24 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all text-gray-400 hover:text-indigo-500 bg-gray-50">
                              <Camera className="w-6 h-6 mb-1"/>
                              <span className="text-[10px] font-bold">Tambah</span>
                              <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange}/>
                          </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase mb-3 tracking-widest">Catatan Pekerjaan</label>
                      <textarea required value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} 
                        className="w-full p-5 bg-gray-50 border border-gray-200 rounded-[24px] outline-none focus:ring-2 focus:ring-[#3E1C96] focus:border-transparent focus:bg-white text-gray-800 font-medium transition-all shadow-sm" 
                        placeholder={modeKerja === 'progres' ? "Contoh: Sedang melakukan pengerukan lumpur..." : "Contoh: Pengerjaan selesai, saluran air sudah lancar kembali."}
                        rows={4} 
                      />
                    </div>

                    <button type="submit" disabled={actionLoading} 
                      className={`w-full py-5 text-white rounded-2xl font-black shadow-lg transition-all flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-95 ${
                        modeKerja === 'selesai' ? 'bg-gradient-to-r from-green-600 to-emerald-600 shadow-green-200' : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-200'
                      }`}
                    >
                      {actionLoading ? <Loader2 className="animate-spin" /> : <Send className="w-5 h-5" />} 
                      {modeKerja === 'selesai' ? 'KIRIM LAPORAN SELESAI' : 'KIRIM UPDATE PROGRES'}
                    </button>
                  </form>
                
                ) : (
                  <div className="text-center py-10 bg-green-50/50 rounded-3xl border border-green-100">
                    <div className="inline-flex items-center gap-2 px-6 py-2 bg-green-100 text-green-700 rounded-full font-black text-xs uppercase tracking-widest mb-4">
                      <CheckCircle className="w-4 h-4" /> Tugas Selesai
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Menunggu Verifikasi</h3>
                    <p className="text-gray-500 mt-2 text-sm font-medium max-w-xs mx-auto">Laporan Anda sedang ditinjau oleh Admin Pusat. Terima kasih atas kerja keras Anda!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Foto Sebelum */}
            <div className="space-y-6">
              <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-6 sticky top-28">
                <h4 className="font-black text-gray-400 mb-6 uppercase text-[10px] tracking-[0.2em] text-center italic underline decoration-[#F04438] underline-offset-8">Kondisi Sebelum (Before)</h4>
                <div className="relative group overflow-hidden rounded-2xl shadow-xl">
                  <img src={fotoLaporan} className="w-full aspect-[3/4] object-cover transform group-hover:scale-110 transition-transform duration-500" alt="Kondisi Sebelum" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <p className="text-white text-[10px] font-bold flex items-center gap-2">
                      <Clock className="w-3 h-3" /> Diambil saat pelaporan warga
                    </p>
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