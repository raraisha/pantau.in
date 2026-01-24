'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { supabase } from '@/lib/supabase'
import { 
  TrendingUp, Clock, AlertCircle, CheckCircle2, 
  Activity, Building2, ArrowRight, Calendar, Filter, PieChart, Loader2
} from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Pie, Legend
} from 'recharts'

// --- Tipe Data ---
type Laporan = {
  id: string
  judul: string
  status: string
  created_at: string
  nama_dinas?: string
}

type DinasStat = {
  name: string
  selesai: number
  pending: number
  total: number
}

export default function DashboardAdmin() {
  const [loading, setLoading] = useState(true)
  
  // State Data
  const [stats, setStats] = useState({ total: 0, menunggu: 0, diproses: 0, selesai: 0 })
  const [laporanMacet, setLaporanMacet] = useState<Laporan[]>([])
  const [recentLaporan, setRecentLaporan] = useState<Laporan[]>([])
  const [chartData, setChartData] = useState<DinasStat[]>([])

  useEffect(() => {
    AOS.init({ duration: 800, once: true })
    fetchDataDashboard()
  }, [])

  const fetchDataDashboard = async () => {
    try {
      setLoading(true)
      
      // 1. Ambil Data LAPORAN + Relasi ke Dinas
      const { data: rawLaporan, error } = await supabase
        .from('laporan')
        .select(`
          id_laporan, judul, status, created_at,
          laporan_dinas (
            status_dinas,
            dinas:id_dinas ( nama_dinas )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Formatting Data
      const allLaporan = (rawLaporan || []).map((item: any) => {
        const dinasName = item.laporan_dinas?.[0]?.dinas?.nama_dinas || 'Belum Ditentukan'
        const statusDinas = item.laporan_dinas?.[0]?.status_dinas || 'menunggu'
        
        return {
          id: item.id_laporan,
          judul: item.judul,
          status: item.status,
          status_dinas: statusDinas,
          created_at: item.created_at,
          nama_dinas: dinasName
        }
      })

      // A. Statistik
      setStats({
        total: allLaporan.length,
        menunggu: allLaporan.filter(l => l.status === 'menunggu' || l.status_dinas === 'menunggu_assign').length,
        diproses: allLaporan.filter(l => ['diproses', 'ditugaskan', 'sedang_dikerjakan'].includes(l.status_dinas)).length,
        selesai: allLaporan.filter(l => l.status === 'selesai' || l.status_dinas === 'selesai').length
      })

      // B. Laporan Macet (> 7 Hari)
      const tujuhHariLalu = new Date()
      tujuhHariLalu.setDate(tujuhHariLalu.getDate() - 7)
      
      const macet = allLaporan.filter(l => 
        (l.status === 'menunggu' || l.status_dinas === 'menunggu_assign') && 
        new Date(l.created_at) < tujuhHariLalu
      )
      setLaporanMacet(macet.slice(0, 5))

      // C. Recent
      setRecentLaporan(allLaporan.slice(0, 5))

      // D. Chart Data
      const dinasMap: Record<string, DinasStat> = {}
      allLaporan.forEach(item => {
        if (item.nama_dinas === 'Belum Ditentukan') return
        if (!dinasMap[item.nama_dinas]) {
          dinasMap[item.nama_dinas] = { name: item.nama_dinas, selesai: 0, pending: 0, total: 0 }
        }
        dinasMap[item.nama_dinas].total += 1
        if (item.status === 'selesai' || item.status_dinas === 'selesai') {
          dinasMap[item.nama_dinas].selesai += 1
        } else {
          dinasMap[item.nama_dinas].pending += 1
        }
      })

      const processedChart = Object.values(dinasMap)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)

      setChartData(processedChart)

    } catch (err: any) {
      console.error('Dashboard Error:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })

  // Tooltip Chart Custom (Style Senada)
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 text-white p-3 rounded-lg text-xs shadow-xl border border-slate-700">
          <p className="font-bold mb-2 text-slate-200">{label}</p>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <span>Selesai: {payload[0].value}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400"></div>
            <span>Pending: {payload[1].value}</span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header Dashboard */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4" data-aos="fade-down">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-2">
                 Dashboard Admin
              </h1>
              <p className="text-slate-500 font-medium">
                Ringkasan eksekutif kinerja penanganan laporan masyarakat.
              </p>
            </div>
            
            <div className="flex gap-2">
               <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                  <Activity size={16}/> Live Report
               </button>
            </div>
          </div>

          {/* === STATISTIK CARDS (Style "Manajemen Laporan") === */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-aos="fade-up">
            <StatCard 
               label="Total Laporan" 
               value={stats.total} 
               icon={<Activity className="w-6 h-6 text-white" />} 
               gradient="from-purple-500 to-indigo-600" 
            />
            <StatCard 
               label="Menunggu" 
               value={stats.menunggu} 
               icon={<Clock className="w-6 h-6 text-white" />} 
               gradient="from-amber-400 to-orange-500" 
            />
            <StatCard 
               label="Diproses" 
               value={stats.diproses} 
               icon={<TrendingUp className="w-6 h-6 text-white" />} 
               gradient="from-blue-500 to-cyan-500" 
            />
            <StatCard 
               label="Selesai" 
               value={stats.selesai} 
               icon={<CheckCircle2 className="w-6 h-6 text-white" />} 
               gradient="from-emerald-500 to-teal-600" 
            />
          </div>

          {/* === MAIN CONTENT GRID === */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-aos="fade-up" data-aos-delay="100">
            
            {/* 1. GRAFIK KINERJA (Lebar) */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               {/* Header Gelap */}
               <div className="p-5 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                     <Building2 size={16} className="text-purple-400"/> Top 5 Kinerja Dinas
                  </h3>
               </div>
               
               <div className="p-6 h-[350px] w-full">
                 {loading ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                       <Loader2 className="w-8 h-8 animate-spin mb-2"/>
                       <span className="text-xs font-bold uppercase tracking-widest">Memuat Grafik...</span>
                    </div>
                 ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} barSize={40}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: '#F8FAFC'}} />
                        <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}}/>
                        <Bar dataKey="selesai" name="Selesai" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="pending" name="Pending" stackId="a" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                 )}
               </div>
            </div>

            {/* 2. LAPORAN MACET / ATTENTION NEEDED (Sempit) */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
               <div className="p-5 bg-rose-600 border-b border-rose-700 flex justify-between items-center">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                     <AlertCircle size={16}/> Perlu Perhatian
                  </h3>
                  <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                     {laporanMacet.length} Terlambat
                  </span>
               </div>
               
               <div className="p-0 flex-1 overflow-y-auto max-h-[350px]">
                  {laporanMacet.length === 0 ? (
                     <div className="text-center py-12 px-6">
                        <CheckCircle2 className="mx-auto text-emerald-200 mb-3" size={48}/>
                        <p className="text-slate-800 font-bold text-sm">Semua Aman!</p>
                        <p className="text-slate-400 text-xs mt-1">Tidak ada laporan yang terbengkalai lebih dari 7 hari.</p>
                     </div>
                  ) : (
                     <div className="divide-y divide-slate-100">
                        {laporanMacet.map((item) => (
                           <div key={item.id} 
                                onClick={() => window.location.href = `/admin/laporan/${item.id}`}
                                className="p-4 hover:bg-rose-50 cursor-pointer transition group">
                              <div className="flex justify-between items-start mb-1">
                                 <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded">
                                    7+ Hari Pending
                                 </span>
                                 <span className="text-[10px] text-slate-400">{formatDate(item.created_at)}</span>
                              </div>
                              <h4 className="font-bold text-slate-700 text-xs line-clamp-2 mt-2 group-hover:text-rose-700 transition">
                                 {item.judul}
                              </h4>
                              <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                 <Building2 size={10}/> {item.nama_dinas}
                              </p>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>

          </div>

          {/* 3. RECENT ACTIVITY TABLE (Style "Manajemen Laporan") */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" data-aos="fade-up">
             {/* Toolbar Gelap */}
             <div className="p-5 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-white text-sm uppercase tracking-wider">Aktivitas Laporan Terbaru</h3>
                <a href="/admin/laporan" className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition">
                   LIHAT SEMUA <ArrowRight size={12}/>
                </a>
             </div>

             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                      <tr>
                         <th className="px-6 py-4">Judul Laporan</th>
                         <th className="px-6 py-4">Dinas Terkait</th>
                         <th className="px-6 py-4">Tanggal</th>
                         <th className="px-6 py-4 text-center">Status</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 text-sm">
                      {recentLaporan.map((item) => (
                         <tr key={item.id} className="hover:bg-purple-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-700">{item.judul}</td>
                            <td className="px-6 py-4 text-slate-600 text-xs flex items-center gap-2">
                               <Building2 size={14} className="text-slate-400"/> {item.nama_dinas}
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-xs">{formatDate(item.created_at)}</td>
                            <td className="px-6 py-4 text-center">
                               {getStatusBadge(item.status)}
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>

        </div>
      </div>
      <Footer />
    </>
  )
}

// --- Sub Components (Sama Persis dengan Manajemen Laporan) ---

function StatCard({ label, value, icon, gradient }: { label: string, value: number, icon: any, gradient: string }) {
    return (
        <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${gradient} p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-1`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-bold text-white/80 uppercase tracking-wider mb-1">{label}</p>
                    <h3 className="text-2xl font-black text-white">{value}</h3>
                </div>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    {icon}
                </div>
            </div>
        </div>
    )
}

function getStatusBadge(status: string) {
   const styles = {
      menunggu: 'bg-amber-100 text-amber-700 border-amber-200',
      diproses: 'bg-blue-100 text-blue-700 border-blue-200',
      selesai: 'bg-emerald-100 text-emerald-700 border-emerald-200'
   }
   // @ts-ignore
   const activeStyle = styles[status] || 'bg-gray-100 text-gray-700'

   return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${activeStyle}`}>
         {status.toUpperCase()}
      </span>
   )
}