'use client'

import { useEffect } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'
import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import TentangSection from '@/components/TentangSection'
import CaraLaporSection from '@/components/CaraLaporSection'
import PromoRewardSection from '@/components/PromoRewardSection' // <--- Import Ini
import FAQSection from '@/components/FAQSection'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main>
      <Navbar />
      
      <section id="beranda">
        <HeroSection />
      </section>

      <section id="tentang">
        <TentangSection />
      </section>

      <section id="cara-lapor">
        <CaraLaporSection />
      </section>

      {/* TARUH DISINI (Antara Cara Lapor & FAQ) */}
      <section id="promo">
        <PromoRewardSection />
      </section>

      <section id="faq">
        <FAQSection />
      </section>

      <Footer />
    </main>
  )
}
