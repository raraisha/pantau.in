'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { Loader2, MapPin, Calendar, Eye } from 'lucide-react'
import Footer from '@/components/Footer'

export default function HistoryLaporanPage() {
  const [laporan, setLaporan] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    const fetchLaporan = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setLaporan([])
          return
        }

        const { data, error } = await supabase
          .from('laporan')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setLaporan(data || [])
      } catch (err: any) {
        console.error(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchLaporan()
  }, [])

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-[#FDF7EE] via-[#f8f4ff] to-[#FDF7EE] pt-24 px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#3E1C96] to-[#F04438] mb-3">
              📜 History Pelaporan
            </h1>
            <p className="text-gray-600 text-lg">Riwayat semua laporan yang pernah kamu buat</p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader2 className="w-12 h-12 animate-spin text-[#3E1C96] mb-4" />
              <p className="text-gray-500 text-sm">Memuat data...</p>
            </div>
          ) : laporan.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm p-12 rounded-2xl shadow-xl text-center border border-gray-100">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-5xl">📋</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Belum Ada Laporan</h3>
              <p className="text-gray-600">Kamu belum pernah membuat laporan. Yuk mulai buat laporan pertamamu!</p>
            </div>
          ) : (
            <>
              {/* Stats Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-100 shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Total Laporan</p>
                  <p className="text-2xl font-bold text-[#3E1C96]">{laporan.length}</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-green-100 shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Selesai</p>
                  <p className="text-2xl font-bold text-green-600">
                    {laporan.filter(l => l.status === 'selesai').length}
                  </p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-yellow-100 shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {laporan.filter(l => l.status !== 'selesai').length}
                  </p>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-[#3E1C96] via-[#5B2CB8] to-[#3E1C96] text-white">
                        <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide">Foto</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide">Judul Laporan</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide">Deskripsi</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide">Lokasi</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide">Tanggal</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold tracking-wide">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {laporan.map((item, index) => (
                        <tr 
                          key={item.id}
                          className={`hover:bg-purple-50/50 transition-all duration-200 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          }`}
                        >
                          {/* Foto */}
                          <td className="px-6 py-5">
                            {item.laporan_foto ? (
                              <div className="relative group">
                                <img
                                  src={item.laporan_foto}
                                  alt={item.judul}
                                  className="w-24 h-24 object-cover rounded-xl border-2 border-purple-200 shadow-md cursor-pointer transform group-hover:scale-105 transition-transform duration-200"
                                  onClick={() => setSelectedImage(item.laporan_foto)}
                                />
                                <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Eye className="w-6 h-6 text-white" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-xs font-medium border-2 border-dashed border-gray-300">
                                No Photo
                              </div>
                            )}
                          </td>

                          {/* Judul */}
                          <td className="px-6 py-5">
                            <p className="font-bold text-[#3E1C96] max-w-xs leading-tight">
                              {item.judul}
                            </p>
                          </td>

                          {/* Deskripsi */}
                          <td className="px-6 py-5">
                            <p className="text-gray-700 text-sm max-w-md line-clamp-2 leading-relaxed">
                              {item.deskripsi}
                            </p>
                          </td>

                          {/* Lokasi */}
                          <td className="px-6 py-5">
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-gray-600 leading-tight">
                                {item.latitude?.toFixed(5)},<br/>{item.longitude?.toFixed(5)}
                              </p>
                            </div>
                          </td>

                          {/* Tanggal */}
                          <td className="px-6 py-5">
                            <div className="flex items-start gap-2">
                              <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-gray-600 whitespace-nowrap leading-tight">
                                {new Date(item.created_at).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                                <br/>
                                <span className="text-xs text-gray-500">
                                  {new Date(item.created_at).toLocaleTimeString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </p>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-5">
                            <div className="flex justify-center">
                              <span
                                className={`inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-full font-semibold shadow-sm ${
                                  item.status === 'selesai'
                                    ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border border-green-200'
                                    : item.status === 'diproses'
                                    ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-700 border border-yellow-200'
                                }`}
                              >
                                <span className={`w-2 h-2 rounded-full ${
                                  item.status === 'selesai' ? 'bg-green-500' :
                                  item.status === 'diproses' ? 'bg-blue-500' : 'bg-yellow-500'
                                }`}></span>
                                {item.status === 'selesai' ? '✓ Selesai' : 
                                 item.status === 'diproses' ? '⟳ Diproses' : '⏱ Pending'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img 
              src={selectedImage} 
              alt="Preview" 
              className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl"
            />
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-4 -right-4 bg-white text-gray-800 rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-gray-100 transition font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}