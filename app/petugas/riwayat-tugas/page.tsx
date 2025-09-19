'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'

export default function HistoryLaporanPetugasPage() {
  const [laporan, setLaporan] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLaporan = async () => {
      try {
        // ambil user login (petugas)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLaporan([])
          return
        }

        // ambil laporan yg ditugaskan atau dikerjakan sama petugas ini
        const { data, error } = await supabase
          .from('laporan')
          .select('*')
          .eq('petugas_id', user.id)
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
      <div className="min-h-screen bg-[#FDF7EE] pt-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-[#3E1C96] mb-6">
            📜 Histori Laporan
          </h1>

          {loading ? (
            <p className="text-gray-600">Loading...</p>
          ) : laporan.length === 0 ? (
            <p className="text-gray-600 bg-white p-6 rounded-xl shadow text-center">
              Belum ada laporan untuk kamu 😢
            </p>
          ) : (
            <div className="space-y-4">
              {laporan.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition flex gap-4"
                >
                  {/* Foto */}
                  {item.foto_url && (
                    <img
                      src={item.foto_url}
                      alt={item.judul}
                      className="w-28 h-28 object-cover rounded-lg border"
                    />
                  )}

                  {/* Detail */}
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-[#3E1C96]">
                      {item.judul}
                    </h2>
                    <p className="text-gray-700 mt-1">{item.deskripsi}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      📍 {item.latitude}, {item.longitude}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      ⏰ {new Date(item.created_at).toLocaleString('id-ID')}
                    </p>
                  </div>

                  {/* Status */}
                  <span
                    className={`self-start text-sm px-3 py-1 rounded-full font-medium ${
                      item.status === 'selesai'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {item.status || 'Diproses'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
