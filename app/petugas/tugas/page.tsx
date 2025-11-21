'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { supabase } from '@/lib/supabase'
import { Clock, CheckCircle, FileText, Send, AlertCircle, ArrowLeft, Loader2, Edit2, Eye, Image, Upload } from 'lucide-react'

type Laporan = {
  id: string
  judul: string
  deskripsi?: string
  status: 'menunggu' | 'diproses' | 'selesai'
  created_at: string
  petugas_id?: string
  catatan_petugas?: string
  laporan_bukti?: string
  laporan_foto?: string
}

export default function HalamanTugas() {
  const [laporan, setLaporan] = useState<Laporan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLaporan, setSelectedLaporan] = useState<Laporan | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form states
  const [statusForm, setStatusForm] = useState<'menunggu' | 'diproses'>('diproses')
  const [hasilPekerjaan, setHasilPekerjaan] = useState('')
  const [buktiFile, setBuktiFile] = useState<File | null>(null)
  const [buktiPreview, setBuktiPreview] = useState<string | null>(null)

  useEffect(() => {
    AOS.init({ duration: 800, once: true })
    fetchTugasPetugas()
  }, [])

  const fetchTugasPetugas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Gagal mengambil data user')
        setLoading(false)
        return
      }

      const { data, error: err } = await supabase
        .from('laporan')
        .select('*')
        .eq('petugas_id', user.id)
        .neq('status', 'selesai')
        .order('created_at', { ascending: false })

      if (err) {
        setError('Gagal memuat tugas')
        return
      }

      setLaporan(data || [])
    } catch (err) {
      console.error(err)
      setError('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setBuktiFile(file)

    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setBuktiPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setBuktiPreview(null)
    }
  }

  const handleUpdateStatus = async (laporanId: string, newStatus: 'menunggu' | 'diproses') => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error: err } = await supabase
        .from('laporan')
        .update({ status: newStatus })
        .eq('id', laporanId)
        .eq('petugas_id', user.id)

      if (err) {
        setError('Gagal update status')
        return
      }

      setSuccess('Status berhasil diubah!')
      fetchTugasPetugas()
    } catch (err) {
      setError('Terjadi kesalahan')
    }
  }

  const handleSubmitTugas = async () => {
    if (!hasilPekerjaan.trim()) {
      setError('Hasil pekerjaan tidak boleh kosong')
      return
    }

    if (!selectedLaporan) return

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      let buktiUrl = null

      // Upload bukti jika ada
      if (buktiFile) {
        const fileName = `${Date.now()}-${buktiFile.name.replace(/\s+/g, '-')}`
        const { data, error: uploadErr } = await supabase.storage
          .from('laporan-bukti')
          .upload(fileName, buktiFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadErr) throw new Error(`Gagal upload bukti: ${uploadErr.message}`)

        const { data: publicUrl } = supabase.storage
          .from('laporan-bukti')
          .getPublicUrl(fileName)

        buktiUrl = publicUrl.publicUrl
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User tidak ditemukan')

      // Update laporan dengan feedback
      const { error: updateErr } = await supabase
        .from('laporan')
        .update({
          status: 'selesai',
          catatan_petugas: hasilPekerjaan,
          laporan_bukti: buktiUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedLaporan.id)
        .eq('petugas_id', user.id)

      if (updateErr) throw updateErr

      setSuccess('✓ Laporan berhasil disubmit untuk verifikasi admin!')
      setShowModal(false)
      setHasilPekerjaan('')
      setBuktiFile(null)
      setBuktiPreview(null)
      setSelectedLaporan(null)

      setTimeout(() => {
        fetchTugasPetugas()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Gagal submit laporan')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'menunggu':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Menunggu' }
      case 'diproses':
        return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Diproses' }
      case 'selesai':
        return { bg: 'bg-green-100', text: 'text-green-700', label: 'Selesai' }
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Unknown' }
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-[#FDF7EE] via-[#f8f4ff] to-[#FDF7EE] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-10" data-aos="fade-down">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#3E1C96] to-[#F04438] mb-3">
              🛠️ Tugas Saya
            </h1>
            <p className="text-gray-600 text-lg">
              Kelola tugas yang telah di-assign kepada Anda
            </p>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3" data-aos="fade-down">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3" data-aos="fade-down">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-green-700">{success}</p>
            </div>
          )}

          {/* Table */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-100" data-aos="fade-up">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8]">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                📂 Daftar Tugas
              </h2>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-[#3E1C96]" />
              </div>
            ) : laporan.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-800 uppercase">Judul</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-800 uppercase">Deskripsi</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-800 uppercase">Tanggal</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-800 uppercase">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-800 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {laporan.map((item, index) => {
                      const badge = getStatusBadge(item.status)
                      return (
                        <tr key={item.id} className={`hover:bg-purple-50/50 transition ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <td className="px-6 py-4 font-semibold text-[#3E1C96] max-w-xs truncate">{item.judul}</td>
                          <td className="px-6 py-4 text-gray-700 text-sm max-w-md line-clamp-2">{item.deskripsi || '-'}</td>
                          <td className="px-6 py-4 text-gray-600 text-sm whitespace-nowrap">{formatDate(item.created_at)}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center flex justify-center gap-2">
                            {item.status === 'menunggu' && (
                              <button
                                onClick={() => handleUpdateStatus(item.id, 'diproses')}
                                className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 text-xs font-semibold transition"
                              >
                                Mulai
                              </button>
                            )}
                            {item.status === 'diproses' && (
                              <button
                                onClick={() => {
                                  setSelectedLaporan(item)
                                  setHasilPekerjaan('')
                                  setBuktiFile(null)
                                  setBuktiPreview(null)
                                  setShowModal(true)
                                  setError('')
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg text-xs font-semibold transition animate-pulse"
                              >
                                ✓ Selesaikan
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedLaporan(item)
                                setHasilPekerjaan('')
                                setBuktiFile(null)
                                setBuktiPreview(null)
                                setShowModal(true)
                                setError('')
                              }}
                              className="px-3 py-1 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 text-xs font-semibold transition"
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-20">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Tidak ada tugas yang perlu dikerjakan</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Detail & Submit */}
      {showModal && selectedLaporan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto" data-aos="zoom-in">
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>

            <h2 className="text-3xl font-bold text-gray-800 mb-2">{selectedLaporan.judul}</h2>
            <p className="text-gray-600 text-sm mb-6">Berikan feedback dan bukti pekerjaan Anda</p>

            {/* Foto Laporan */}
            {selectedLaporan.laporan_foto && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-2">📷 Foto Laporan Awal</p>
                <img
                  src={selectedLaporan.laporan_foto}
                  alt="Foto laporan"
                  className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                />
              </div>
            )}

            {/* Deskripsi */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-2">📝 Deskripsi Masalah</p>
              <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                <p className="text-gray-800 whitespace-pre-wrap text-sm">{selectedLaporan.deskripsi || '-'}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t-2 border-gray-200 my-6"></div>

            {/* Form Submit - Feedback */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                ✅ Kirim Feedback Penyelesaian
              </h3>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hasil Pekerjaan / Feedback *
                </label>
                <textarea
                  value={hasilPekerjaan}
                  onChange={(e) => setHasilPekerjaan(e.target.value)}
                  placeholder="Contoh: Jalan sudah diperbaiki dan bebas dari lubang. Pekerjaan selesai dengan baik dan sesuai standar."
                  className="text-black w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#3E1C96] focus:ring-2 focus:ring-[#3E1C96]/20 outline-none transition-all resize-none"
                  rows={5}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📸 Upload Foto Bukti (Opsional)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="bukti-upload"
                  />
                  <label
                    htmlFor="bukti-upload"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#3E1C96] hover:bg-purple-50/50 transition-all group"
                  >
                    <Upload className="w-5 h-5 text-gray-400 group-hover:text-[#3E1C96]" />
                    <span className="text-sm text-gray-600 group-hover:text-[#3E1C96]">
                      {buktiFile ? buktiFile.name : 'Klik untuk upload bukti foto hasil pekerjaan'}
                    </span>
                  </label>
                </div>

                {buktiPreview && (
                  <div className="relative mt-3 group">
                    <img
                      src={buktiPreview}
                      alt="Preview bukti"
                      className="w-full h-48 object-cover rounded-lg border-2 border-green-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setBuktiFile(null)
                        setBuktiPreview(null)
                        const fileInput = document.getElementById('bukti-upload') as HTMLInputElement
                        if (fileInput) fileInput.value = ''
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitTugas}
                disabled={submitting || !hasilPekerjaan.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Kirim Feedback ke Admin
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              Setelah dikirim, status tugas akan berubah menjadi SELESAI dan menunggu verifikasi admin
            </p>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}