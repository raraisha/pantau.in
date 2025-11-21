'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { Eye, EyeOff, Loader2, AlertCircle, ArrowRight, UserPlus } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    nik: '',
    nama: '',
    email: '',
    telp: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!captchaToken) {
      setError('Silakan selesaikan captcha terlebih dahulu.')
      setLoading(false)
      return
    }

    try {
      // 1. Verifikasi captcha
      const captchaRes = await fetch('/api/verify-captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: captchaToken }),
      })

      const captchaResult = await captchaRes.json()

      if (!captchaResult.success) {
        setError('Captcha gagal diverifikasi. Silakan coba lagi.')
        setLoading(false)
        return
      }

      // 2. Daftar akun di Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      // 3. Simpan data user ke tabel `users`
      const { error: insertError } = await supabase.from('users').insert([
        {
          id: signUpData.user?.id,
          nik: form.nik,
          nama: form.nama,
          telp: form.telp,
          email: form.email,
        },
      ])

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }

      // Redirect ke login
      router.push('/login')
    } catch (err) {
      console.error('REGISTER ERROR:', err)
      setError('Terjadi kesalahan. Silakan coba lagi.')
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FDF7EE] via-[#f8f4ff] to-[#FDF7EE] px-4 py-12 pt-32">
        <div className="w-full max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            
            {/* Left Side - Text Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#3E1C96] to-[#F04438] mb-6 leading-tight">
                Bergabunglah Bersama Kami
              </h1>
              <p className="text-gray-600 text-lg md:text-xl mb-8 leading-relaxed">
                Daftarkan diri Anda sekarang dan mulai berkontribusi untuk lingkungan yang lebih baik dengan sistem pelaporan yang transparan.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#F04438] flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <p className="text-gray-700">Proses registrasi yang mudah dan cepat</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#F04438] flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <p className="text-gray-700">Buat laporan kapan saja, dimana saja</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#F04438] flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <p className="text-gray-700">Pantau status laporan Anda secara real-time</p>
                </div>
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-2xl border border-gray-100">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Daftar Akun Baru</h2>
                <p className="text-gray-600">
                  Sudah punya akun?{' '}
                  <a href="/login" className="text-[#F04438] font-semibold hover:underline inline-flex items-center gap-1">
                    Login disini <ArrowRight className="w-4 h-4" />
                  </a>
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-start gap-3 rounded-r-lg">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      NIK
                    </label>
                    <input
                      type="text"
                      name="nik"
                      value={form.nik}
                      onChange={handleChange}
                      placeholder="3201234567890123"
                      className="text-black w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F04438] focus:border-transparent transition bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      No. Telp
                    </label>
                    <input
                      type="text"
                      name="telp"
                      value={form.telp}
                      onChange={handleChange}
                      placeholder="08123456789"
                      className="text-black w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F04438] focus:border-transparent transition bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    name="nama"
                    value={form.nama}
                    onChange={handleChange}
                    placeholder="Nama lengkap Anda"
                    className="text-black w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F04438] focus:border-transparent transition bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="nama@email.com"
                    className="text-black w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F04438] focus:border-transparent transition bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="text-black w-full px-4 py-3.5 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F04438] focus:border-transparent transition bg-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-center pt-2">
                  <HCaptcha
                    sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || ''}
                    onVerify={(token) => setCaptchaToken(token)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#F04438] to-[#d43a2e] hover:from-[#d43a2e] hover:to-[#F04438] text-white font-semibold py-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Mendaftar...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      <span>Daftar Sekarang</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-center text-gray-500">
                  🔒 Data Anda aman dan dilindungi dengan enkripsi
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}