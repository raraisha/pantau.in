'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { supabase } from '@/lib/supabase'
import { 
  ClipboardList, Clock, CheckCircle, Loader2, 
  TrendingUp, AlertCircle, ArrowRight, MapPin, AlertTriangle,
  Search, Zap
} from 'lucide-react'

// Tipe Data yang Disesuaikan
type LaporanPetugas = {
  id_pelaksanaan: string
  status_pelaksanaan: 'belum_mulai' | 'sedang_dikerjakan' | 'selesai' | 'revisi'
  created_at: string
  judul: string
  deskripsi: string
  lokasi: string
  urgensi: string
  catatan_dinas: string
}

export default function DashboardPetugas() {
  const [tugas, setTugas] = useState<LaporanPetugas[]>([])
  const [filteredTugas, setFilteredTugas] = useState<LaporanPetugas[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('semua')
  const [statistik, setStatistik] = useState({
    total: 0,
    baru: 0,
    sedang_dikerjakan: 0,
    selesai: 0,
  })

  useEffect(() => {
    AOS.init({ duration: 800, once: true })
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchQuery, filterStatus, tugas])

const fetchData = async () => {
    try {
      setLoading(true)
      
      // 1. Ambil User Login (Auth)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
         alert("Kamu belum login!");
         return;
      }

      // 2. Cek Log: Siapa yang login?
      console.log("🔑 Login sebagai Auth ID:", user.id);

      // 3. Cari Data Petugas berdasarkan Auth ID (account_id)
      // Kita cari: "Siapa petugas yang account_id nya = user.id?"
      const { data: dataPetugas, error: errPetugas } = await supabase
        .from('petugas')
        .select('id_petugas, nama')
        .eq('account_id', user.id) // <--- PENTING: Pakai kolom baru tadi
        .single()

      if (errPetugas || !dataPetugas) {
        console.error("❌ Akun ini tidak terdaftar sebagai petugas di tabel public.petugas");
        console.warn("Pastikan email di tabel 'petugas' sama dengan email login, lalu jalankan script SQL sinkronisasi.");
        return;
      }

      console.log("✅ Terdeteksi sebagai Petugas:", dataPetugas.nama, "(ID:", dataPetugas.id_petugas, ")");

      // 4. Gunakan ID Petugas ASLI untuk ambil tugas
      const realPetugasId = dataPetugas.id_petugas;

      const { data, error } = await supabase
        .from('pelaksanaan')
        .select(`
          id_pelaksanaan,
          status_pelaksanaan,
          created_at,
          laporan_dinas:laporan_dinas!fk_pelaksanaan_laporan_dinas (
            catatan_dinas,
            laporan:laporan!fk_laporan_dinas_laporan (
              judul,
              deskripsi,
              lokasi,
              urgensi_laporan
            )
          )
        `)
        .eq('id_petugas', realPetugasId) // <--- Pakai ID Petugas dari tabel, bukan ID Auth
        .order('created_at', { ascending: false });

      if (error) {
        console.error("❌ Error Fetch Tugas:", error);
        return;
      }

      // ... (Sisa kodenya sama, formatting data dsb)
      if (data) {
         // ... proses mapping data ...
         const formattedData = data.map((item: any) => ({
            // ... copy mapping yg lama ...
            id_pelaksanaan: item.id_pelaksanaan,
            status_pelaksanaan: item.status_pelaksanaan,
            created_at: item.created_at,
            judul: item.laporan_dinas?.laporan?.judul || 'Judul Tidak Tersedia',
            deskripsi: item.laporan_dinas?.laporan?.deskripsi || '-',
            lokasi: item.laporan_dinas?.laporan?.lokasi || '-',
            urgensi: item.laporan_dinas?.laporan?.urgensi_laporan || 'rendah',
            catatan_dinas: item.laporan_dinas?.catatan_dinas || '-'
         }))
         setTugas(formattedData)
         // ... update statistik ...
         setStatistik({
            total: formattedData.length,
            baru: formattedData.filter((t: any) => t.status_pelaksanaan === 'belum_mulai').length,
            sedang_dikerjakan: formattedData.filter((t: any) => t.status_pelaksanaan === 'sedang_dikerjakan').length,
            selesai: formattedData.filter((t: any) => ['selesai', 'menunggu verifikasi admin'].includes(t.status_pelaksanaan)).length,
         })
      }

    } catch (err: any) {
      console.error("Error System:", err.message);
    } finally {
      setLoading(false)
    }
  } 
  const applyFilters = () => {
    let filtered = [...tugas]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t => 
        t.judul.toLowerCase().includes(query) ||
        t.lokasi.toLowerCase().includes(query)
      )
    }

    if (filterStatus !== 'semua') {
      filtered = filtered.filter(t => t.status_pelaksanaan === filterStatus)
    }

    setFilteredTugas(filtered)
  }

  const getStatusBadge = (status: string) => {
    const configs = {
      belum_mulai: {
        bg: 'bg-gradient-to-r from-amber-400 to-orange-500', 
        text: 'text-white', 
        icon: <Clock className="w-4 h-4" />, 
        label: 'Tugas Baru',
        glow: 'shadow-lg shadow-amber-500/50'
      },
      sedang_dikerjakan: {
        bg: 'bg-gradient-to-r from-blue-500 to-cyan-500', 
        text: 'text-white', 
        icon: <Loader2 className="w-4 h-4 animate-spin" />, 
        label: 'Sedang Proses',
        glow: 'shadow-lg shadow-blue-500/50'
      },
      menunggu_verifikasi_admin: {
        bg: 'bg-gradient-to-r from-indigo-500 to-purple-500', 
        text: 'text-white', 
        icon: <Clock className="w-4 h-4" />, 
        label: 'Verifikasi',
        glow: 'shadow-lg shadow-indigo-500/50'
      },
      selesai: {
        bg: 'bg-gradient-to-r from-green-500 to-emerald-600', 
        text: 'text-white', 
        icon: <CheckCircle className="w-4 h-4" />, 
        label: 'Selesai',
        glow: 'shadow-lg shadow-green-500/50'
      },
      revisi: {
        bg: 'bg-gradient-to-r from-red-500 to-pink-600', 
        text: 'text-white', 
        icon: <AlertCircle className="w-4 h-4" />, 
        label: 'Revisi',
        glow: 'shadow-lg shadow-red-500/50'
      }
    }
    const config = configs[status as keyof typeof configs] || configs.belum_mulai
    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold ${config.bg} ${config.text} ${config.glow} transition-all duration-300 hover:scale-105`}>
        {config.icon} {config.label}
      </span>
    )
  }

  const getUrgensiStyle = (urgensi: string) => {
    if (urgensi === 'tinggi') {
      return 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg shadow-red-500/40'
    }
    if (urgensi === 'sedang') {
      return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-md shadow-yellow-500/30'
    }
    return 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-md shadow-blue-400/30'
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="mb-10 relative" data-aos="fade-down">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 blur-3xl opacity-20 rounded-3xl"></div>
            <div className="relative">
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 mb-3 flex items-center gap-3">
                <span className="text-5xl">🛠️</span> Tugas Lapangan
              </h1>
              <p className="text-gray-600 text-lg font-medium">Kelola semua tugas Anda dengan efisien dan terorganisir</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10" data-aos="fade-up">
            <StatCard 
              title="Total Tugas" 
              value={statistik.total} 
              gradient="from-purple-500 to-indigo-600" 
              icon={<ClipboardList className="w-8 h-8" />}
              delay={0}
            />
            <StatCard 
              title="Tugas Baru" 
              value={statistik.baru} 
              gradient="from-amber-500 to-orange-600" 
              icon={<Clock className="w-8 h-8" />}
              delay={100}
            />
            <StatCard 
              title="Sedang Proses" 
              value={statistik.sedang_dikerjakan} 
              gradient="from-blue-500 to-cyan-600" 
              icon={<Zap className="w-8 h-8" />}
              delay={200}
            />
            <StatCard 
              title="Selesai" 
              value={statistik.selesai} 
              gradient="from-green-500 to-emerald-600" 
              icon={<CheckCircle className="w-8 h-8" />}
              delay={300}
            />
          </div>

          {/* Search & Filter */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 mb-8 border border-white/50" data-aos="fade-up">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text"
                  placeholder="Cari tugas atau lokasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 outline-none transition-all duration-300"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                {['semua', 'belum_mulai', 'sedang_dikerjakan', 'selesai'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`whitespace-nowrap px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                      filterStatus === status 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {status === 'semua' ? 'Semua' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50" data-aos="fade-up">
            <div className="p-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white">
              <h2 className="font-black text-2xl flex items-center gap-3">
                <ClipboardList className="w-7 h-7" />
                Daftar Tugas Anda
              </h2>
            </div>
            
            {loading ? (
              <div className="p-20 text-center">
                <Loader2 className="w-12 h-12 animate-spin mx-auto text-purple-600 mb-4" />
                <p className="text-gray-500 font-medium">Memuat data tugas...</p>
              </div>
            ) : filteredTugas.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 text-sm uppercase font-bold">
                    <tr>
                      <th className="px-6 py-5">Laporan</th>
                      <th className="px-6 py-5">Lokasi</th>
                      <th className="px-6 py-5">Urgensi</th>
                      <th className="px-6 py-5">Status</th>
                      <th className="px-6 py-5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTugas.map((item, idx) => (
                      <tr 
                        key={item.id_pelaksanaan} 
                        className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 group"
                        data-aos="fade-up"
                        data-aos-delay={idx * 50}
                      >
                        <td className="px-6 py-5">
                          <p className="font-bold text-gray-800 group-hover:text-purple-600 transition-colors text-lg line-clamp-1">{item.judul}</p>
                          <p className="text-sm text-gray-500 line-clamp-2 mt-1">{item.deskripsi}</p>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-gray-700">
                            <MapPin className="w-5 h-5 text-red-500 flex-shrink-0" /> 
                            <span className="font-medium line-clamp-1">{item.lokasi}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`text-xs font-bold px-4 py-2 rounded-full ${getUrgensiStyle(item.urgensi)} transition-all duration-300 hover:scale-110 inline-block`}>
                            {item.urgensi.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-5">{getStatusBadge(item.status_pelaksanaan)}</td>
                        <td className="px-6 py-5 text-center">
                          <button 
                            onClick={() => window.location.href = `/petugas/tugas/${item.id_pelaksanaan}`}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-pink-600 hover:to-orange-600 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 mx-auto shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 whitespace-nowrap"
                          >
                            Kelola <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-20 text-center">
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-gray-600 font-bold text-xl mb-2">Tidak Ada Tugas Ditemukan</p>
                <p className="text-gray-500">Tugas yang di-assign akan muncul di sini</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

function StatCard({ title, value, gradient, icon, delay }: any) {
  return (
    <div 
      className={`bg-gradient-to-br ${gradient} p-6 rounded-2xl text-white shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 cursor-pointer relative overflow-hidden group`}
      data-aos="fade-up"
      data-aos-delay={delay}
    >
      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          <span className="text-5xl font-black group-hover:scale-110 transition-transform duration-300">{value}</span>
        </div>
        <p className="text-sm font-bold opacity-90 uppercase tracking-wider">{title}</p>
      </div>
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
    </div>
  )
}