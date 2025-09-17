'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { Eye, EyeOff } from 'lucide-react'
import HCaptcha from '@hcaptcha/react-hcaptcha'  // ⬅️ pasang lib hCaptcha

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
  const [captchaToken, setCaptchaToken] = useState<string | null>(null) // simpan token captcha

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!captchaToken) {
      setError('Silakan selesaikan captcha dulu')
      setLoading(false)
      return
    }

    // 1. Daftar akun di Supabase Auth dengan captcha token
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        captchaToken, // ⬅️ kirim token ke Supabase
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // 2. Simpan data user ke table 'users'
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

    router.push('/login')
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-white to-orange-100 px-6 py-10">
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* KIRI - Gambar */}
          <div className="hidden md:flex justify-center">
            <Image
              src="/register-illustration.svg"
              alt="Ilustrasi Registrasi"
              width={350}
              height={350}
              priority
            />
          </div>

          {/* KANAN - Form */}
          <div className="bg-white shadow-xl rounded-2xl p-8 w-full">
            <h2 className="text-3xl font-bold text-purple-800 mb-2">Daftar Akun Baru</h2>
            <p className="text-sm mb-4 text-[#3E1C96]">
              Sudah punya akun?{' '}
              <a href="/login" className="text-red-500 font-medium">
                Login disini
              </a>
            </p>

            {error && <p className="text-red-500 mb-3 text-sm">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {['NIK', 'nama', 'email', 'telp'].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    {field === 'telp' ? 'No. Telp' : field.charAt(0).toUpperCase() + field.slice(1)}
                  </label>
                  <input
                    type="text"
                    name={field}
                    value={form[field as keyof typeof form]}
                    onChange={handleChange}
                    className="w-full p-3 rounded-md border text-black"
                    required={field !== 'telp'}
                  />
                </div>
              ))}

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full p-3 rounded-md border text-black pr-10"
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

              {/* hCaptcha Widget */}
              <HCaptcha
                sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
                onVerify={(token) => setCaptchaToken(token)}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-md transition"
              >
                {loading ? 'Loading...' : 'Registrasi'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
