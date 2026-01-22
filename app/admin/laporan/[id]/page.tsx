'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, MapPin, Calendar, User, Building2, 
  CheckCircle, XCircle, AlertCircle, Loader2, 
  FileText, Clock, Camera, MessageSquare 
} from 'lucide-react'
import 'leaflet/dist/leaflet.css'

// --- Types Sesuai Schema Kamu ---
type Masyarakat = {
  id_masyarakat: string // <--- WAJIB ADA: Biar sistem tahu siapa yg dikasih poin
  nama: string
  email: string
  telp: string
}

type Dinas = {
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
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // --- 1. Fetch Data ---
  useEffect(() => {
    if (id) fetchLaporanDetail()
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
          html: `<div style="background-color: #3E1C96; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>`
        })
        L.marker([laporan.latitude, laporan.longitude], { icon }).addTo(mapInstance.current).bindPopup(laporan.lokasi)
      }
      loadMap()
    }
  }, [laporan])

  const fetchLaporanDetail = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('laporan')
        .select(`
          *,
          masyarakat!fk_laporan_masyarakat (
            id_masyarakat,   
            nama, email, telp
          ),
          laporan_dinas (
            id_laporan_dinas, status_dinas, catatan_dinas,
            dinas ( nama_dinas ),
            pelaksanaan ( foto_sesudah, deskripsi_tindakan, waktu_selesai )
          )
        `)
        // ^^^ Perhatikan baris 'id' di atas, penting untuk poin!
        .eq('id_laporan', id)
        .single()

      if (error) throw error

      // Formatting Data
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
    } catch (err: any) {
      console.error('Error fetching:', err)
      setError('Gagal memuat data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // --- 3. LOGIKA VERIFIKASI UTAMA (DENGAN EMAIL & POIN) ---
  const cekStatusUtamaOtomatis = async (idLaporan: string) => {
    console.log("1. Mengecek status dinas...");

    const { data: allDinas } = await supabase
      .from('laporan_dinas')
      .select(`status_dinas, catatan_dinas, dinas ( nama_dinas )`)
      .eq('id_laporan', idLaporan)

    if (allDinas && allDinas.length > 0) {
      const allFinished = allDinas.every((item: any) => item.status_dinas === 'selesai')
      
      if (allFinished) {
        console.log("2. Semua dinas selesai. Mengupdate status utama ke DB...");
        const waktuSelesaiNow = new Date().toISOString()

        // --- A. UPDATE DATABASE (Status Selesai) ---
        const { error: mainError } = await supabase
          .from('laporan')
          .update({ status: 'selesai', waktu_selesai: waktuSelesaiNow })
          .eq('id_laporan', idLaporan)

        if (mainError) {
            console.error("❌ ERROR UPDATE DATABASE:", mainError.message);
            return;
        } else {
            console.log("✅ Update Database Berhasil.");
        }

        console.log("3. Memproses Email & Poin untuk:", laporan?.masyarakat?.nama);

        if (laporan?.masyarakat) {
          
          // --- B. PROSES KIRIM EMAIL ---
          if (laporan.masyarakat.email) {
            const listNamaDinas = allDinas.map((d: any) => d.dinas?.nama_dinas).filter(Boolean);
            const gabunganCatatan = allDinas.map((d: any) => d.catatan_dinas).join(' | ');

            fetch('/api/send-email/laporan-selesai', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: laporan.masyarakat.email,
                nama: laporan.masyarakat.nama,
                judul: laporan.judul,
                lokasi: laporan.lokasi || 'Bandung',
                tanggalLapor: laporan.created_at,
                tanggalSelesai: waktuSelesaiNow,
                dinasList: listNamaDinas,
                catatanGabungan: gabunganCatatan,
                linkLaporan: `${window.location.origin}/masyarakat/riwayat` 
              })
            })
            .then(res => res.json())
            .then(data => console.log('✅ Email terkirim:', data))
            .catch(err => console.error('❌ Gagal kirim email:', err));
          }


          if (errorPoin) {
            console.error("❌ Gagal nambah poin:", errorPoin.message);
          } else {
            console.log(`✅ Sukses! User dapat +${POIN_REWARD} Poin.`);
          }

          setSuccess(`🎉 Laporan Selesai! Email terkirim & Pelapor dapat +${POIN_REWARD} Poin.`);
          
        } else {
            console.warn("⚠️ Data masyarakat tidak lengkap, email/poin dilewati.");
            setSuccess('Laporan Selesai (Data pelapor tidak lengkap untuk notifikasi).');
        }

        // Refresh UI
        fetchLaporanDetail();

      } else {
        console.log("Info: Belum semua dinas statusnya 'selesai'.");
      }
    }
  }

  // --- 4. LOGIKA TOMBOL KLIK ---
  const handleVerifikasiDinas = async (idLaporanDinas: string, isApproved: boolean) => {
    setProcessingId(idLaporanDinas)
    setError('')
    setSuccess('')

    try {
      const newStatus = isApproved ? 'selesai' : 'revisi'
      const catatan = isApproved 
        ? 'Disetujui oleh Admin Pusat.' 
        : 'Ditolak oleh Admin Pusat. Mohon perbaiki.'

      const { error: updateError } = await supabase
        .from('laporan_dinas')
        .update({ 
          status_dinas: newStatus,
          catatan_dinas: catatan
        })
        .eq('id_laporan_dinas', idLaporanDinas)

      if (updateError) throw updateError

      await fetchLaporanDetail()
      
      setSuccess(`Laporan dinas berhasil di-${isApproved ? 'terima' : 'kembalikan'}.`)

      if (isApproved && laporan) {
        await cekStatusUtamaOtomatis(laporan.id_laporan)
      }

    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      menunggu_assign: 'bg-gray-100 text-gray-600',
      ditugaskan: 'bg-blue-50 text-blue-600',
      sedang_dikerjakan: 'bg-purple-50 text-purple-600',
      menunggu_verifikasi_admin: 'bg-orange-50 text-orange-600 border-orange-200 animate-pulse',
      selesai: 'bg-green-50 text-green-600',
      revisi: 'bg-red-50 text-red-600'
    }
    return styles[status] || 'bg-gray-100'
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>
  if (!laporan) return <div className="min-h-screen flex items-center justify-center">Data tidak ditemukan</div>

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6">
            <ArrowLeft className="w-5 h-5" /> Kembali
          </button>

          {/* Alert Success/Error */}
          {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 flex gap-2"><XCircle/> {error}</div>}
          {success && <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6 flex gap-2"><CheckCircle/> {success}</div>}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* KOLOM KIRI: Detail & Dinas */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Card Detail Utama */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className={`p-6 text-white bg-gradient-to-r ${laporan.status === 'selesai' ? 'from-green-600 to-emerald-600' : 'from-[#3E1C96] to-[#5B2CB8]'}`}>
                  <h1 className="text-2xl font-bold">{laporan.judul}</h1>
                  <p className="opacity-90 text-sm mt-1 flex gap-2 items-center">
                    <Calendar className="w-4 h-4"/> {new Date(laporan.created_at).toLocaleDateString('id-ID')}
                    <span className="bg-white/20 px-2 rounded font-bold uppercase">{laporan.kategori_laporan}</span>
                  </p>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 mb-6 whitespace-pre-wrap">{laporan.deskripsi}</p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {laporan.laporan_foto && laporan.laporan_foto[0] ? (
                      <img src={laporan.laporan_foto[0]} alt="Foto Pelapor" className="rounded-xl w-full h-48 object-cover border" />
                    ) : (
                      <div className="h-48 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">Tidak ada foto</div>
                    )}
                    <div ref={mapRef} className="h-48 rounded-xl bg-gray-200 border z-0" />
                  </div>
                </div>
              </div>

              {/* LIST DINAS */}
              <div>
                <h2 className="text-xl font-bold mb-4 flex gap-2 items-center text-gray-800">
                  <Building2 className="text-[#3E1C96]"/> Status Pengerjaan Dinas
                </h2>

                <div className="space-y-4">
                  {laporan.laporan_dinas.map((ld) => (
                    <div key={ld.id_laporan_dinas} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                      <div className={`absolute top-0 left-0 bottom-0 w-2 ${
                        ld.status_dinas === 'selesai' ? 'bg-green-500' : 
                        ld.status_dinas === 'menunggu_verifikasi_admin' ? 'bg-orange-500' : 'bg-gray-300'
                      }`} />

                      <div className="pl-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-[#3E1C96]">{ld.dinas.nama_dinas}</h3>
                            <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${getStatusBadge(ld.status_dinas)}`}>
                              {ld.status_dinas.replace(/_/g, ' ')}
                            </span>
                          </div>

                          {ld.status_dinas === 'menunggu_verifikasi_admin' && (
                            <div className="flex gap-2">
                              <button onClick={() => handleVerifikasiDinas(ld.id_laporan_dinas, true)} disabled={!!processingId} 
                                className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-700 flex items-center gap-1">
                                {processingId === ld.id_laporan_dinas ? <Loader2 className="w-3 h-3 animate-spin"/> : <CheckCircle className="w-3 h-3"/>} Terima
                              </button>
                              <button onClick={() => handleVerifikasiDinas(ld.id_laporan_dinas, false)} disabled={!!processingId}
                                className="border border-red-200 text-red-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-50 flex items-center gap-1">
                                <XCircle className="w-3 h-3"/> Tolak
                              </button>
                            </div>
                          )}
                        </div>

                        {ld.catatan_dinas && (
                          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 italic mb-4">
                             <span className="font-bold not-italic">Catatan:</span> {ld.catatan_dinas}
                          </div>
                        )}

                        {ld.pelaksanaan && ld.pelaksanaan.length > 0 ? (
                          <div className="mt-4">
                            <p className="text-xs font-bold text-gray-500 mb-2">Bukti Pengerjaan Lapangan:</p>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                              {ld.pelaksanaan.map((pel, idx) => (
                                pel.foto_sesudah?.map((fotoUrl, fIdx) => (
                                  <a key={`${idx}-${fIdx}`} href={fotoUrl} target="_blank" className="shrink-0 w-24 h-24 rounded-lg overflow-hidden border hover:opacity-80">
                                    <img src={fotoUrl} className="w-full h-full object-cover" alt="Bukti" />
                                  </a>
                                ))
                              ))}
                            </div>
                            {ld.pelaksanaan[0]?.deskripsi_tindakan && (
                               <p className="text-xs text-gray-500 mt-1">
                                 Tindakan: {ld.pelaksanaan[0].deskripsi_tindakan}
                               </p>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 italic mt-2">Belum ada bukti foto diupload petugas.</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* KOLOM KANAN: Info Pelapor */}
            <div className="lg:col-span-1">
               <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                  <h3 className="font-bold text-gray-400 text-sm uppercase mb-4 flex gap-2 items-center">
                    <User className="w-4 h-4"/> Pelapor
                  </h3>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                      {laporan.masyarakat?.nama?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{laporan.masyarakat?.nama || 'Tanpa Nama'}</p>
                      <p className="text-xs text-gray-500">Masyarakat</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-500">Email</span>
                      <span className="font-medium truncate max-w-[150px]">{laporan.masyarakat?.email || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-500">Telp</span>
                      <span className="font-medium">{laporan.masyarakat?.telp || '-'}</span>
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