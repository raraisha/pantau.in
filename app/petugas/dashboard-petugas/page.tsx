'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { supabase } from '@/lib/supabase'
import { 
  ClipboardList, Clock, CheckCircle, Loader2, 
  TrendingUp, AlertCircle, ArrowRight, MapPin, AlertTriangle 
} from 'lucide-react'

// Sesuaikan Type dengan hasil join table
type LaporanPetugas = {
  id_pelaksanaan: string
  status_pelaksanaan: 'belum_mulai' | 'sedang_dikerjakan' | 'selesai'
  created_at: string
  judul: string
  deskripsi: string
  lokasi: string
  urgensi: string
  catatan_dinas: string
}

export default function DashboardPetugas() {
  const [tugas, setTugas] = useState<LaporanPetugas[]>([])
  const [loading, setLoading] = useState(true)
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

const fetchData = async () => {
  try {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      alert("Kamu belum login!");
      return
    }

    console.log("ID Petugas Login:", user.id);

    // Query super simpel dulu untuk tes koneksi
    const { data, error } = await supabase
      .from('pelaksanaan')
      .select(`
        *,
        laporan_dinas!inner(*, laporan!inner(*))
      `)
      .eq('id_petugas', user.id);

    if (error) {
      console.error("Detail Error Supabase:", error);
      alert("Error Database: " + error.message);
      return;
    }

    console.log("Data mentah dari DB:", data);

    if (data && data.length > 0) {
      const formattedData = data.map((item: any) => ({
        id_pelaksanaan: item.id_pelaksanaan,
        status_pelaksanaan: item.status_pelaksanaan,
        created_at: item.created_at,
        judul: item.laporan_dinas?.laporan?.judul || 'Judul Kosong',
        deskripsi: item.laporan_dinas?.laporan?.deskripsi || '-',
        lokasi: item.laporan_dinas?.laporan?.lokasi || '-',
        urgensi: item.laporan_dinas?.laporan?.urgensi_laporan || 'rendah',
        catatan_dinas: item.laporan_dinas?.catatan_dinas || '-'
      }))
      setTugas(formattedData)
    } else {
      console.log("Data berhasil ditarik tapi hasilnya 0 baris");
    }

  } catch (err: any) {
    alert("Koneksi gagal: " + err.message);
  } finally {
    setLoading(false)
  }
}

  const getStatusBadge = (status: string) => {
    const configs = {
      belum_mulai: {
        bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200',
        icon: <Clock className="w-4 h-4" />, label: 'Tugas Baru'
      },
      proses: {
        bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200',
        icon: <Loader2 className="w-4 h-4 animate-spin" />, label: 'Diproses'
      },
      selesai: {
        bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200',
        icon: <CheckCircle className="w-4 h-4" />, label: 'Selesai'
      }
    }
    const config = configs[status as keyof typeof configs] || configs.belum_mulai
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${config.bg} ${config.text} border ${config.border}`}>
        {config.icon} {config.label}
      </span>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#FDF7EE] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="mb-10" data-aos="fade-down">
            <h1 className="text-4xl font-bold text-[#3E1C96] mb-2">🛠️ Tugas Lapangan</h1>
            <p className="text-gray-600">Halo Petugas! Berikut adalah daftar laporan yang harus Anda tangani.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8" data-aos="fade-up">
            <StatCard title="Total Tugas" value={statistik.total} color="bg-purple-600" icon={<ClipboardList />} />
            <StatCard title="Tugas Baru" value={statistik.baru} color="bg-amber-500" icon={<Clock />} />
            <StatCard title="Sedang Proses" value={statistik.sedang_dikerjakan} color="bg-blue-500" icon={<Loader2 className="animate-spin" />} />
            <StatCard title="Selesai" value={statistik.selesai} color="bg-green-600" icon={<CheckCircle />} />
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200" data-aos="fade-up">
            <div className="p-6 bg-[#3E1C96] text-white font-bold text-xl">Daftar Tugas Anda</div>
            
            {loading ? (
              <div className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-purple-600" /></div>
            ) : tugas.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
                    <tr>
                      <th className="px-6 py-4">Laporan</th>
                      <th className="px-6 py-4">Lokasi</th>
                      <th className="px-6 py-4">Urgensi</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tugas.map((item) => (
                      <tr key={item.id_pelaksanaan} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-800">{item.judul}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">{item.deskripsi}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {item.lokasi}</div>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`text-xs font-bold px-2 py-1 rounded ${item.urgensi === 'tinggi' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                            {item.urgensi.toUpperCase()}
                           </span>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(item.status_pelaksanaan)}</td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => window.location.href = `/petugas/tugas/${item.id_pelaksanaan}`}
                            className="bg-[#3E1C96] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 mx-auto hover:bg-[#F04438] transition-all"
                          >
                            Kelola <ArrowRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-20 text-center">
                <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Belum ada tugas untuk Anda saat ini.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

function StatCard({ title, value, color, icon }: any) {
  return (
    <div className={`${color} p-6 rounded-2xl text-white shadow-lg`}>
      <div className="flex justify-between items-center mb-2">
        <div className="opacity-80 text-2xl">{icon}</div>
        <span className="text-3xl font-bold">{value}</span>
      </div>
      <p className="text-sm font-medium opacity-90">{title}</p>
    </div>
  )
}