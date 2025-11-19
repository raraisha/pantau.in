'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { supabase } from '@/lib/supabase'
import { Clock, CheckCircle, FileText, Send, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'

type Laporan = {
  id: string
  judul: string
  status: 'menunggu' | 'diproses'
  created_at: string
  deskripsi?: string
  petugas_id?: string
}

export default function HalamanTugas() {
  const params = useParams()
  const laporan_id = params.id as string
  
  const [laporan, setLaporan] = useState<Laporan | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [catatan, setCatatan] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    AOS.init({ duration: 800, once: true })
    fetchLaporanDetail()
  }, [laporan_id])

  const fetchLaporanDetail = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        setError('Gagal mengambil data user')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('laporan')
        .select('id, judul, status, created_at, deskripsi, petugas_id')
        .eq('id', laporan_id)
        .eq('petugas_id', user.id)
        .neq('status', 'selesai')
        .single()

      if (error) {
        setError('Laporan tidak ditemukan atau sudah selesai')
        setLoading(false)
        return
      }

      if (!data) {
        setError('Laporan tidak tersedia')
        setLoading(false)
        return
      }

      setLaporan(data)
    } catch (err) {
      console.error(err)
      setError('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitTugas = async () => {
    if (!catatan.trim()) {
      setError('Catatan tidak boleh kosong')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Gagal mengambil data user')
        return
      }

      // Update status laporan menjadi 'selesai'
      const { error: updateError } = await supabase
        .from('laporan')
        .update({ 
          status: 'selesai',
          catatan_petugas: catatan,
          updated_at: new Date().toISOString()
        })
        .eq('id', laporan_id)
        .eq('petugas_id', user.id)

      if (updateError) {
        setError('Gagal submit laporan: ' + updateError.message)
        return
      }

      setSuccess('Laporan berhasil disubmit!')
      setCatatan('')
      
      // Redirect setelah 2 detik
      setTimeout(() => {
        window.location.href = '/petugas'
      }, 2000)
    } catch (err) {
      console.error(err)
      setError('Terjadi kesalahan saat submit')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUbahStatus = async (newStatus: 'menunggu' | 'diproses') => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Gagal mengambil data user')
        return
      }

      const { error } = await supabase
        .from('laporan')
        .update({ status: newStatus })
        .eq('id', laporan_id)
        .eq('petugas_id', user.id)

      if (error) {
        setError('Gagal update status: ' + error.message)
        return
      }

      setLaporan(prev => prev ? { ...prev, status: newStatus } : null)
      setSuccess(`Status berhasil diubah menjadi ${newStatus}`)
    } catch (err) {
      console.error(err)
      setError('Terjadi kesalahan')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'menunggu':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' }
      case 'diproses':
        return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' }
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' }
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-[#FDF7EE] via-[#f8f4ff] to-[#FDF7EE] pt-24 pb-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-12 h-12 animate-spin text-[#3E1C96]" />
            <p className="text-gray-600">Memuat tugas...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (!laporan) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-[#FDF7EE] via-[#f8f4ff] to-[#FDF7EE] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => window.location.href = '/petugas'}
              className="inline-flex items-center gap-2 text-[#3E1C96] hover:text-[#5B2CB8] font-semibold mb-6 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Kembali ke Dashboard
            </button>
            
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Tugas Tidak Ditemukan</h2>
              <p className="text-gray-600">Tugas ini mungkin sudah selesai atau tidak tersedia untuk Anda.</p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const statusColor = getStatusColor(laporan.status)

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-[#FDF7EE] via-[#f8f4ff] to-[#FDF7EE] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => window.location.href = '/petugas'}
            className="inline-flex items-center gap-2 text-[#3E1C96] hover:text-[#5B2CB8] font-semibold mb-6 transition-colors"
            data-aos="fade-right"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali ke Dashboard
          </button>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3" data-aos="fade-down">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3" data-aos="fade-down">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-green-700">{success}</p>
            </div>
          )}

          {/* Header Card */}
          <div 
            className="bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8] text-white rounded-2xl shadow-lg p-8 mb-6"
            data-aos="fade-up"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{laporan.judul}</h1>
                <p className="text-purple-100">Tugas yang ditugaskan kepada Anda</p>
              </div>
              <div className={`px-4 py-2 rounded-full font-semibold text-sm border-2 ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}>
                {laporan.status === 'menunggu' ? (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Menunggu
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Diproses
                  </div>
                )}
              </div>
            </div>
            <p className="text-purple-100 text-sm">
              Dibuat: {formatDate(laporan.created_at)}
            </p>
          </div>

          {/* Deskripsi Card */}
          <div 
            className="bg-white rounded-2xl shadow-lg p-8 mb-6"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#3E1C96]" />
              Deskripsi Tugas
            </h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {laporan.deskripsi || 'Tidak ada deskripsi'}
            </p>
          </div>

          {/* Status Management */}
          <div 
            className="bg-white rounded-2xl shadow-lg p-8 mb-6"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">Ubah Status</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleUbahStatus('menunggu')}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  laporan.status === 'menunggu'
                    ? 'bg-yellow-500 text-white shadow-lg'
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Menunggu
                </div>
              </button>
              <button
                onClick={() => handleUbahStatus('diproses')}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  laporan.status === 'diproses'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Diproses
                </div>
              </button>
            </div>
          </div>

          {/* Submit Form */}
          <div 
            className="bg-white rounded-2xl shadow-lg p-8"
            data-aos="fade-up"
            data-aos-delay="300"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Send className="w-6 h-6 text-[#3E1C96]" />
              Submit Laporan
            </h2>
            <p className="text-gray-600 mb-4">
              Isi catatan atau hasil pekerjaan Anda, kemudian submit untuk menyelesaikan tugas ini.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Catatan / Hasil Pekerjaan *
              </label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Tuliskan catatan, hasil pekerjaan, atau keterangan lainnya..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#3E1C96] focus:ring-2 focus:ring-[#3E1C96]/20 outline-none transition-all resize-none"
                rows={6}
              />
            </div>

            <button
              onClick={handleSubmitTugas}
              disabled={submitting || !catatan.trim()}
              className="w-full bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8] text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sedang Submit...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Laporan
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
