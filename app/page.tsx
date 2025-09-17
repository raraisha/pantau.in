'use client'

import { useEffect } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'

import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import TentangSection from '@/components/TentangSection'
import CaraLaporSection from '@/components/CaraLaporSection'
import FAQSection from '@/components/FAQSection'
import Footer from '@/components/Footer'


export default function HomePage() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
    })
  }, [])

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
      <FAQSection />
      <Footer />
    </main>
  )
}
