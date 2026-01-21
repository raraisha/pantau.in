'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { supabase } from '@/lib/supabase'
import { 
  History, 
  Search, 
  Calendar, 
  CheckCircle2, 
  MapPin, 
  FileText, 
  Loader2,
  Filter
} from 'lucide-react'

export default function RiwayatTugasPetugas() {
  const [riwayat, setRiwayat] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    AOS.init({ duration: 800, once: true })
    fetchRiwayat()
  }, [])

  const fetchRiwayat = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Memperbaiki query: Menghapus foto_url karena menyebabkan error di DB kamu
      const { data, error } = await supabase
        .from('pelaksanaan')
        .select(`
          id_pelaksanaan,
          status_pelaksanaan,
          updated_at,
          deskripsi_tindakan,
          laporan_dinas!inner (
            catatan_dinas,
            laporan!inner (
              judul,
              lokasi
            )
          )
        `)
        .eq('id_petugas', user.id)
        .eq('status_pelaksanaan', 'selesai') 
        .order('updated_at', { ascending: false })

      if (error) throw error
      setRiwayat(data || [])
    } catch (err: any) {
      console.error("Error riwayat:", err.message)
      alert("Terjadi kesalahan saat mengambil data riwayat.")
    } finally {
      setLoading(false)
    }
  }

  const filteredData = riwayat.filter(item => 
    item.laporan_dinas?.laporan?.judul?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#FDF7EE] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10" data-aos="fade-down">
            <div>
              <h1 className="text-4xl font-bold text-[#3E1C96] mb-2 flex items-center gap-3">
                <History className="w-10 h-10" /> Riwayat Pekerjaan
              </h1>
              <p className="text-gray-600 font-medium italic">Daftar seluruh tugas yang telah Anda selesaikan.</p>
            </div>
            
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#3E1C96] transition-colors" />
              <input 
                type="text"
                placeholder="Cari judul laporan..."
                className="pl-12 pr-6 py-3 bg-white border-2 border-gray-100 rounded-2xl w-full md:w-80 shadow-sm focus:border-[#3E1C96] outline-none transition-all text-black"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100" data-aos="fade-up">
            <div className="p-6 bg-gradient-to-r from-[#3E1C96] to-[#5a32c2] text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span className="font-bold text-lg">Arsip Pelaksanaan Selesai</span>
              </div>
            </div>

            {loading ? (
              <div className="p-24 text-center">
                <Loader2 className="w-12 h-12 animate-spin mx-auto text-purple-600 mb-4" />
                <p className="text-gray-500 font-medium">Membuka arsip...</p>
              </div>
            ) : filteredData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-widest font-black">
                    <tr>
                      <th className="px-8 py-5">Laporan</th>
                      <th className="px-8 py-5 text-center">Tgl Selesai</th>
                      <th className="px-8 py-5">Lokasi</th>
                      <th className="px-8 py-5">Hasil Kerja</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredData.map((item) => (
                      <tr key={item.id_pelaksanaan} className="hover:bg-green-50/30 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-[#3E1C96] shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <p className="font-bold text-gray-800">{item.laporan_dinas?.laporan?.judul || 'Tanpa Judul'}</p>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg text-gray-600 text-xs font-bold">
                            <Calendar className="w-3.5 h-3.5" />
                            {item.updated_at ? new Date(item.updated_at).toLocaleDateString('id-ID') : '-'}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#F04438]" />
                            {item.laporan_dinas?.laporan?.lokasi || '-'}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm text-gray-700 italic line-clamp-1">
                            {item.deskripsi_tindakan || 'Tidak ada catatan'}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-24 text-center">
                <Filter className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 font-bold">Belum ada riwayat selesai.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}