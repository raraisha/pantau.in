'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { GitBranch, Eye, EyeOff, Loader2, AlertCircle, Mail, Lock, User, Phone, CreditCard, ArrowRight, UserPlus, CheckCircle2, Clock, TrendingUp, Users } from 'lucide-react'

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

      // 3. Simpan data user ke tabel `masyarakat`
      const { error: insertError } = await supabase.from('masyarakat').insert([
        {
          id_masyarakat: signUpData.user?.id,
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

 const features = [
  {
    icon: Clock,
    title: 'Akses Tanpa Batas',
    desc: 'Layanan dapat digunakan kapan saja'
  },
  {
    icon: Eye,
    title: 'Pemantauan Transparan',
    desc: 'Status laporan terlihat di setiap tahap'
  },
  {
    icon: GitBranch,
    title: 'Alur Terstruktur',
    desc: 'Setiap laporan mengikuti proses yang jelas'
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
            
            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-5xl xl:text-6xl font-bold leading-tight">
                <span className="text-gray-900">Bergabunglah dengan</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B2C93] via-[#5429CC] to-[#F04438]">
                  Pantau.in
                </span>
              </h1>
              
              <p className="text-lg text-gray-600 leading-relaxed max-w-md">
                Daftarkan diri Anda sekarang dan mulai berkontribusi untuk lingkungan yang lebih baik dengan sistem pelaporan yang transparan.
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

          </div>

          {/* Right Side - Register Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
              
              {/* Gradient Header */}
              <div className="relative px-8 pt-10 pb-8 bg-gradient-to-br from-[#3B2C93] via-[#5429CC] to-[#6B35E8]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                
                <div className="relative">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Daftar Akun Baru
                  </h2>
                  <p className="text-purple-100">
                    Bergabunglah untuk mulai melaporkan dan memantau
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

                <form onSubmit={handleSubmit} className="space-y-5">
                  
                  {/* NIK & Telp - Grid 2 Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* NIK Input */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        NIK
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <CreditCard className="h-5 w-5 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
                        </div>
                        <input
                          type="text"
                          name="nik"
                          value={form.nik}
                          onChange={handleChange}
                          placeholder="3201234567890123"
                          className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 transition-all bg-gray-50 focus:bg-white"
                          required
                        />
                      </div>
                    </div>

                    {/* Telp Input */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        No. Telp
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
                        </div>
                        <input
                          type="text"
                          name="telp"
                          value={form.telp}
                          onChange={handleChange}
                          placeholder="08123456789"
                          className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 transition-all bg-gray-50 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Nama Input */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Nama Lengkap
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
                      </div>
                      <input
                        type="text"
                        name="nama"
                        value={form.nama}
                        onChange={handleChange}
                        placeholder="Nama lengkap Anda"
                        className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 transition-all bg-gray-50 focus:bg-white"
                        required
                      />
                    </div>
                  </div>

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
                        placeholder="Buat password yang kuat"
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
              </div>

              {/* Footer */}
              <div className="px-8 py-6 bg-gradient-to-br from-gray-50 to-purple-50/30 border-t border-gray-200">
                <p className="text-center text-sm text-gray-600">
                  Sudah punya akun?{' '}
                  <a 
                    href="/login" 
                    className="font-bold text-purple-600 hover:text-purple-700 transition-colors inline-flex items-center gap-1 group"
                  >
                    Login disini
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