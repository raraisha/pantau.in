'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Image from 'next/image'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
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

      // 2. Login Supabase Auth
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      // 3. Cek role user
      const { data: adminData } = await supabase
        .from('admins')
        .select('nama')
        .eq('email', form.email)
        .maybeSingle()

      if (adminData) {
        localStorage.setItem('user', JSON.stringify({ name: adminData.nama, role: 'admin' }))
        router.push('/admin/dashboard')
        return
      }

      const { data: petugasData } = await supabase
        .from('petugas')
        .select('nama')
        .eq('email', form.email)
        .maybeSingle()

      if (petugasData) {
        localStorage.setItem('user', JSON.stringify({ name: petugasData.nama, role: 'petugas' }))
        router.push('/dashboard-petugas')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('nama')
        .eq('email', form.email)
        .maybeSingle()

      if (userData) {
        localStorage.setItem('user', JSON.stringify({ name: userData.nama, role: 'masyarakat' }))
        router.push('/masyarakat/dashboard')
        return
      }

      setError('Akun tidak ditemukan.')
    } catch (err) {
      console.error(err)
      setError('Terjadi kesalahan, coba lagi.')
    }

    setLoading(false)
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF7E9] via-[#FFFDF7] to-[#FDF7EE] px-4 py-10">
        <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-lg w-full max-w-5xl overflow-hidden border border-gray-100">
          {/* LEFT ILLUSTRATION */}
          <div className="hidden md:flex items-center justify-center w-full md:w-1/2 bg-[#FFF4D2] p-10">
            <Image
              src="/register-illustration.svg"
              alt="Illustration"
              width={350}
              height={350}
              className="object-contain drop-shadow-md"
            />
          </div>

          {/* RIGHT FORM */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <h2 className="text-3xl md:text-4xl font-bold text-[#3E1C96] mb-3">
              Login Akun
            </h2>
            <p className="text-sm mb-6 text-gray-600">
              Belum punya akun?{' '}
              <a href="/register" className="text-red-500 font-semibold hover:underline">
                Registrasi disini
              </a>
            </p>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#3E1C96] focus:outline-none transition text-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full p-3 rounded-md border border-gray-300 pr-10 focus:ring-2 focus:ring-[#3E1C96] focus:outline-none transition text-black"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-center">
                <HCaptcha
                  sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || ''}
                  onVerify={(token) => setCaptchaToken(token)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#F04438] hover:bg-[#d43a2e] text-white py-3 rounded-md font-semibold shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
