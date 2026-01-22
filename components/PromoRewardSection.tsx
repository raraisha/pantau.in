'use client'

import { Gift, Ticket, TrendingUp, ArrowRight, Star } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation' // Pakai router buat navigasi logic
import AOS from 'aos'
import 'aos/dist/aos.css'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function PromoRewardSection() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    AOS.init({ duration: 800, once: true })
    checkSession()
  }, [])

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setIsLoggedIn(!!session)
  }

  // --- LOGIC TOMBOL UTAMA ---
  const handleStartCollecting = () => {
    if (isLoggedIn) {
      // Kalau udah login -> Langsung suruh lapor biar dapet poin
      router.push('/masyarakat/buat-laporan')
    } else {
      // Kalau belum -> Suruh login dulu
      router.push('/login')
    }
  }

  const features = [
    {
      icon: <Star className="w-6 h-6 text-yellow-400" />,
      title: "Kumpulkan Poin",
      desc: "Setiap laporan yang valid & selesai ditangani akan memberimu poin reputasi."
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-blue-400" />,
      title: "Naikkan Level",
      desc: "Jadilah 'Warga Teladan' dan dapatkan badge khusus di profilmu."
    },
    {
      icon: <Ticket className="w-6 h-6 text-pink-400" />,
      title: "Tukar Voucher",
      desc: "Tukarkan poinmu dengan voucher diskon UMKM, pulsa, atau token listrik."
    }
  ]

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full bg-[#F8F9FE] -z-20"></div>
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -z-10 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -z-10"></div>

      <div className="max-w-7xl mx-auto">
        <div 
          className="bg-gradient-to-br from-[#3E1C96] to-[#6c35d4] rounded-3xl p-8 md:p-12 shadow-2xl text-white relative overflow-hidden"
          data-aos="zoom-in"
        >
          {/* Decorative Circles */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-yellow-400 opacity-20 rounded-full blur-xl"></div>

          <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
            
            {/* Left Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-bold text-yellow-300 border border-white/10">
                <Gift className="w-4 h-4" /> Program Baru
              </div>
              
              <h2 className="text-3xl md:text-5xl font-extrabold leading-tight">
                Jangan Cuma Lapor,<br />
                <span className="text-yellow-400">Dapatkan Hadiahnya!</span>
              </h2>
              
              <p className="text-purple-100 text-lg max-w-lg">
                Bantu kota jadi lebih baik dan nikmati rewards menarik dari mitra kami. Mulai dari kopi gratis hingga voucher belanja.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                {/* TOMBOL LOGIC */}
                <button 
                  onClick={handleStartCollecting}
                  className="bg-yellow-400 hover:bg-yellow-300 text-yellow-900 px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-yellow-900/20 flex items-center gap-2"
                >
                  Mulai Kumpulkan Poin <ArrowRight className="w-5 h-5"/>
                </button>
                
                {/* TOMBOL KATALOG PUBLIC */}
                <Link 
                  href="/rewards" 
                  className="px-6 py-3.5 rounded-xl font-bold text-white border-2 border-white/20 hover:bg-white/10 transition-all"
                >
                  Lihat Katalog
                </Link>
              </div>
            </div>

            {/* Right Content */}
            <div className="relative hidden md:block">
              <div className="grid gap-4 relative">
                {features.map((item, idx) => (
                  <div 
                    key={idx}
                    className={`bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-start gap-4 transform transition-all hover:bg-white/20 hover:scale-105 duration-300 ${idx === 1 ? 'ml-8' : ''}`}
                  >
                    <div className="bg-white p-3 rounded-xl shadow-lg">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{item.title}</h4>
                      <p className="text-purple-100 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}