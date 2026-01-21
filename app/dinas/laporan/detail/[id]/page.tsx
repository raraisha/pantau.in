'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { 
  ArrowLeft, MapPin, CheckCircle, Image as ImageIcon, Phone, ThumbsUp, ThumbsDown, 
  UserCheck, UserPlus, X
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
    keterangan_petugas: string
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
  
  // State Assign Petugas
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [listPetugas, setListPetugas] = useState<Petugas[]>([])
  const [selectedPetugas, setSelectedPetugas] = useState<string>('')
  const [loadingPetugas, setLoadingPetugas] = useState(false)

  // State Verifikasi
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
            id_pelaksanaan, status_pelaksanaan, foto_sesudah, deskripsi_tindakan, keterangan_petugas,
            petugas:petugas!fk_pelaksanaan_petugas (nama, telp)
          )
        `)
        .eq('id_laporan_dinas', params.id)
        .single()

      if (error) throw error
      
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

  // --- LOGIC ASSIGN PETUGAS ---
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
      alert("Gagal memuat data petugas: " + err.message)
    } finally {
      setLoadingPetugas(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedPetugas) return alert("Pilih petugas terlebih dahulu!")
    
    try {
      setActionLoading(true)

      // 1. Buat record baru di tabel 'pelaksanaan'
      const { error: pelaksanaanError } = await supabase
        .from('pelaksanaan')
        .insert({
          id_laporan_dinas: params.id,
          id_petugas: selectedPetugas,
          status_pelaksanaan: 'belum_mulai',
          waktu_mulai: new Date().toISOString()
        })

      if (pelaksanaanError) throw new Error("Gagal buat tiket pelaksanaan: " + pelaksanaanError.message)

      // 2. Update status laporan_dinas
      const { error: dinasError } = await supabase
        .from('laporan_dinas')
        .update({
          status_dinas: 'ditugaskan',
          petugas_utama: selectedPetugas,
          updated_at: new Date().toISOString()
        })
        .eq('id_laporan_dinas', params.id)

      if (dinasError) throw new Error("Gagal update status dinas: " + dinasError.message)

      alert("✅ Berhasil menugaskan petugas!")
      setShowAssignModal(false)
      fetchDetail()

    } catch (err: any) {
      console.error(err)
      alert("Terjadi kesalahan: " + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  // --- LOGIC PERSETUJUAN ---
  const handleSetujui = async () => {
    try {
      setActionLoading(true)
      const { error } = await supabase
        .from('laporan_dinas')
        .update({ 
          status_dinas: 'menunggu_verifikasi_admin',
          catatan_dinas: 'Pekerjaan selesai diverifikasi internal dinas. Menunggu approval pusat.'
        })
        .eq('id_laporan_dinas', params.id)

      if (error) throw error
      setShowApproveModal(false)
      fetchDetail()
      alert("✅ Laporan diteruskan ke Admin Pusat!")
    } catch (err: any) {
      alert("Gagal update status: " + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleTolak = async () => {
    if (!catatanPenolakan.trim()) return alert("Wajib isi catatan revisi!")
    try {
      setActionLoading(true)
      const pelaksanaanTerakhir = data?.pelaksanaan?.[0]
      if (pelaksanaanTerakhir) {
        await supabase.from('pelaksanaan')
          .update({ status_pelaksanaan: 'belum_mulai' }) 
          .eq('id_pelaksanaan', pelaksanaanTerakhir.id_pelaksanaan)
      }

      const { error } = await supabase
        .from('laporan_dinas')
        .update({ 
          status_dinas: 'ditugaskan', 
          catatan_dinas: `[REVISI] ${catatanPenolakan}`
        })
        .eq('id_laporan_dinas', params.id)

      if (error) throw error
      setShowRejectModal(false)
      setCatatanPenolakan('')
      fetchDetail()
      alert("⚠️ Pekerjaan dikembalikan ke petugas.")
    } catch (err: any) {
      alert("Gagal menolak: " + err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDF7EE]">
      <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-500 font-medium">Memuat Data...</p>
    </div>
  )

  if (!data) return <div className="text-center py-20">Data tidak ditemukan</div>

  // --- LOGIC TAMPILAN STATUS ---
  const petugasKerja = data.pelaksanaan?.[0]
  const isSelesaiKerja = petugasKerja?.foto_sesudah && petugasKerja.foto_sesudah.length > 0
  
  const isMenungguAssign = data.status_dinas === 'menunggu_assign'
  
  // Status Aktif Dinas (Petugas sedang bekerja)
  const isSedangDikerjakan = data.status_dinas === 'ditugaskan' || data.status_dinas === 'sedang_dikerjakan'
  
  // Status Setelah Validasi Dinas
  const isMenungguPusat = data.status_dinas === 'menunggu_verifikasi_admin'
  const isSelesaiTotal = data.status_dinas === 'selesai'

  // Kondisi Tombol Verifikasi Muncul: Status harus 'sedang dikerjakan' DAN petugas sudah upload foto
  const canVerify = isSedangDikerjakan && isSelesaiKerja

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-12 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          
          {/* HEADER */}
          <div className="mb-8">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-purple-700 font-bold mb-4">
              <ArrowLeft className="w-5 h-5" /> KEMBALI KE DASHBOARD
            </button>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <span className="text-purple-600 font-bold tracking-wider uppercase text-sm mb-1 block">Detail Penanganan</span>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900">{data.laporan?.judul}</h1>
              </div>
              <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${data.status_dinas === 'selesai' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                <span className="font-bold text-sm uppercase text-gray-700">{data.status_dinas.replace(/_/g, ' ')}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* KIRI: DETAIL LAPORAN */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg">
                <h3 className="font-black text-gray-400 uppercase text-xs tracking-widest mb-4">Laporan Awal</h3>
                
                <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden mb-4 border border-gray-200 relative">
                  {data.laporan?.laporan_foto?.[0] ? (
                    <img src={data.laporan.laporan_foto[0]} className="w-full h-full object-cover" alt="Kondisi Awal" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400"><ImageIcon/></div>
                  )}
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded">BEFORE</div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 font-bold mb-1">Lokasi</p>
                    <div className="flex gap-2 text-gray-800 font-medium text-sm">
                      <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                      {data.laporan?.lokasi}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold mb-1">Deskripsi</p>
                    <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 p-3 rounded-xl">
                      "{data.laporan?.deskripsi}"
                    </p>
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 font-bold mb-2">Pelapor</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold">
                        {data.laporan?.masyarakat?.nama?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{data.laporan?.masyarakat?.nama}</p>
                        <p className="text-xs text-gray-500">{data.laporan?.masyarakat?.telp}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* KANAN: STATUS & PENGERJAAN */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* JIKA BELUM ADA PETUGAS */}
              {!petugasKerja && isMenungguAssign && (
                <div className="bg-white p-10 rounded-3xl border-2 border-yellow-100 shadow-xl text-center">
                  <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                    <UserPlus className="w-10 h-10 text-yellow-500" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Belum Ada Petugas</h3>
                  <p className="text-gray-500 max-w-sm mx-auto mb-8">Laporan ini belum ditangani. Silakan pilih petugas lapangan untuk memulai pengerjaan.</p>
                  
                  <button 
                    onClick={fetchPetugas}
                    disabled={loadingPetugas}
                    className="bg-[#3E1C96] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#5225c4] transition-all shadow-lg shadow-purple-200"
                  >
                    {loadingPetugas ? 'Memuat Data...' : 'Tugaskan Petugas Sekarang'}
                  </button>
                </div>
              )}

              {/* JIKA SUDAH ADA PETUGAS */}
              {petugasKerja && (
                <div className="bg-white p-8 rounded-3xl border border-blue-100 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-blue-500"></div>
                  
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <UserCheck className="w-6 h-6 text-blue-600"/> Laporan Petugas
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Petugas: <span className="font-bold text-blue-700">{petugasKerja.petugas?.nama}</span>
                      </p>
                    </div>
                    <a href={`tel:${petugasKerja.petugas?.telp}`} className="bg-blue-50 text-blue-600 p-3 rounded-xl hover:bg-blue-100 transition-colors">
                      <Phone className="w-5 h-5" />
                    </a>
                  </div>

                  {/* Area Bukti */}
                  <div className="mb-6">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Bukti Pengerjaan (After)</p>
                    {petugasKerja.foto_sesudah && petugasKerja.foto_sesudah.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {petugasKerja.foto_sesudah.map((foto, idx) => (
                          <div key={idx} className="aspect-video rounded-2xl overflow-hidden border border-gray-200 relative group">
                            <img src={foto} className="w-full h-full object-cover" alt="Bukti" />
                            <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded">AFTER</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 bg-gray-50 rounded-2xl text-center border border-dashed border-gray-300">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                          <ImageIcon className="w-6 h-6"/>
                        </div>
                        <p className="text-gray-500 font-medium text-sm">Petugas sedang bekerja / belum upload bukti.</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 mb-8">
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Catatan</p>
                    <p className="text-gray-800 font-medium italic">
                      "{petugasKerja.deskripsi_tindakan || petugasKerja.keterangan_petugas || 'Belum ada catatan.'}"
                    </p>
                  </div>

                  {/* --- LOGIKA STATUS & TOMBOL VERIFIKASI --- */}
                  
                  {/* 1. JIKA SUDAH VALIDASI DINAS -> MENUNGGU PUSAT */}
                  {isMenungguPusat && (
                    <div className="p-4 bg-purple-50 text-purple-800 rounded-xl flex items-center gap-3 border border-purple-200 justify-center">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-sm">Sudah Divalidasi Dinas</p>
                        <p className="text-xs opacity-80">Menunggu persetujuan Admin Pusat.</p>
                      </div>
                    </div>
                  )}

                  {/* 2. JIKA SUDAH SELESAI TOTAL */}
                  {isSelesaiTotal && (
                    <div className="p-4 bg-green-50 text-green-800 rounded-xl flex items-center gap-2 border border-green-200 justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <span className="font-bold text-sm">Laporan Selesai & Ditutup.</span>
                    </div>
                  )}

                  {/* 3. JIKA BUTUH TINDAKAN ANDA (Verifikasi) */}
                  {canVerify && (
                    <div className="flex gap-4 pt-6 border-t border-gray-100">
                      <button onClick={() => setShowRejectModal(true)} className="flex-1 py-4 bg-white border-2 border-red-100 text-red-600 rounded-2xl font-bold hover:bg-red-50 transition-all flex justify-center gap-2">
                        <ThumbsDown className="w-5 h-5"/> TOLAK
                      </button>
                      <button onClick={() => setShowApproveModal(true)} className="flex-[2] py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-green-200 hover:shadow-xl hover:scale-[1.02] transition-all flex justify-center gap-2">
                        <ThumbsUp className="w-5 h-5"/> VALIDASI & KIRIM
                      </button>
                    </div>
                  )}

                  {/* 4. DEFAULT: MENUNGGU PETUGAS SELESAI */}
                  {!canVerify && !isMenungguPusat && !isSelesaiTotal && (
                    <div className="p-4 bg-yellow-50 text-yellow-800 rounded-xl flex items-center gap-2 text-sm font-bold border border-yellow-200 justify-center">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"/>
                      Menunggu Hasil Pekerjaan Petugas...
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      {/* --- MODAL ASSIGN PETUGAS --- */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-black text-gray-800">Pilih Petugas</h3>
              <button onClick={() => setShowAssignModal(false)} className="bg-white p-2 rounded-full hover:bg-gray-200 transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
              {listPetugas.length > 0 ? listPetugas.map((p) => (
                <div 
                  key={p.id_petugas}
                  onClick={() => setSelectedPetugas(p.id_petugas)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    selectedPetugas === p.id_petugas 
                      ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-200' 
                      : 'border-gray-100 hover:border-purple-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full text-white flex items-center justify-center font-bold">
                      {p.nama.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{p.nama}</p>
                      <p className="text-xs text-gray-500">{p.jabatan} • Beban: {p.beban_kerja} tugas</p>
                    </div>
                  </div>
                  {selectedPetugas === p.id_petugas && <CheckCircle className="w-6 h-6 text-purple-600" />}
                </div>
              )) : (
                <div className="text-center py-10 text-gray-500">Tidak ada petugas aktif ditemukan di dinas ini.</div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <button 
                onClick={handleAssign}
                disabled={actionLoading || !selectedPetugas}
                className="w-full py-4 bg-[#3E1C96] text-white rounded-xl font-bold shadow-lg disabled:opacity-50 hover:bg-[#5429CC] transition-all"
              >
                {actionLoading ? 'Menugaskan...' : 'Konfirmasi Penugasan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL APPROVE */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Validasi Pekerjaan?</h3>
            <p className="text-gray-500 text-sm mb-6">Laporan akan diteruskan ke Admin Pusat untuk finalisasi.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowApproveModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold">Batal</button>
              <button onClick={handleSetujui} disabled={actionLoading} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg">
                {actionLoading ? 'Proses...' : 'Ya, Validasi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REJECT */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-black mb-4 text-red-600">Revisi Pekerjaan</h3>
            <textarea 
              value={catatanPenolakan}
              onChange={(e) => setCatatanPenolakan(e.target.value)}
              className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-6"
              placeholder="Berikan alasan penolakan untuk petugas..."
            ></textarea>
            <div className="flex gap-3">
              <button onClick={() => setShowRejectModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold">Batal</button>
              <button onClick={handleTolak} disabled={actionLoading || !catatanPenolakan} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg">
                {actionLoading ? 'Proses...' : 'Kirim Revisi'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}