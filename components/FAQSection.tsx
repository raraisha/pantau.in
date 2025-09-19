'use client'

import { useState, useEffect } from 'react'
import { Plus, Minus } from 'lucide-react'
import AOS from 'aos'
import 'aos/dist/aos.css'
import Link from 'next/link'

const faqData = [
  {
    question: 'Apa itu Pantau.in?',
    answer:
      'Pantau.in adalah platform pelaporan digital untuk masyarakat Bandung agar bisa melaporkan masalah publik seperti jalan rusak, sampah menumpuk, atau fasilitas umum yang rusak secara online dan cepat.',
  },
  {
    question: 'Siapa saja yang bisa menggunakan Pantau.in?',
    answer:
      'Semua warga Bandung yang telah memiliki akun dapat menggunakan Pantau.in untuk membuat laporan. Admin dan petugas akan menangani laporan sesuai wilayah dan kategori.',
  },
  {
    question: 'Apakah saya harus login untuk membuat laporan?',
    answer:
      'Ya. Untuk menjaga validitas data dan mempermudah pelacakan, kamu harus login terlebih dahulu sebelum mengirim laporan.',
  },
  {
    question: 'Bagaimana saya tahu laporan saya sedang diproses?',
    answer:
      'Setelah laporan dikirim, kamu akan mendapatkan notifikasi melalui email saat laporan diverifikasi, ditugaskan ke petugas, hingga selesai ditindaklanjuti.',
  },
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  useEffect(() => {
    AOS.init({ duration: 800, once: true })
  }, [])

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="bg-orange-50 py-16 px-6 md:px-12" id="faq">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-start">
        {/* FAQ List */}
        <div data-aos="fade-up">
          <h2 className="text-3xl font-bold text-blue-800 mb-6">
            Pertanyaan yang Sering Diajukan
          </h2>
          <div className="space-y-4">
            {faqData.map((faq, i) => (
              <div
                key={i}
                data-aos="fade-up"
                data-aos-delay={i * 100}
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 transition-all duration-300"
              >
                <button
                  className="flex items-center justify-between w-full text-left"
                  onClick={() => toggle(i)}
                >
                  <h3 className="font-semibold text-md md:text-lg text-gray-800">
                    {faq.question}
                  </h3>
                  <span className="text-orange-500 transition-transform duration-300">
                    {openIndex === i ? <Minus size={20} /> : <Plus size={20} />}
                  </span>
                </button>

                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    openIndex === i ? 'max-h-40 mt-2 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="text-gray-600 text-sm md:text-base">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tanya Sekarang */}
        <div
          className="bg-white shadow-md rounded-xl p-6 flex flex-col justify-between"
          data-aos="zoom-in"
          data-aos-delay="200"
        >
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Masih punya pertanyaan?</h3>
            <p className="text-gray-600 mb-4">
              Jangan ragu untuk menghubungi kami jika ada hal yang belum jelas. Kami siap membantu
              menjawab pertanyaan Anda kapan saja.
            </p>
          </div>
          <Link href="/pertanyaan">
            <button className="bg-orange-500 text-white font-semibold px-6 py-2 rounded-md hover:bg-orange-600 transition">
              Tanya Sekarang
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}
