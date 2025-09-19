'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'

export default function TanyaPage() {
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [pertanyaan, setPertanyaan] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const subject = encodeURIComponent(`Pertanyaan dari ${nama}`)
    const body = encodeURIComponent(
      `Nama: ${nama}\nEmail: ${email}\n\nPertanyaan:\n${pertanyaan}`
    )
    window.location.href = `mailto:pantauin.bdg@gmail.com?subject=${subject}&body=${body}`
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-orange-50 flex items-center justify-center p-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-xl space-y-6"
        >
          <h1 className="text-3xl font-bold text-blue-800 mb-4 text-center">
            Tanya Kami
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Punya pertanyaan atau hal yang ingin diklarifikasi? Isi form di bawah ini dan kami akan
            membalas secepatnya.
          </p>

          <div className="flex flex-col">
            <label className="mb-2 text-blue-800 font-medium">Nama</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              required
              className="border border-gray-300 p-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              placeholder="Masukkan nama kamu"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-2 text-blue-800 font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border border-gray-300 p-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              placeholder="Masukkan email kamu"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-2 text-blue-800 font-medium">Pertanyaan</label>
            <textarea
              value={pertanyaan}
              onChange={(e) => setPertanyaan(e.target.value)}
              required
              className="border border-gray-300 p-3 rounded-lg text-gray-900 h-36 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              placeholder="Tulis pertanyaan kamu di sini"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition shadow-md"
          >
            Kirim Pertanyaan
          </button>
        </form>
      </div>
    </>
  )
}
