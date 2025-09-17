'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function HeroSection() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setIsLoggedIn(true)
    }
  }, [])

  const handleClick = () => {
    if (isLoggedIn) {
      router.push('/masyarakat/buat-laporan')
    } else {
      router.push('/login')
    }
  }

  return (
    <section
      className="relative bg-cover bg-center min-h-screen flex items-center justify-center"
      style={{ backgroundImage: 'url("/bg-braga.png")' }}
    >
      {/* Konten di tengah */}
      <div className="relative z-10 text-center px-6 md:px-12">
        <h1
          className="text-3xl md:text-5xl font-extrabold text-blue-900"
          data-aos="fade-down"
        >
          Warga Bandung, Saatnya Suarakan Aksi!
        </h1>

        <p
          className="mt-4 text-base md:text-lg text-gray-800 max-w-2xl mx-auto"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          Laporkan hal-hal yang butuh perhatian—jalan rusak, sampah menumpuk, atau fasilitas umum bermasalah. 
          Biar kita bisa jaga Bandung bareng-bareng.
        </p>

        <div className="mt-6" data-aos="zoom-in-up" data-aos-delay="400">
          <button
            onClick={handleClick}
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-md shadow-md transition"
          >
            Lapor Sekarang!
          </button>
        </div>
      </div>
    </section>
  )
}
