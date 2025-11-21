'use client'

import { useState } from 'react'
import { Send, CheckCircle, MessageSquare, Zap, Shield, Users } from 'lucide-react'
import Navbar from '@/components/Navbar'

export default function TanyaPage() {
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [pertanyaan, setPertanyaan] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const subject = encodeURIComponent(`Pertanyaan dari ${nama}`)
    const body = encodeURIComponent(
      `Nama: ${nama}\nEmail: ${email}\n\nPertanyaan:\n${pertanyaan}`
    )
    window.location.href = `mailto:pantauin.bdg@gmail.com?subject=${subject}&body=${body}`
    setSubmitted(true)
    setTimeout(() => {
      setNama('')
      setEmail('')
      setPertanyaan('')
      setSubmitted(false)
    }, 2000)
  }

  const isFormValid = nama.trim() && email.trim() && pertanyaan.trim()

  return (
    <>
      <Navbar />
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-orange-50 flex items-center justify-center p-4 md:p-6 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -ml-48 -mb-48"></div>

        <div className="relative z-10 w-full max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Info */}
            <div className="hidden lg:flex flex-col justify-center space-y-8">
              <div>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-orange-500 rounded-2xl mb-6 shadow-lg">
                  <MessageSquare size={32} className="text-white" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-orange-600 bg-clip-text text-transparent mb-4">
                  Tanya Kami
                </h1>
                <p className="text-gray-600 text-lg">
                  Punya pertanyaan atau hal yang ingin diklarifikasi? Hubungi tim kami sekarang.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-orange-100">
                      <Zap size={24} className="text-orange-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Respon Cepat</h3>
                    <p className="text-sm text-gray-600">Kami membalas dalam 24 jam kerja</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100">
                      <Shield size={24} className="text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Data Aman</h3>
                    <p className="text-sm text-gray-600">Informasi kamu dijaga dengan baik</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-green-100">
                      <Users size={24} className="text-green-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Tim Profesional</h3>
                    <p className="text-sm text-gray-600">Siap membantu menjawab pertanyaan kamu</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Form */}
            <form
              onSubmit={handleSubmit}
              className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-10 border border-white/50"
            >
              <div className="space-y-6">
                {/* Nama Field */}
                <div className="relative group">
                  <label className="block mb-3 text-gray-700 font-semibold text-sm tracking-wide">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    required
                    placeholder="Masukkan nama kamu"
                    className="w-full px-5 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:bg-white focus:border-orange-400 focus:shadow-lg focus:shadow-orange-200"
                  />
                </div>

                {/* Email Field */}
                <div className="relative group">
                  <label className="block mb-3 text-gray-700 font-semibold text-sm tracking-wide">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Masukkan email kamu"
                    className="w-full px-5 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:bg-white focus:border-orange-400 focus:shadow-lg focus:shadow-orange-200"
                  />
                </div>

                {/* Pertanyaan Field */}
                <div className="relative group">
                  <label className="block mb-3 text-gray-700 font-semibold text-sm tracking-wide">
                    Pertanyaan
                  </label>
                  <textarea
                    value={pertanyaan}
                    onChange={(e) => setPertanyaan(e.target.value)}
                    required
                    placeholder="Tulis pertanyaan atau pesan kamu di sini..."
                    className="w-full px-5 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:bg-white focus:border-orange-400 focus:shadow-lg focus:shadow-orange-200 resize-none h-32"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isFormValid || submitted}
                className={`w-full mt-8 px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-base ${
                  submitted
                    ? 'bg-green-500 text-white shadow-lg'
                    : isFormValid
                    ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white hover:shadow-2xl hover:shadow-orange-300 hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {submitted ? (
                  <>
                    <CheckCircle size={20} />
                    <span>Berhasil!</span>
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    <span>Kirim Pertanyaan</span>
                  </>
                )}
              </button>

              {/* Info Box */}
              <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                <p className="text-sm text-blue-700">
                  💡 Kami akan membalas pertanyaan kamu melalui email dalam 24 jam kerja.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}