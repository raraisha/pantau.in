'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { 
  Loader2, CheckCircle, Play, Camera, 
  ArrowLeft, MapPin, AlertCircle, Info, Clock, Send
} from 'lucide-react'

export default function DetailTugasPetugas() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [tugas, setTugas] = useState<any>(null)
  
  const [fotoAfter, setFotoAfter] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [deskripsiHasil, setDeskripsiHasil] = useState('')

  useEffect(() => {
    if (params?.id) {
      fetchDetailTugas()
    }
  }, [params?.id])

  const fetchDetailTugas = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('pelaksanaan')
        .select(`
          *,
          laporan_dinas!inner (
            *,
            laporan!inner (*) 
          )
        `)
        .eq('id_pelaksanaan', params.id)
        .single()

      if (error) throw error
      setTugas(data)
    } catch (err: any) {
      console.error("Error fetching detail:", err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleMulaiKerja = async () => {
    try {
      setActionLoading(true)
      const { error } = await supabase
        .from('pelaksanaan')
        .update({ status_pelaksanaan: 'berjalan' }) // Menggunakan 'proses' agar sinkron dengan dashboard
        .eq('id_pelaksanaan', params.id)

      if (error) throw error
      alert("Status diperbarui! Selamat bekerja.")
      fetchDetailTugas()
    } catch (err: any) {
      alert("Gagal update: " + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSelesaikanTugas = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fotoAfter) return alert("Harap unggah foto bukti perbaikan!")
    if (!deskripsiHasil.trim()) return alert("Harap isi deskripsi hasil kerja!")

    try {
      setActionLoading(true)
      
      // 1. Proses Upload Foto
      const fileExt = fotoAfter.name.split('.').pop()
      const fileName = `after_${params.id}_${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('bukti_laporan') 
        .upload(fileName, fotoAfter)

      if (uploadError) throw uploadError

      // 2. Ambil Public URL
      const { data: urlData } = supabase.storage
        .from('bukti_laporan') 
        .getPublicUrl(fileName)

      const finalPublicUrl = urlData.publicUrl

      // 3. Update Database Pelaksanaan
      // Kita bungkus finalPublicUrl ke dalam array [ ] untuk menghindari malformed array literal
      const { error: updateError } = await supabase
        .from('pelaksanaan')
        .update({
          status_pelaksanaan: 'selesai',
          foto_sesudah: [finalPublicUrl], // Gunakan array jika kolom di DB bertipe text[]
          keterangan_petugas: deskripsiHasil,
          updated_at: new Date().toISOString()
        })
        .eq('id_pelaksanaan', params.id)

      if (updateError) throw updateError

      alert("Tugas selesai dikerjakan! Kerja bagus.");
      router.push('/petugas/tugas')
    } catch (err: any) {
      console.error("Error submit:", err)
      alert("Gagal mengirim: " + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDF7EE]">
      <Loader2 className="w-12 h-12 animate-spin text-[#3E1C96] mb-4" />
      <p className="text-[#3E1C96] font-medium">Memuat detail tugas...</p>
    </div>
  )

  if (!tugas) return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
      <p className="text-gray-600 font-bold">Data tidak ditemukan</p>
      <button onClick={() => router.push('/petugas/tugas')} className="mt-4 px-6 py-2 bg-[#3E1C96] text-white rounded-xl">Kembali</button>
    </div>
  )

  // Fallback Foto Sebelum
  const fotoLaporan = tugas.laporan_dinas?.laporan?.foto_url || 
                       tugas.laporan_dinas?.laporan?.foto || 
                       'https://via.placeholder.com/400'

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#FDF7EE] pt-24 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => router.push('/petugas/tugas')} className="flex items-center gap-2 text-gray-500 mb-6 hover:text-[#3E1C96] transition-all font-medium">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Card Detail Laporan */}
              <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 bg-[#3E1C96] text-white flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    <h1 className="text-lg font-bold">Informasi Penugasan</h1>
                  </div>
                  <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    tugas.status_pelaksanaan === 'selesai' ? 'bg-green-400' : 'bg-amber-400'
                  }`}>
                    {tugas.status_pelaksanaan}
                  </span>
                </div>
                <div className="p-8">
                  <h2 className="text-3xl font-black text-gray-900 mb-4 leading-tight">{tugas.laporan_dinas?.laporan?.judul}</h2>
                  <div className="flex items-center gap-2 text-gray-500 mb-8 bg-gray-50 p-3 rounded-xl w-fit">
                    <MapPin className="w-4 h-4 text-red-500" /> 
                    <span className="text-sm font-medium">{tugas.laporan_dinas?.laporan?.lokasi}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Deskripsi Laporan</h4>
                      <p className="text-gray-700 text-sm leading-relaxed">{tugas.laporan_dinas?.laporan?.deskripsi}</p>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
                      <h4 className="text-[10px] font-black text-purple-700 uppercase mb-2 tracking-widest">Instruksi Dinas</h4>
                      <p className="text-purple-900 italic text-sm font-semibold">"{tugas.laporan_dinas?.catatan_dinas || 'Lakukan perbaikan sesuai SOP.'}"</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Aksi Petugas */}
              <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8">
                {tugas.status_pelaksanaan === 'belum_mulai' ? (
                  <div className="text-center py-6">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Play className="w-10 h-10 text-blue-600 ml-1" />
                    </div>
                    <h3 className="text-xl font-black text-gray-800 mb-2">Konfirmasi Mulai Tugas</h3>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">Pastikan Anda sudah berada di lokasi dan siap melakukan perbaikan.</p>
                    <button 
                      onClick={handleMulaiKerja} 
                      disabled={actionLoading} 
                      className="w-full py-4 bg-[#3E1C96] text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      {actionLoading ? <Loader2 className="animate-spin mx-auto" /> : 'SAYA MULAI BEKERJA SEKARANG'}
                    </button>
                  </div>
                ) : tugas.status_pelaksanaan === 'proses' || tugas.status_pelaksanaan === 'berjalan' ? (
                  <form onSubmit={handleSelesaikanTugas} className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="text-green-600 w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-black text-gray-800">Laporan Hasil Kerja</h3>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase mb-3 tracking-widest">Bukti Foto Perbaikan (Sesudah)</label>
                      <div className="relative border-2 border-dashed border-gray-200 rounded-[24px] p-8 text-center hover:bg-gray-50 hover:border-[#3E1C96] transition-all group">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if(file) { setFotoAfter(file); setPreviewUrl(URL.createObjectURL(file)); }
                          }} 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        />
                        {previewUrl ? (
                          <div className="relative inline-block">
                             <img src={previewUrl} className="h-48 rounded-2xl object-cover shadow-md" alt="Preview" />
                             <div className="absolute -top-2 -right-2 bg-[#3E1C96] text-white p-1 rounded-full"><CheckCircle className="w-4 h-4"/></div>
                          </div>
                        ) : (
                          <div className="py-4">
                            <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3 group-hover:text-[#3E1C96] transition-colors" />
                            <p className="text-sm text-gray-500 font-bold">Ambil Foto atau Upload Gambar</p>
                            <p className="text-xs text-gray-400 mt-1">Format JPG, PNG (Maks 5MB)</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase mb-3 tracking-widest">Catatan Pekerjaan</label>
                      <textarea 
                        required 
                        value={deskripsiHasil} 
                        onChange={(e) => setDeskripsiHasil(e.target.value)} 
                        className="w-full p-5 bg-gray-50 border border-gray-100 rounded-[24px] outline-none focus:ring-2 focus:ring-[#3E1C96] focus:bg-white text-gray-800 font-medium transition-all" 
                        placeholder="Jelaskan tindakan perbaikan yang Anda lakukan secara singkat..." 
                        rows={4} 
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={actionLoading} 
                      className="w-full py-5 bg-green-600 text-white rounded-2xl font-black shadow-lg shadow-green-100 hover:bg-green-700 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      {actionLoading ? <Loader2 className="animate-spin" /> : <Send className="w-5 h-5" />} 
                      KIRIM LAPORAN SELESAI
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-10">
                    <div className="inline-flex items-center gap-2 px-6 py-2 bg-green-100 text-green-700 rounded-full font-black text-xs uppercase tracking-widest">
                      <CheckCircle className="w-4 h-4" /> Tugas Telah Selesai
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Foto Sebelum */}
            <div className="space-y-6">
              <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-6 sticky top-28">
                <h4 className="font-black text-gray-400 mb-6 uppercase text-[10px] tracking-[0.2em] text-center italic underline decoration-[#F04438] underline-offset-8">Kondisi Sebelum (Before)</h4>
                <div className="relative group overflow-hidden rounded-2xl shadow-xl">
                  <img 
                    src={fotoLaporan} 
                    className="w-full aspect-[3/4] object-cover transform group-hover:scale-110 transition-transform duration-500" 
                    alt="Kondisi Sebelum" 
                  />
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