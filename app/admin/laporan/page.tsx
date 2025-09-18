'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { supabase } from '@/lib/supabase'
import { ClipboardList, Users, Clock, CheckCircle } from 'lucide-react'

type Laporan = {
  id: string
  judul: string
  deskripsi?: string
  status: 'menunggu' | 'diproses' | 'selesai'
  created_at: string
  users?: {
    nama: string
    email: string
  }
}

export default function DashboardAdmin() {
  const [laporan, setLaporan] = useState<Laporan[]>([])
  const [filtered, setFiltered] = useState<Laporan[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'menunggu' | 'diproses' | 'selesai'>('all')
  const [statistik, setStatistik] = useState({
    total: 0,
    menunggu: 0,
    diproses: 0,
    selesai: 0,
  })

  useEffect(() => {
    AOS.init({ duration: 800, once: true })
    fetchLaporan()
  }, [])

  useEffect(() => {
    filterLaporan()
  }, [activeTab, laporan])

  const fetchLaporan = async () => {
    const { data, error } = await supabase
      .from('laporan')
      .select(
        `
        id,
        judul,
        deskripsi,
        status,
        created_at,
        users:petugas_id ( nama, email )
      `
      )

    if (error) {
      console.error('Error fetching laporan:', error.message)
      return
    }

    setLaporan(data || [])
    hitungStatistik(data || [])
  }

  const hitungStatistik = (data: Laporan[]) => {
    const total = data.length
    const menunggu = data.filter((d) => d.status === 'menunggu').length
    const diproses = data.filter((d) => d.status === 'diproses').length
    const selesai = data.filter((d) => d.status === 'selesai').length

    setStatistik({ total, menunggu, diproses, selesai })
  }

  const filterLaporan = () => {
    if (activeTab === 'all') {
      setFiltered(laporan)
    } else {
      setFiltered(laporan.filter((d) => d.status === activeTab))
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
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
        {/* Header */}
        <div data-aos="fade-down">
          <h1 className="text-3xl font-bold text-[#3E1C96] mb-2">📊 Manajemen Laporan</h1>
          <p className="text-gray-700 mb-8 text-lg">
            Kelola laporan masyarakat secara cepat, transparan, dan terorganisir.
          </p>
        </div>


        {/* Tab navigasi */}
        <div className="flex gap-3 mb-6" data-aos="fade-up" data-aos-delay="100">
          {['all', 'menunggu', 'diproses', 'selesai'].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 rounded-lg font-medium capitalize ${
                activeTab === tab ? 'bg-[#3E1C96] text-white' : 'bg-white shadow text-black'
              }`}
              onClick={() => setActiveTab(tab as any)}
            >
              {tab === 'all' ? 'Semua' : tab}
            </button>
          ))}
        </div>

        {/* Daftar laporan */}
        <div
          className="bg-white p-6 rounded-2xl shadow-lg overflow-x-auto"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          <h2 className="text-2xl font-bold text-[#3E1C96] mb-4">📂 Daftar Laporan</h2>

          {filtered.length > 0 ? (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left text-sm text-black">
                  <th className="p-3">Judul</th>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Petugas</th>
                  <th className="p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 text-sm">
                    <td className="p-3 text-black">{item.judul}</td>
                    <td className="p-3 text-black">
                      {new Date(item.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className={`p-3 font-semibold ${statusColor(item.status)}`}>{item.status}</td>
                    <td className="p-3 text-black">{item.users?.nama || '-'}</td>
                    <td className="p-3">
                      <button
                        onClick={() => (window.location.href = `/admin/laporan/${item.id}`)}
                        className="px-3 py-1 rounded-lg bg-[#3E1C96] text-white text-xs hover:bg-[#2d1470] transition"
                      >
                        Kelola
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">Belum ada laporan untuk tab ini.</p>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
