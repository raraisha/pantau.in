'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { Eye, EyeOff, Loader2, AlertCircle, Mail, Lock, Shield, CheckCircle2, ArrowRight, Users, TrendingUp, Clock } from 'lucide-react'

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
      // 1. Verifikasi Captcha
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

      // 2. Autentikasi dengan Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

      if (authError) {
        setError('Email atau password salah.')
        setLoading(false)
        return
      }

      // 3. Cek di tabel ADMIN
      const { data: adminData } = await supabase
        .from('admin')
        .select('*')
        .eq('email', form.email)
        .maybeSingle()

      if (adminData) {
        localStorage.setItem('user', JSON.stringify({ 
          nama: adminData.nama,
          role: 'admin',
          id: adminData.id_admin,
          email: adminData.email 
        }))
        router.push('/admin/dashboard')
        return
      }

      // 4. Cek di tabel DINAS
      const { data: dinasData } = await supabase
        .from('dinas')
        .select('*')
        .eq('email', form.email)
        .maybeSingle()

      if (dinasData) {
        localStorage.setItem('user', JSON.stringify({ 
          nama: dinasData.nama_dinas,
          role: 'dinas',
          id: dinasData.id_dinas,
          email: dinasData.email 
        }))
        router.push('/dinas/dashboard')
        return
      }

      // 5. Cek di tabel PETUGAS
      const { data: petugasData } = await supabase
        .from('petugas')
        .select('*')
        .eq('email', form.email)
        .maybeSingle()

      if (petugasData) {
        localStorage.setItem('user', JSON.stringify({ 
          nama: petugasData.nama,
          role: 'petugas',
          id: petugasData.id_petugas,
          email: petugasData.email,
          id_dinas: petugasData.id_dinas 
        }))
        router.push('/petugas/tugas')
        return
      }

      // 6. Cek di tabel MASYARAKAT
      const { data: masyarakatData } = await supabase
        .from('masyarakat')
        .select('*')
        .eq('email', form.email)
        .maybeSingle()

      if (masyarakatData) {
        localStorage.setItem('user', JSON.stringify({ 
          nama: masyarakatData.nama,
          role: 'masyarakat',
          id: masyarakatData.id_masyarakat,
          email: masyarakatData.email 
        }))
        router.push('/masyarakat/dashboard')
        return
      }

      // 7. Jika tidak ditemukan di semua tabel
      setError('Akun tidak ditemukan di sistem.')
      
    } catch (err) {
      console.error('LOGIN ERROR:', err)
      setError('Terjadi kesalahan. Silakan coba lagi.')
    }

    setLoading(false)
  }

  const features = [
    {
      icon: Clock,
      title: 'Lapor 24/7',
      desc: 'Sistem aktif sepanjang waktu'
    },
    {
      icon: TrendingUp,
      title: 'Tracking Real-time',
      desc: 'Pantau status laporan secara langsung'
    },
    {
      icon: Users,
      title: 'Respon Cepat',
      desc: 'Tim siap menindaklanjuti'
    }
  ]

  const stats = [
    { value: '12K+', label: 'Total Laporan', color: 'text-purple-600' },
    { value: '96%', label: 'Tingkat Selesai', color: 'text-green-600' },
    { value: '4.9', label: 'Rating Pengguna', color: 'text-blue-600' }
  ]

  return (
    <>
      <Navbar />
      <br></br>
      <div className="min-h-screen bg-gradient-to-br from-[#FDF7EE] via-[#f8f4ff] to-[#FDF7EE] flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Left Side - Branding & Info */}
          <div className="hidden lg:block space-y-8">
            {/* Badge */}
            
            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-5xl xl:text-6xl font-bold leading-tight">
                <span className="text-gray-900">Selamat Datang di</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B2C93] via-[#5429CC] to-[#F04438]">
                  Pantau.in
                </span>
              </h1>
              
              <p className="text-lg text-gray-600 leading-relaxed max-w-md">
                Platform pelaporan masyarakat untuk Kota Bandung yang lebih responsif, transparan, dan terpercaya.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 gap-4">
              {features.map((feature, i) => {
                const Icon = feature.icon
                return (
                  <div 
                    key={i}
                    className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.desc}</p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                  </div>
                )
              })}
            </div>

            {/* Stats */}

          </div>

          {/* Right Side - Login Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
              
              {/* Gradient Header */}
              <div className="relative px-8 pt-10 pb-8 bg-gradient-to-br from-[#3B2C93] via-[#5429CC] to-[#6B35E8]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                
                <div className="relative">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Masuk
                  </h2>
                  <p className="text-purple-100">
                    Silakan masukkan kredensial Anda untuk melanjutkan
                  </p>
                </div>
              </div>

              {/* Form Container */}
              <div className="px-8 py-8">
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg animate-shake">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-red-800 font-medium">{error}</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Email Input */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Email Address
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="nama@email.com"
                        className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 transition-all bg-gray-50 focus:bg-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Masukkan password Anda"
                        className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 transition-all bg-gray-50 focus:bg-white"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Forgot Password */}
                  <div className="flex justify-end">
                    <a 
                      href="/forgot-password" 
                      className="text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors inline-flex items-center gap-1 group"
                    >
                      Lupa password?
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>

                  {/* Captcha */}
                  <div className="flex justify-center py-2 bg-gray-50 rounded-xl border border-gray-200">
                    <HCaptcha
                      sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || ''}
                      onVerify={(token) => setCaptchaToken(token)}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#3B2C93] via-[#5429CC] to-[#6B35E8] hover:shadow-xl text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <>
                        <span>Masuk Sekarang</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Footer */}
              <div className="px-8 py-6 bg-gradient-to-br from-gray-50 to-purple-50/30 border-t border-gray-200">
                <p className="text-center text-sm text-gray-600">
                  Belum punya akun?{' '}
                  <a 
                    href="/register" 
                    className="font-bold text-purple-600 hover:text-purple-700 transition-colors inline-flex items-center gap-1 group"
                  >
                    Daftar sekarang
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </a>
                </p>
              </div>
            </div>

            {/* Mobile Stats */}
            <div className="lg:hidden mt-8 grid grid-cols-3 gap-4">

            </div>

            {/* Mobile Features */}
            <div className="lg:hidden mt-6 space-y-3">
              
            </div>
          </div>

        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </>
  )
}