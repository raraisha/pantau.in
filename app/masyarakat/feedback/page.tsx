'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { MessageSquare, Send, Star, Loader2, AlertCircle, FileText, Tag } from 'lucide-react'

export default function FeedbackMasyarakatPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Form State
  const [kategori, setKategori] = useState('Saran Fitur')
  const [pesan, setPesan] = useState('')
  const [rating, setRating] = useState<number>(0)
  
  // State ID Masyarakat
  const [masyarakatId, setMasyarakatId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const addDebugLog = (message: string) => {
    console.log('🔍 DEBUG:', message)
  }

  // --- 1. Load User Data ---
  useEffect(() => {
    const checkAuthAndProfile = async () => {
      addDebugLog('Memulai pengecekan auth...')
      
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !authUser) {
          addDebugLog('❌ User belum login')
          setError('Anda harus login terlebih dahulu.')
          setTimeout(() => router.push('/login'), 2000)
          return
        }

        addDebugLog(`✅ User Auth Email: ${authUser.email}`)

        const { data: masyarakatData, error: dbError } = await supabase
          .from('masyarakat')
          .select('id_masyarakat')
          .eq('email', authUser.email)
          .single()

        if (dbError || !masyarakatData) {
           addDebugLog(`❌ Gagal ambil profil: ${dbError?.message}`)
           setError('Profil masyarakat tidak ditemukan. Silakan login ulang.')
           return
        }

        setMasyarakatId(masyarakatData.id_masyarakat)
        addDebugLog(`✅ User ID set: ${masyarakatData.id_masyarakat}`)

      } catch (error: any) {
        addDebugLog(`❌ System Error: ${error.message}`)
        setError('Terjadi kesalahan sistem.')
      }
    }

    checkAuthAndProfile()
  }, [router])

  // --- 2. Handle Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!pesan.trim()) {
      setError('Mohon isi pesan Anda.')
      return
    }
    
    if (!masyarakatId) {
      setError('Sesi tidak valid atau profil tidak ditemukan. Coba refresh halaman.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      addDebugLog('Mengirim feedback...')

      const { error: submitError } = await supabase
        .from('feedback_masyarakat')
        .insert({
          id_masyarakat: masyarakatId,
          kategori: kategori,
          isi_pesan: pesan,
          rating: rating > 0 ? rating : null 
        })

      if (submitError) throw submitError

      setSuccess('✅ Terima kasih! Masukan Anda sangat berarti bagi kami.')
      
      // Reset Form
      setTimeout(() => {
        setPesan('')
        setRating(0)
        router.push('/masyarakat/dashboard')
      }, 3000)

    } catch (error: any) {
      console.error("Error submitting feedback:", error)
      setError('Gagal mengirim: ' + error.message)
      addDebugLog(`❌ Gagal Kirim: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getRatingLabel = (r: number) => {
    if (r === 0) return "Berikan penilaian (opsional)"
    if (r <= 2) return "Kurang Puas"
    if (r === 3) return "Cukup"
    return "Sangat Puas!"
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-[#FDF7EE] via-[#f8f4ff] to-[#FDF7EE] pt-20">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-[#3E1C96] via-[#5429CC] to-[#6B35E8] text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl backdrop-blur-sm mb-4">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Feedback & Masukan</h1>
            <p className="text-purple-100 text-base max-w-2xl mx-auto">Punya saran fitur, keluhan, atau apresiasi untuk petugas? Sampaikan di sini untuk Pantau.in yang lebih baik.</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Success Message */}
          {success && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-green-50 border-2 border-green-200 shadow-sm animate-pulse">
              <Star className="w-5 h-5 text-green-600 mt-0.5 fill-green-600" />
              <p className="text-sm text-green-800 font-semibold">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border-2 border-red-200 shadow-sm">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-800 font-semibold">{error}</p>
            </div>
          )}

          {/* Form */}
          <div onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100">
              
              {/* Kategori */}
              <div className="p-6">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
                  <Tag className="w-4 h-4 text-[#3E1C96]" /> Topik Masukan
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Saran Fitur', 'Laporan Bug / Error', 'Kinerja Petugas', 'Lainnya'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setKategori(item)}
                      className={`py-3 px-3 rounded-xl text-xs font-bold border-2 transition-all ${
                        kategori === item 
                          ? 'bg-[#3E1C96] text-white border-[#3E1C96] shadow-lg transform scale-105' 
                          : 'bg-white text-gray-600 border-gray-200 hover:border-[#3E1C96] hover:bg-purple-50'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div className="p-6">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
                  <Star className="w-4 h-4 text-[#3E1C96]" /> {getRatingLabel(rating)}
                </label>
                <div className="flex justify-center gap-3 p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-100">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none transform transition-all duration-200 hover:scale-125 active:scale-95"
                    >
                      <Star 
                        className={`w-9 h-9 transition-all ${
                          star <= rating 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-gray-300'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Pesan */}
              <div className="p-6">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
                  <FileText className="w-4 h-4 text-[#3E1C96]" /> Detail Pesan <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={pesan}
                  onChange={(e) => setPesan(e.target.value)}
                  rows={6}
                  placeholder="Ceritakan pengalaman atau masukan Anda secara detail..."
                  className="w-full px-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-[#3E1C96] focus:border-[#3E1C96] text-black text-sm resize-none"
                  minLength={10}
                ></textarea>
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-gray-500">Min 10 karakter.</p>
                  <p className={`text-xs font-semibold ${pesan.length >= 10 ? 'text-green-600' : 'text-gray-400'}`}>
                    {pesan.length}/10
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="p-6 bg-gray-50">
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading || !masyarakatId}
                  className="w-full py-4 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-[#3E1C96] to-[#5429CC] hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5" /> 
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" /> 
                      Kirim Masukan
                    </>
                  )}
                </button>
                <p className="text-xs text-center text-gray-500 mt-4">
                  🔒 Privasi Anda terjaga. Masukan ini akan ditinjau langsung oleh tim Admin Pusat.
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
      <Footer />
    </>
  )
}