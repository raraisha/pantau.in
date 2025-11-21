import { useState, useEffect } from 'react'
import { Plus, Minus, Send, Loader2, MessageSquare, Lightbulb } from 'lucide-react'
import Link from 'next/link'


const faqData = [
  {
    question: 'Apa itu Pantau.in?',
    answer:
      'Pantau.in adalah platform pelaporan digital untuk masyarakat Bandung agar bisa melaporkan masalah publik seperti jalan rusak, sampah menumpuk, atau fasilitas umum yang rusak secara online dan cepat.'
  },
  {
    question: 'Siapa saja yang bisa menggunakan Pantau.in?',
    answer:
      'Semua warga Bandung yang telah memiliki akun dapat menggunakan Pantau.in untuk membuat laporan. Admin dan petugas akan menangani laporan sesuai wilayah dan kategori.'
  },
  {
    question: 'Apakah saya harus login untuk membuat laporan?',
    answer:
      'Ya. Untuk menjaga validitas data dan mempermudah pelacakan, kamu harus login terlebih dahulu sebelum mengirim laporan.'
  },
  {
    question: 'Bagaimana saya tahu laporan saya sedang diproses?',
    answer:
      'Setelah laporan dikirim, kamu akan mendapatkan notifikasi melalui email saat laporan diverifikasi, ditugaskan ke petugas, hingga selesai ditindaklanjuti.'
  }
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  const askAI = async () => {
    const trimmedQuestion = question.trim()
    
    if (!trimmedQuestion) {
      setError('Silakan tulis pertanyaan terlebih dahulu')
      return
    }

    setLoading(true)
    setAnswer('')
    setError('')

    try {
      const res = await fetch('/api/ai-pantauin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmedQuestion })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || 'Gagal mendapatkan respons')
      }

      const data = await res.json()
      setAnswer(data.answer || 'Tidak ada jawaban yang diterima')
    } catch (err) {
      setError('Terjadi kesalahan saat memproses pertanyaan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      askAI()
    }
  }

  if (!mounted) return null

  return (
    <section className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-orange-50 py-20 px-4 md:px-8 overflow-hidden" id="faq">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -mr-48 -mt-48"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -ml-48 -mb-48"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-orange-200 mb-4">
            <Lightbulb size={16} className="text-orange-500" />
            <span className="text-sm font-medium text-orange-600">Pusat Bantuan</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-orange-600 bg-clip-text text-transparent mb-4">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Temukan jawaban atas pertanyaan umum tentang Pantau.in dan cara menggunakan platform kami
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* FAQ Items */}
          <div className="lg:col-span-2 space-y-3">
            {faqData.map((faq, i) => (
              <div
                key={i}
                className="group relative"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                  transition: `all 0.6s ease-out ${i * 0.1}s`
                }}
              >
                <button
                  onClick={() => toggle(i)}
                  className={`w-full text-left transition-all duration-300 ${
                    openIndex === i
                      ? 'bg-white shadow-lg shadow-orange-100 border-orange-200'
                      : 'bg-white/60 hover:bg-white border-gray-200 hover:shadow-md'
                  } rounded-2xl p-6 border backdrop-blur-sm`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className={`font-semibold text-lg transition-colors duration-300 ${
                      openIndex === i ? 'text-orange-600' : 'text-gray-800 group-hover:text-orange-500'
                    }`}>
                      {faq.question}
                    </h3>
                    <span className={`flex-shrink-0 text-orange-500 transition-all duration-300 mt-1 ${
                      openIndex === i ? 'rotate-180 scale-110' : 'group-hover:scale-110'
                    }`}>
                      {openIndex === i ? <Minus size={22} /> : <Plus size={22} />}
                    </span>
                  </div>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      openIndex === i ? 'max-h-48 mt-4' : 'max-h-0'
                    }`}
                  >
                    <p className="text-gray-600 leading-relaxed text-base">
                      {faq.answer}
                    </p>
                  </div>
                </button>

                {/* Accent line on left */}
                <div className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-orange-400 to-orange-500 rounded-l-2xl transition-all duration-300 ${
                  openIndex === i ? 'opacity-100' : 'opacity-0'
                }`}></div>
              </div>
            ))}
          </div>

          {/* Ask AI Section */}
          <div className="lg:sticky lg:top-8">
            <div
              className="bg-white rounded-3xl shadow-xl overflow-hidden backdrop-blur-sm border border-gray-100"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.6s ease-out 0.2s'
              }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <MessageSquare size={24} className="text-white" />
                  <h3 className="text-xl font-bold text-white">
                    Tanya AI
                  </h3>
                </div>
                <p className="text-blue-50 text-sm">
                  Tidak menemukan jawaban? Tanyakan langsung ke sistem kami
                </p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Tulis pertanyaanmu di sini..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:outline-none bg-gray-50 focus:bg-white text-gray-800 placeholder-gray-400 transition-all duration-300 disabled:opacity-50"
                    disabled={loading}
                  />
                </div>

                <button
                  onClick={askAI}
                  disabled={loading || !question.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-orange-500 text-white font-semibold px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-orange-200 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Tanya Sekarang</span>
                    </>
                  )}
                </button>

                {error && (
                  <div className="bg-red-50 p-4 rounded-xl border-2 border-red-200 animate-in fade-in slide-in-from-top-2">
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                  </div>
                )}

                {answer && (
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border-2 border-orange-200 animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                      {answer}
                    </p>
                  </div>
                )}

                <Link href="/pertanyaan">
  <button
    type="button"
    className="w-full bg-blue-50 text-blue-600 font-semibold py-3 rounded-xl hover:bg-blue-100 transition-all duration-300 border-2 border-blue-200 hover:border-blue-300 mt-6"
  >
    Tanya Pertanyaan Lain →
  </button>
</Link>

              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}