'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import AOS from 'aos'
import 'aos/dist/aos.css'
import {  FileText, Clock, Info, FolderOpen, CheckCircle2, AlertCircle, Loader2, Plus, ArrowRight, Search, XCircle } from 'lucide-react'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'

type Laporan = {
  id_laporan: string
  judul: string
  status: string
  created_at: string
  deskripsi: string
  kategori_laporan: string
  urgensi_laporan: string
}

export default function DashboardUser() {
  const [user, setUser] = useState<{ id?: string; name?: string; email?: string } | null>(null)
  const [laporan, setLaporan] = useState<Laporan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    menunggu: 0,
    diproses: 0,
    selesai: 0,
    ditolak: 0
  })

  useEffect(() => {
    AOS.init({ duration: 800, once: true })
    fetchUserAndLaporan()
  }, [])

  const fetchUserAndLaporan = async () => {
    try {
      // Get user from localStorage
      const localUser = JSON.parse(localStorage.getItem('user') || '{}')
      
      if (!localUser.id) {
        console.error('User not found in localStorage')
        setLoading(false)
        return
      }

      setUser({
        id: localUser.id,
        name: localUser.nama || localUser.email?.split('@')[0] || 'Warga',
        email: localUser.email
      })

      // Fetch laporan
      const { data, error } = await supabase
        .from('laporan')
        .select('id_laporan, judul, status, created_at, deskripsi, kategori_laporan, urgensi_laporan')
        .eq('id_masyarakat', localUser.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching laporan:', error.message)
        setLoading(false)
        return
      }

      const laporanData = data || []
      setLaporan(laporanData)

      // Calculate stats
      setStats({
        total: laporanData.length,
        menunggu: laporanData.filter(l => ['menunggu', 'review'].includes(l.status?.toLowerCase() || '')).length,
        diproses: laporanData.filter(l => l.status?.toLowerCase() === 'diverifikasi').length,
        selesai: laporanData.filter(l => l.status?.toLowerCase() === 'selesai').length,
        ditolak: laporanData.filter(l => l.status?.toLowerCase() === 'ditolak').length
      })

    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (status: string) => {
    const statusLower = status?.toLowerCase() || 'menunggu'
    const configs = {
      menunggu: {
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
        label: '⏱ Menunggu'
      },
      review: {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
        label: '🔍 Review'
      },
      diverifikasi: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        label: '⚙️ Diproses'
      },
      selesai: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        label: '✅ Selesai'
      },
      ditolak: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        label: '❌ Ditolak'
      }
    }
    return configs[statusLower as keyof typeof configs] || configs.menunggu
  }

  const getUrgensiColor = (urgensi: string) => {
    switch (urgensi?.toLowerCase()) {
      case 'tinggi':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'sedang':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'rendah':
        return 'bg-green-100 text-green-700 border-green-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Hari ini'
    if (diffDays === 1) return 'Kemarin'
    if (diffDays < 7) return `${diffDays} hari lalu`
    
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const filteredLaporan = laporan.filter(item =>
    item.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.deskripsi?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.kategori_laporan?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-[#FDF7EE] via-[#f8f4ff] to-[#FDF7EE] pt-20">
        {/* Header Section - More Public & Friendly */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#3E1C96] via-[#5429CC] to-[#6B35E8]">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full -ml-48 -mb-48"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center" data-aos="fade-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-6">
                <span>✨</span> Selamat Datang Kembali
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Halo, {user?.name || 'Warga'}! 👋
              </h1>
              <p className="text-white/90 text-lg max-w-2xl mx-auto mb-8">
                Suara Anda penting! Sampaikan aspirasi dan pantau perkembangannya dengan mudah
              </p>
              <a 
                href="/masyarakat/buat-laporan"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#F04438] text-white font-semibold rounded-2xl hover:bg-[#dc2626] transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 text-lg"
              >
                <Plus className="w-6 h-6" />
                Sampaikan Aspirasi
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards - More Visual & Fun */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 -mt-16 mb-12" data-aos="fade-up">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
              <div className="text-white/80 text-sm font-medium mb-2">📊 Total Aspirasi</div>
              <div className="text-4xl font-bold text-white mb-1">{stats.total}</div>
              <div className="text-white/70 text-xs">Terkirim</div>
            </div>

            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
              <div className="text-white/80 text-sm font-medium mb-2">⏳ Menunggu</div>
              <div className="text-4xl font-bold text-white mb-1">{stats.menunggu}</div>
              <div className="text-white/70 text-xs">Dalam antrian</div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
              <div className="text-white/80 text-sm font-medium mb-2">⚙️ Diproses</div>
              <div className="text-4xl font-bold text-white mb-1">{stats.diproses}</div>
              <div className="text-white/70 text-xs">Sedang ditangani</div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
              <div className="text-white/80 text-sm font-medium mb-2">✅ Selesai</div>
              <div className="text-4xl font-bold text-white mb-1">{stats.selesai}</div>
              <div className="text-white/70 text-xs">Tuntas</div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-pink-600 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 col-span-2 lg:col-span-1">
              <div className="text-white/80 text-sm font-medium mb-2">❌ Ditolak</div>
              <div className="text-4xl font-bold text-white mb-1">{stats.ditolak}</div>
              <div className="text-white/70 text-xs">Tidak memenuhi syarat</div>
            </div>
          </div>

          {/* Quick Actions - More Engaging */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12" data-aos="fade-up" data-aos-delay="100">
            <a 
              href="/masyarakat/buat-laporan" 
              className="group relative overflow-hidden bg-gradient-to-br from-[#F04438] to-[#dc2626] p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Sampaikan Aspirasi
                </h3>
                <p className="text-white/90 mb-4">Punya keluhan atau saran? Sampaikan sekarang!</p>
                <span className="inline-flex items-center gap-2 text-white font-semibold">
                  Mulai Sekarang <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </a>

            <a 
              href="/masyarakat/riwayat" 
              className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
                  <FolderOpen className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Lacak Aspirasi
                </h3>
                <p className="text-white/90 mb-4">Lihat progress dan update dari aspirasi Anda</p>
                <span className="inline-flex items-center gap-2 text-white font-semibold">
                  Cek Sekarang <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </a>

            <a 
              href="/cara-lapor" 
              className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-700 p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
                  <Info className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Panduan Praktis
                </h3>
                <p className="text-white/90 mb-4">Pelajari cara menyampaikan aspirasi yang efektif</p>
                <span className="inline-flex items-center gap-2 text-white font-semibold">
                  Pelajari <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </a>
          </div>

          {/* Recent Reports Section - More Modern */}
          <div className="bg-white rounded-3xl shadow-xl p-8" data-aos="fade-up" data-aos-delay="200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">💬 Aspirasi Terbaru</h2>
                <p className="text-gray-600">Lihat perkembangan aspirasi yang Anda sampaikan</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari aspirasi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-72 pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3E1C96] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-purple-200 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-16 h-16 border-4 border-[#3E1C96] rounded-full animate-spin border-t-transparent"></div>
                </div>
                <p className="text-gray-600 text-lg mt-6">Memuat aspirasi Anda...</p>
              </div>
            ) : filteredLaporan.length > 0 ? (
              <div className="space-y-4">
                {filteredLaporan.slice(0, 5).map((item, index) => {
                  const statusConfig = getStatusConfig(item.status)
                  
                  return (
                    <div 
                      key={item.id_laporan}
                      className="group relative p-6 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 rounded-2xl transition-all border-2 border-gray-100 hover:border-purple-200 hover:shadow-lg"
                      data-aos="fade-up"
                      data-aos-delay={index * 50}
                    >
                      {/* Status Badge - Top Right */}
                      <div className="absolute top-6 right-6">
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${statusConfig.bg} ${statusConfig.text} border-2 ${statusConfig.border}`}>
                          {statusConfig.label}
                        </span>
                      </div>

                      <div className="pr-32">
                        <h3 className="font-bold text-gray-900 text-xl group-hover:text-[#3E1C96] transition-colors mb-3">
                          {item.judul}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-xl text-sm font-semibold">
                            📁 {item.kategori_laporan}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-semibold border-2 ${getUrgensiColor(item.urgensi_laporan)}`}>
                            {item.urgensi_laporan === 'tinggi' ? '🔴' : item.urgensi_laporan === 'sedang' ? '🟡' : '🟢'} 
                            {item.urgensi_laporan}
                          </span>
                        </div>
                        
                        {item.deskripsi && (
                          <p className="text-gray-600 mb-4 line-clamp-2">
                            {item.deskripsi}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>{formatDate(item.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Show All Button */}
                {laporan.length > 5 && (
                  <div className="text-center pt-6">
                    <a 
                      href="/masyarakat/riwayat"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#3E1C96] to-[#5429CC] text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                    >
                      Lihat Semua Aspirasi
                      <ArrowRight className="w-5 h-5" />
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {searchQuery ? 'Aspirasi Tidak Ditemukan' : 'Belum Ada Aspirasi'}
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  {searchQuery 
                    ? 'Coba kata kunci lain untuk menemukan aspirasi yang Anda cari'
                    : 'Yuk mulai sampaikan aspirasi Anda! Suara Anda sangat berarti untuk perubahan yang lebih baik'}
                </p>
                {!searchQuery && (
                  <a 
                    href="/masyarakat/buat-laporan"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#F04438] to-[#dc2626] text-white font-semibold rounded-2xl hover:shadow-xl transition-all transform hover:scale-105 text-lg"
                  >
                    <Plus className="w-6 h-6" />
                    Sampaikan Aspirasi Pertama
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}