'use client'

import { Play, ArrowRight, Check } from 'lucide-react'
import { useState } from 'react'

export default function CaraLaporSection() {
  const [isPlaying, setIsPlaying] = useState(false)

  const steps = [
    { icon: '📝', text: 'Tulis detail masalah' },
    { icon: '📸', text: 'Tambahkan foto/bukti' },
    { icon: '📍', text: 'Pilih lokasi' },
    { icon: '✅', text: 'Kirim laporan' }
  ]

  return (
    <section
      id="cara-lapor"
      className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-blue-50 to-orange-50 overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="absolute top-20 right-0 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15"></div>
      <div className="absolute -bottom-20 left-0 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Text Content */}
          <div
            className="space-y-8"
            data-aos="fade-right"
            data-aos-delay="100"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border-2 border-orange-200 w-fit">
              <Play size={16} className="text-orange-500 animate-pulse" />
              <span className="text-sm font-semibold text-orange-600">Panduan Video</span>
            </div>

            {/* Title */}
            <div>
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-orange-600 bg-clip-text text-transparent mb-4">
                Tonton Cara Lapor Disini!
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"></div>
            </div>

            {/* Description */}
            <p className="text-gray-600 text-lg leading-relaxed">
              Pelajari langkah-langkah mudah untuk menyampaikan laporan dengan cepat dan tepat. Ikuti panduan video agar laporanmu bisa langsung ditindaklanjuti oleh tim kami.
            </p>

            {/* Steps */}
            <div className="grid grid-cols-2 gap-4 py-6">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-300"
                >
                  <span className="text-2xl">{step.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{step.text}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <a
              href="/masyarakat/buat-laporan"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-orange-500 hover:shadow-2xl hover:shadow-orange-300 text-white px-8 py-4 rounded-xl transition-all duration-300 font-semibold text-lg hover:scale-105 group"
            >
              <span>Laporkan Sekarang</span>
              <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </a>

            {/* Trust indicators */}
            <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Check size={20} className="text-green-500" />
                <span className="text-sm text-gray-700">Proses Mudah</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={20} className="text-green-500" />
                <span className="text-sm text-gray-700">Hanya 4 Langkah</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={20} className="text-green-500" />
                <span className="text-sm text-gray-700">Cepat Ditindak</span>
              </div>
            </div>
          </div>

          {/* Right Side - Video */}
          <div
            className="relative group"
            data-aos="zoom-in-left"
            data-aos-delay="300"
          >
            {/* Video Container */}
            <div className="relative w-full aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-white/20">
              <video
                controls={isPlaying}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="w-full h-full object-cover"
                poster="/poster-video.jpg"
              >
                <source src="/cara-lapor.mp4" type="video/mp4" />
                Browser kamu tidak mendukung pemutaran video.
              </video>

              {/* Play Button Overlay */}
              {!isPlaying && (
                <button
                  onClick={(e) => {
                    const video = (e.currentTarget.closest('.relative') as HTMLElement)?.querySelector('video') as HTMLVideoElement
                    video?.play()
                  }}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-all duration-300"
                >
                  <div className="bg-gradient-to-r from-orange-400 to-orange-600 p-4 rounded-full animate-pulse group-hover:animate-none group-hover:scale-110 transition-transform">
                    <Play size={32} className="text-white fill-white" />
                  </div>
                </button>
              )}
            </div>

            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-blue-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300 -z-10"></div>

            {/* Duration Badge */}
            <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm font-medium">
              Video Panduan
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}