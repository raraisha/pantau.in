'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { Eye, EyeOff } from 'lucide-react'
import HCaptcha from '@hcaptcha/react-hcaptcha'

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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!captchaToken) {
      setError('Silakan selesaikan captcha dulu.')
      setLoading(false)
      return
    }

    // 1. Daftar akun di Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { captchaToken },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // 2. Simpan data user ke tabel `users`
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF7E9] via-[#FFFDF7] to-[#FDF7EE] px-6 py-10">
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* LEFT IMAGE */}
          <div className="hidden md:flex justify-center">
            <Image
              src="/register-illustration.svg"
              alt="Ilustrasi Registrasi"
              width={380}
              height={380}
              priority
              className="object-contain drop-shadow-md"
            />
          </div>

          {/* RIGHT FORM */}
          <div className="bg-white shadow-lg rounded-2xl p-8 md:p-10 w-full border border-gray-100">
            <h2 className="text-3xl md:text-4xl font-bold text-[#3E1C96] mb-2">
              Daftar Akun Baru
            </h2>
            <p className="text-sm mb-5 text-gray-600">
              Sudah punya akun?{' '}
              <a href="/login" className="text-red-500 font-semibold hover:underline">
                Login disini
              </a>
            </p>

            {error && (
              <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-md mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {['nik', 'nama', 'email', 'telp'].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {field === 'telp'
                      ? 'No. Telp'
                      : field.charAt(0).toUpperCase() + field.slice(1)}
                  </label>
                  <input
                    type={field === 'email' ? 'email' : 'text'}
                    name={field}
                    value={form[field as keyof typeof form]}
                    onChange={handleChange}
                    className="w-full p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#3E1C96] focus:outline-none transition text-black"
                    required={field !== 'telp'}
                  />
                </div>
              ))}

              {/* PASSWORD */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#3E1C96] focus:outline-none transition text-black pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* CAPTCHA */}
              <div className="flex justify-center">
                <HCaptcha
                  sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
                  onVerify={(token) => setCaptchaToken(token)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#F04438] hover:bg-[#d43a2e] text-white font-semibold py-3 rounded-md shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
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
