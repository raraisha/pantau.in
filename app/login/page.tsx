'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { Eye, EyeOff, Loader2, AlertCircle, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.email || !form.password) {
      setError('Email dan password wajib diisi.')
      return
    }
    if (!captchaToken) {
      setError('Silakan selesaikan captcha terlebih dahulu.')
      return
    }

    setLoading(true)

    try {
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

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

      if (authError) {
        setError('Email atau password salah.')
        setLoading(false)
        return
      }

      const { data: adminData } = await supabase
        .from('admins')
        .select('*')
        .eq('email', form.email)
        .maybeSingle()

      if (adminData) {
        localStorage.setItem('user', JSON.stringify({ name: adminData.nama, role: 'admin' }))
        router.push('/admin/dashboard')
        return
      }

      const { data: petugasData } = await supabase
        .from('petugas')
        .select('*')
        .eq('email', form.email)
        .maybeSingle()

      if (petugasData) {
        localStorage.setItem('user', JSON.stringify({ name: petugasData.nama, role: 'petugas' }))
        router.push('/petugas/dashboard-petugas')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('email', form.email)
        .maybeSingle()

      if (userData) {
        localStorage.setItem('user', JSON.stringify({ name: userData.nama, role: 'masyarakat' }))
        router.push('/masyarakat/dashboard')
        return
      }

      setError('Akun tidak ditemukan.')
    } catch (err) {
      console.error('LOGIN ERROR:', err)
      setError('Terjadi kesalahan. Silakan coba lagi.')
    }

    setLoading(false)
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
                Selamat Datang Kembali
              </h1>
              <p className="text-gray-600 text-lg md:text-xl mb-8 leading-relaxed">
                Masuk ke akun Anda untuk melanjutkan pelaporan dan memantau progres laporan Anda secara real-time.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#3E1C96] flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <p className="text-gray-700">Laporan yang transparan dan terverifikasi</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#3E1C96] flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <p className="text-gray-700">Tracking status laporan secara langsung</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#3E1C96] flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <p className="text-gray-700">Kontribusi untuk lingkungan yang lebih baik</p>
                </div>
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-2xl border border-gray-100">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Login</h2>
                <p className="text-gray-600">
                  Belum punya akun?{' '}
                  <a href="/register" className="text-[#3E1C96] font-semibold hover:underline inline-flex items-center gap-1">
                    Daftar sekarang <ArrowRight className="w-4 h-4" />
                  </a>
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-start gap-3 rounded-r-lg">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="space-y-5">
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
                    className="text-black w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E1C96] focus:border-transparent transition bg-white"
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
                      className="text-black w-full px-4 py-3.5 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E1C96] focus:border-transparent transition bg-white"
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
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8] hover:from-[#5B2CB8] hover:to-[#3E1C96] text-white font-semibold py-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <a href="/forgot-password" className="text-sm text-gray-600 hover:text-[#3E1C96] transition-colors">
                    Lupa password?
                  </a>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-center text-gray-500">
                  🔒 Dilindungi dengan enkripsi end-to-end
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}