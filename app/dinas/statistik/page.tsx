'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { 
  Users, TrendingUp, Activity, Award, Clock, CheckCircle, 
  AlertTriangle, BarChart3, PieChart, Calendar, Download,
  Filter, RefreshCw, Loader2, ArrowUp, ArrowDown, Minus,
  UserCheck, UserX, Briefcase, Target, Zap
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type PetugasStats = {
  id_petugas: string
  nama: string
  jabatan: string
  beban_kerja: number
  status_aktif: boolean
  created_at: string
}

type LaporanStats = {
  total_laporan: number
  selesai: number
  dalam_proses: number
  tertunda: number
}

export default function DinasStatistikPetugas() {
  const [petugas, setPetugas] = useState<PetugasStats[]>([])
  const [loading, setLoading] = useState(true)
  const [dinasInfo, setDinasInfo] = useState<any>(null)
  const [filterPeriode, setFilterPeriode] = useState<'7hari' | '30hari' | '3bulan' | 'semua'>('30hari')
  const [refreshing, setRefreshing] = useState(false)

  // Stats
  const [overallStats, setOverallStats] = useState({
    totalPetugas: 0,
    petugasAktif: 0,
    petugasNonAktif: 0,
    totalBebanKerja: 0,
    rataBebanKerja: 0,
    petugasTersibuk: null as PetugasStats | null,
    petugasTersedia: 0,
    efisiensiKerja: 0
  })

  const [trendData, setTrendData] = useState<any[]>([])
  const [bebanKerjaDistribution, setBebanKerjaDistribution] = useState<any[]>([])
  const [topPerformers, setTopPerformers] = useState<PetugasStats[]>([])
  const [jabatanStats, setJabatanStats] = useState<any[]>([])

  const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444']

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setDinasInfo(user)
    if (user.id) {
      fetchAllData(user.id)
    }
  }, [filterPeriode])

  const fetchAllData = async (idDinas: string) => {
    setLoading(true)
    try {
      await Promise.all([
        fetchPetugas(idDinas),
        fetchDinasInfo(idDinas)
      ])
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchDinasInfo = async (idDinas: string) => {
    try {
      const { data, error } = await supabase
        .from('dinas')
        .select('nama_dinas, kode_dinas')
        .eq('id_dinas', idDinas)
        .single()

      if (!error && data) {
        setDinasInfo((prev: any) => ({ ...prev, ...data }))
      }
    } catch (err) {
      console.error('Error fetching dinas info:', err)
    }
  }

  const fetchPetugas = async (idDinas: string) => {
    try {
      let query = supabase
        .from('petugas')
        .select('id_petugas, nama, jabatan, beban_kerja, status_aktif, created_at')
        .eq('id_dinas', idDinas)

      // Apply period filter
      if (filterPeriode !== 'semua') {
        const days = filterPeriode === '7hari' ? 7 : filterPeriode === '30hari' ? 30 : 90
        const dateFrom = new Date()
        dateFrom.setDate(dateFrom.getDate() - days)
        query = query.gte('created_at', dateFrom.toISOString())
      }

      const { data, error } = await query.order('beban_kerja', { ascending: false })

      if (error) throw error

      setPetugas(data || [])
      calculateStatistics(data || [])
    } catch (err) {
      console.error('Error fetching petugas:', err)
    }
  }

  const calculateStatistics = (data: PetugasStats[]) => {
    const aktif = data.filter(p => p.status_aktif)
    const totalBeban = aktif.reduce((sum, p) => sum + (p.beban_kerja || 0), 0)
    const rataBeban = aktif.length > 0 ? totalBeban / aktif.length : 0
    const tersibuk = data.reduce((prev, curr) => 
      (curr.beban_kerja > prev.beban_kerja) ? curr : prev
    , data[0] || null)
    const tersedia = aktif.filter(p => p.beban_kerja === 0).length
    const efisiensi = aktif.length > 0 ? (aktif.filter(p => p.beban_kerja > 0).length / aktif.length) * 100 : 0

    setOverallStats({
      totalPetugas: data.length,
      petugasAktif: aktif.length,
      petugasNonAktif: data.length - aktif.length,
      totalBebanKerja: totalBeban,
      rataBebanKerja: Math.round(rataBeban * 10) / 10,
      petugasTersibuk: tersibuk,
      petugasTersedia: tersedia,
      efisiensiKerja: Math.round(efisiensi)
    })

    // Beban Kerja Distribution
    const distribution = [
      { name: 'Tidak Ada Tugas (0)', value: aktif.filter(p => p.beban_kerja === 0).length, color: '#10B981' },
      { name: 'Ringan (1-3)', value: aktif.filter(p => p.beban_kerja >= 1 && p.beban_kerja <= 3).length, color: '#3B82F6' },
      { name: 'Sedang (4-6)', value: aktif.filter(p => p.beban_kerja >= 4 && p.beban_kerja <= 6).length, color: '#F59E0B' },
      { name: 'Tinggi (7-9)', value: aktif.filter(p => p.beban_kerja >= 7 && p.beban_kerja <= 9).length, color: '#EF4444' },
      { name: 'Sangat Tinggi (10+)', value: aktif.filter(p => p.beban_kerja >= 10).length, color: '#DC2626' }
    ]
    setBebanKerjaDistribution(distribution.filter(d => d.value > 0))

    // Top Performers
    setTopPerformers(aktif.slice(0, 5))

    // Jabatan Statistics
    const jabatanMap = new Map<string, number>()
    data.forEach(p => {
      const jabatan = p.jabatan || 'Tidak Ada Jabatan'
      jabatanMap.set(jabatan, (jabatanMap.get(jabatan) || 0) + 1)
    })
    const jabatanArray = Array.from(jabatanMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
    setJabatanStats(jabatanArray)

    // Trend Data (simulated monthly data)
    const monthlyTrend = [
      { bulan: 'Jul', aktif: Math.max(5, aktif.length - 8), bebanKerja: Math.max(10, totalBeban - 25) },
      { bulan: 'Agu', aktif: Math.max(6, aktif.length - 6), bebanKerja: Math.max(15, totalBeban - 20) },
      { bulan: 'Sep', aktif: Math.max(7, aktif.length - 4), bebanKerja: Math.max(20, totalBeban - 15) },
      { bulan: 'Okt', aktif: Math.max(8, aktif.length - 3), bebanKerja: Math.max(25, totalBeban - 10) },
      { bulan: 'Nov', aktif: Math.max(9, aktif.length - 2), bebanKerja: Math.max(30, totalBeban - 5) },
      { bulan: 'Des', aktif: Math.max(10, aktif.length - 1), bebanKerja: Math.max(35, totalBeban - 2) },
      { bulan: 'Jan', aktif: aktif.length, bebanKerja: totalBeban }
    ]
    setTrendData(monthlyTrend)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    if (dinasInfo?.id) {
      await fetchAllData(dinasInfo.id)
    }
    setTimeout(() => setRefreshing(false), 500)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num)
  }

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, direction: 'same' as const }
    const change = ((current - previous) / previous) * 100
    return {
      value: Math.abs(Math.round(change)),
      direction: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'same' as const
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF7EE] via-[#f8f4ff] to-[#FDF7EE] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Navbar />
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#3E1C96] to-[#F04438]">
                  📊 Statistik & Analytics
                </h1>
                {dinasInfo?.kode_dinas && (
                  <span className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-sm font-bold rounded-xl border-2 border-purple-200">
                    {dinasInfo.kode_dinas}
                  </span>
                )}
              </div>
              {dinasInfo?.nama_dinas && (
                <p className="text-gray-600 text-lg font-semibold mb-2">
                  📍 {dinasInfo.nama_dinas}
                </p>
              )}
              <p className="text-gray-600 text-base">
                Monitoring performa dan distribusi kerja petugas lapangan
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Period Filter */}
              <select
                value={filterPeriode}
                onChange={(e) => setFilterPeriode(e.target.value as any)}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3E1C96] focus:border-[#3E1C96] outline-none text-sm font-semibold bg-white cursor-pointer"
              >
                <option value="7hari">7 Hari Terakhir</option>
                <option value="30hari">30 Hari Terakhir</option>
                <option value="3bulan">3 Bulan Terakhir</option>
                <option value="semua">Semua Waktu</option>
              </select>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-[#3E1C96] mb-4" />
            <p className="text-gray-600 font-medium">Memuat statistik...</p>
          </div>
        ) : (
          <>
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Petugas */}
              <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6 hover:shadow-2xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-3xl font-bold text-gray-800">{overallStats.totalPetugas}</span>
                </div>
                <p className="text-gray-600 font-semibold text-sm">Total Petugas</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">
                    {overallStats.petugasAktif} aktif • {overallStats.petugasNonAktif} non-aktif
                  </span>
                </div>
              </div>

              {/* Rata-rata Beban Kerja */}
              <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6 hover:shadow-2xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-3xl font-bold text-gray-800">{overallStats.rataBebanKerja}</span>
                </div>
                <p className="text-gray-600 font-semibold text-sm">Rata-rata Beban Kerja</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">
                    Total: {overallStats.totalBebanKerja} tugas
                  </span>
                </div>
              </div>

              {/* Petugas Tersedia */}
              <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6 hover:shadow-2xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-3xl font-bold text-gray-800">{overallStats.petugasTersedia}</span>
                </div>
                <p className="text-gray-600 font-semibold text-sm">Petugas Tersedia</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-green-600 font-semibold">
                    Siap menerima tugas baru
                  </span>
                </div>
              </div>

              {/* Efisiensi Kerja */}
              <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6 hover:shadow-2xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-3xl font-bold text-gray-800">{overallStats.efisiensiKerja}%</span>
                </div>
                <p className="text-gray-600 font-semibold text-sm">Efisiensi Kerja</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full transition-all"
                      style={{ width: `${overallStats.efisiensiKerja}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Trend Chart */}
              <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    Tren 6 Bulan Terakhir
                  </h3>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="bulan" stroke="#6B7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '2px solid #E5E7EB', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="aktif" stroke="#8B5CF6" strokeWidth={3} name="Petugas Aktif" />
                    <Line type="monotone" dataKey="bebanKerja" stroke="#EC4899" strokeWidth={3} name="Total Beban Kerja" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Distribution Pie Chart */}
              <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-blue-600" />
                    Distribusi Beban Kerja
                  </h3>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={bebanKerjaDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {bebanKerjaDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performers */}
              <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Award className="w-6 h-6 text-yellow-500" />
                  <h3 className="text-xl font-bold text-gray-800">Top 5 Petugas Tersibuk</h3>
                </div>
                <div className="space-y-3">
                  {topPerformers.length > 0 ? (
                    topPerformers.map((petugas, index) => (
                      <div key={petugas.id_petugas} className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl border border-gray-200">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                          index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                          index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                          'bg-gradient-to-br from-purple-400 to-purple-600'
                        }`}>
                          #{index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-800">{petugas.nama}</p>
                          <p className="text-xs text-gray-600">{petugas.jabatan || 'Petugas Lapangan'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-purple-600">{petugas.beban_kerja}</p>
                          <p className="text-xs text-gray-500">tugas</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">Belum ada data petugas</p>
                  )}
                </div>
              </div>

              {/* Jabatan Statistics */}
              <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-800">Distribusi Jabatan</h3>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={jabatanStats} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" stroke="#6B7280" style={{ fontSize: '12px' }} />
                    <YAxis dataKey="name" type="category" width={150} stroke="#6B7280" style={{ fontSize: '11px' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '2px solid #E5E7EB', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Bar dataKey="value" fill="#8B5CF6" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Petugas Tersibuk Highlight */}
            {overallStats.petugasTersibuk && (
              <div className="mt-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-2xl p-8 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                    <Target className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold opacity-90">🏆 Petugas Paling Sibuk</p>
                    <h2 className="text-3xl font-bold">{overallStats.petugasTersibuk.nama}</h2>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                    <p className="text-sm opacity-90 mb-1">Jabatan</p>
                    <p className="text-lg font-bold">{overallStats.petugasTersibuk.jabatan || '-'}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                    <p className="text-sm opacity-90 mb-1">Beban Kerja</p>
                    <p className="text-lg font-bold">{overallStats.petugasTersibuk.beban_kerja} Tugas</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                    <p className="text-sm opacity-90 mb-1">Status</p>
                    <p className="text-lg font-bold">{overallStats.petugasTersibuk.status_aktif ? '✅ Aktif' : '❌ Non-Aktif'}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}