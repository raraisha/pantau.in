'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { FileText, Clock, Info, FolderOpen } from 'lucide-react'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase' 

type Laporan = {
  id: string
  judul: string
  status: 'menunggu' | 'diproses' | 'selesai'
  created_at: string
}

export default function DashboardUser() {
  const [user, setUser] = useState<{ id?: string; name?: string; role?: string } | null>(null)
  const [laporan, setLaporan] = useState<Laporan[]>([])

  useEffect(() => {
    // Init AOS
    AOS.init({ duration: 800, once: true })

    // Ambil user dari localStorage
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        const parsed = JSON.parse(storedUser)
        setUser(parsed)

        // Fetch laporan user
        fetchLaporan(parsed.id)
      }
    }
  }, [])

  const fetchLaporan = async (userId: string) => {
    const { data, error } = await supabase
      .from('laporan')
      .select('id, judul, status, created_at')
      .eq('user_id', userId) // filter sesuai user login
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Error fetching laporan:', error.message)
      return
    }

    setLaporan(data || [])
  }

  const statusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'menunggu':
        return 'text-yellow-600'
      case 'diproses':
        return 'text-blue-600'
      case 'selesai':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#FDF7EE] pt-24 px-6">
        {/* Welcome Section */}
        <div data-aos="fade-down">
          <h1 className="text-3xl font-bold text-[#3E1C96] mb-2">
            Halo, {user?.name || 'Masyarakat'} 👋
          </h1>
          <p className="text-gray-700 mb-8 text-lg">
            Selamat datang di <span className="font-semibold">Pantau.in</span> – 
            Laporkan masalah publik dengan mudah, cepat, dan transparan.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10" data-aos="fade-up">
          {/* Buat Laporan */}
          <a href="/masyarakat/buat-laporan" className="bg-white p-6 rounded-2xl shadow hover:shadow-xl transition-transform transform hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="text-[#3E1C96]" size={26} />
              <h3 className="text-xl font-semibold text-[#3E1C96]">Buat Laporan</h3>
            </div>
            <p className="text-gray-600 text-sm">Sampaikan aduan atau laporan baru dengan cepat dan mudah.</p>
          </a>

          {/* Riwayat */}
          <a href="/masyarakat/riwayat" className="bg-white p-6 rounded-2xl shadow hover:shadow-xl transition-transform transform hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-3">
              <FolderOpen className="text-[#3E1C96]" size={26} />
              <h3 className="text-xl font-semibold text-[#3E1C96]">Riwayat Laporan</h3>
            </div>
            <p className="text-gray-600 text-sm">Lihat status laporan Anda yang sedang diproses atau sudah selesai.</p>
          </a>

          {/* Cara Lapor */}
          <a href="/cara-lapor" className="bg-white p-6 rounded-2xl shadow hover:shadow-xl transition-transform transform hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-3">
              <Info className="text-[#3E1C96]" size={26} />
              <h3 className="text-xl font-semibold text-[#3E1C96]">Cara Lapor</h3>
            </div>
            <p className="text-gray-600 text-sm">Panduan singkat untuk memastikan laporan Anda diterima dengan baik.</p>
          </a>
        </div>

        {/* Recent Reports */}
        <div className="bg-white p-6 rounded-2xl shadow-lg" data-aos="fade-up" data-aos-delay="200">
          <h2 className="text-2xl font-bold text-[#3E1C96] mb-4">📊 Laporan Terbaru</h2>

          {laporan.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {laporan.map((item) => (
                <li key={item.id} className="py-3 flex justify-between items-center hover:bg-gray-50 px-2 rounded transition">
                  <span>{item.judul}</span>
                  <span className={`${statusColor(item.status)} font-semibold flex items-center gap-1`}>
                    <Clock size={16} /> {item.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Belum ada laporan.</p>
          )}

          <a href="/masyarakat/riwayat" className="mt-4 inline-block text-sm text-[#F04438] font-semibold hover:underline">
            Lihat semua laporan →
          </a>
        </div>
      </div>
      <Footer />
    </>
  )
}
