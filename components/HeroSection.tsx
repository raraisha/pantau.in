'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowRight, Sparkles, CheckCircle } from 'lucide-react'

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

  const features = [
    { icon: '⚡', text: 'Cepat & Mudah' },
    { icon: '🔒', text: 'Aman' },
    { icon: '✓', text: 'Terverifikasi' }
  ]

  return (
    <section className="relative min-h-screen pt-20 flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url("/bg-braga.png")',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent"></div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-10 right-0 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 md:px-12 w-full max-w-4xl">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-6"
          data-aos="fade-down"
        >
          <Sparkles size={16} className="text-orange-400" />
          <span className="text-sm font-semibold text-white">Platform Partisipatif Bandung</span>
        </div>

        {/* Main Title */}
        <h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6"
          data-aos="fade-down"
          data-aos-delay="100"
        >
          Warga Bandung,
          <span className="block bg-gradient-to-r from-orange-400 via-orange-300 to-yellow-300 bg-clip-text text-transparent">
            Saatnya Suarakan Aksi!
          </span>
        </h1>

        {/* Description */}
        <p
          className="text-lg sm:text-xl md:text-2xl text-gray-100 max-w-2xl mx-auto leading-relaxed mb-8"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          Laporkan hal-hal yang butuh perhatian—jalan rusak, sampah menumpuk, atau fasilitas umum bermasalah. 
          Biar kita bisa jaga Bandung bareng-bareng.
        </p>

        {/* Features */}
        <div
          className="flex flex-wrap justify-center gap-4 mb-10"
          data-aos="fade-up"
          data-aos-delay="300"
        >
          {features.map((feature, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 hover:border-white/40 transition-all"
            >
              <span className="text-xl">{feature.icon}</span>
              <span className="text-white font-medium text-sm">{feature.text}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          data-aos="zoom-in"
          data-aos-delay="400"
        >
          <button
            onClick={handleClick}
            className="group relative bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-8 py-4 rounded-xl shadow-2xl shadow-orange-500/50 transition-all duration-300 flex items-center gap-2 text-lg hover:scale-105 hover:shadow-2xl"
          >
            <span>Lapor Sekarang!</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <Link
            href="#tentang"
            className="px-8 py-4 rounded-xl text-white font-semibold border-2 border-white/30 hover:border-white/60 hover:bg-white/10 backdrop-blur-sm transition-all duration-300 text-lg"
          >
            Pelajari Lebih Lanjut
          </Link>
        </div>
      </div>
    </section>
  )}  