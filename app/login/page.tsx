'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Image from 'next/image'
import HCaptcha from '@hcaptcha/react-hcaptcha'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // validasi awal
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
        setError('Captcha verification failed. Silakan coba lagi.')
        setLoading(false)
        return
      }

      // 2. Login dengan Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      // 3. Ambil data user dari tabel users (pakai email)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('nama, role')
        .eq('email', form.email)
        .single()

      if (userError || !userData) {
        setError('Gagal mengambil data user.')
        setLoading(false)
        return
      }

      // 4. Simpan data ke localStorage
      localStorage.setItem(
        'user',
        JSON.stringify({
          name: userData.nama,
          role: userData.role,
        })
      )

      // 5. Redirect sesuai role
      if (userData.role === 'admin') {
        router.push('/admin/dashboard')
      } else if (userData.role === 'petugas') {
        router.push('/dashboard-petugas')
      } else {
        router.push('/masyarakat/dashboard')
      }
    } catch (err) {
      console.error(err)
      setError('Terjadi kesalahan, coba lagi.')
    }

    setLoading(false)
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-[#FDF7EE] px-6 py-10">
        <div className="flex flex-col md:flex-row bg-white rounded-xl shadow-xl w-full max-w-5xl overflow-hidden">
          {/* LEFT ILLUSTRATION */}
          <div className="hidden md:flex items-center justify-center w-full md:w-1/2 bg-[#FFF4D2] px-10 py-10">
            <Image
              src="/register-illustration.svg"
              alt="Illustration"
              width={300}
              height={300}
              className="object-contain"
            />
          </div>

          {/* RIGHT FORM */}
          <div className="w-full md:w-1/2 p-10">
            <h2 className="text-3xl font-bold text-[#3E1C96] mb-2">Login Akun</h2>
            <p className="text-sm mb-6 text-[#3E1C96]">
              Belum punya akun?{' '}
              <a href="/register" className="text-red-500 font-semibold">
                Registrasi disini
              </a>
            </p>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-[#3E1C96]">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full p-3 rounded-md border text-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-[#3E1C96]">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full p-3 rounded-md border text-black"
                  required
                />
              </div>

              {/* hCaptcha Widget */}
              <HCaptcha
                sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || ''}
                onVerify={(token) => setCaptchaToken(token)}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#F04438] hover:bg-[#d43a2e] text-white py-3 rounded-md transition font-semibold"
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
