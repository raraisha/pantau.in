'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { supabase } from '@/lib/supabase'
import { Search } from 'lucide-react'

type Petugas = {
  id: string
  nama: string
  email: string
  lokasi: string
}

const lokasiOptions = [
  'Semua',
  'Bandung Utara',
  'Bandung Selatan',
  'Bandung Timur',
  'Bandung Barat',
  'Pusat Kota Bandung',
]

export default function ManajemenPetugas() {
  const [petugas, setPetugas] = useState<Petugas[]>([])
  const [filtered, setFiltered] = useState<Petugas[]>([])
  const [search, setSearch] = useState('')
  const [lokasiFilter, setLokasiFilter] = useState('Semua')

  useEffect(() => {
    AOS.init({ duration: 800, once: true })
    fetchPetugas()
  }, [])

  useEffect(() => {
    filterPetugas()
  }, [search, lokasiFilter, petugas])

  const fetchPetugas = async () => {
    const { data, error } = await supabase.from('petugas').select('*')
    if (error) {
      console.error('Error fetching petugas:', error.message)
      return
    }
    setPetugas(data || [])
  }

  const filterPetugas = () => {
    let result = petugas

    if (search.trim() !== '') {
      result = result.filter(
        (p) =>
          p.nama.toLowerCase().includes(search.toLowerCase()) ||
          p.email.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (lokasiFilter !== 'Semua') {
      result = result.filter((p) => p.lokasi === lokasiFilter)
    }

    setFiltered(result)
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#FDF7EE] pt-24 px-6">
        {/* Header */}
        <div data-aos="fade-down">
          <h1 className="text-3xl font-bold text-[#3E1C96] mb-2">👥 Manajemen Petugas</h1>
          <p className="text-gray-700 mb-8 text-lg">
            Kelola data petugas berdasarkan nama, email, dan lokasi penempatan.
          </p>
        </div>

        {/* Search & Filter */}
        <div
          className="flex flex-col md:flex-row gap-3 mb-6"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari nama atau email petugas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring focus:ring-indigo-200 text-black"
            />
          </div>

          <select
            value={lokasiFilter}
            onChange={(e) => setLokasiFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring focus:ring-indigo-200 text-black"
          >
            {lokasiOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Daftar Petugas */}
        <div
          className="bg-white p-6 rounded-2xl shadow-lg overflow-x-auto"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          <h2 className="text-2xl font-bold text-[#3E1C96] mb-4">📂 Daftar Petugas</h2>

          {filtered.length > 0 ? (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left text-sm text-black">
                  <th className="p-3">Nama</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Lokasi</th>
                  <th className="p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 text-sm">
                    <td className="p-3 text-black">{item.nama}</td>
                    <td className="p-3 text-black">{item.email}</td>
                    <td className="p-3 text-black">{item.lokasi}</td>
                    <td className="p-3">
                      <button
                        onClick={() => (window.location.href = `/admin/petugas/${item.id}`)}
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
            <p className="text-gray-500">Tidak ada petugas yang sesuai filter.</p>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
