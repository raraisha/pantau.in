'use client'

import { Target, Lightbulb, Zap, Users } from 'lucide-react'

export default function TentangSection() {
  const cards = [
    {
      icon: Lightbulb,
      title: 'Apa Itu Pantau.in?',
      description: 'Pantau.in adalah platform partisipatif yang memungkinkan warga untuk melaporkan isu lingkungan dan berkolaborasi dengan pemerintah dalam menciptakan perubahan positif.',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Target,
      title: 'Misi Kami',
      description: 'Misi kami adalah menciptakan lingkungan yang lebih bersih dan transparan melalui teknologi dan partisipasi publik yang aktif dari seluruh lapisan masyarakat.',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      icon: Zap,
      title: 'Visi Kami',
      description: 'Membangun ekosistem digital yang memberdayakan warga untuk mengawasi, melaporkan, dan berpartisipasi dalam perbaikan kualitas hidup di kota Bandung.',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Users,
      title: 'Nilai Kami',
      description: 'Transparansi, kolaborasi, dan akuntabilitas adalah inti dari Pantau.in dalam membangun kepercayaan antara masyarakat dan pemerintah.',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50'
    }
  ]

  return (
    <section 
      id="tentang" 
      className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-hidden"
      data-aos="fade-up"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 -mr-48 -mt-48"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 -ml-48 -mb-48"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border-2 border-blue-200 mb-4">
            <Lightbulb size={16} className="text-blue-600" />
            <span className="text-sm font-semibold text-blue-600">Tentang Kami</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-orange-600 bg-clip-text text-transparent mb-4">
            Mengenal Pantau.in
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Platform digital yang mengubah cara masyarakat berkomunikasi dengan pemerintah
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
          {cards.map((card, i) => {
            const Icon = card.icon
            return (
              <div
                key={i}
                data-aos="flip-left"
                data-aos-delay={i * 100}
                className="group relative h-full"
              >
                {/* Card */}
                <div className={`relative bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-transparent transition-all duration-300 h-full shadow-lg hover:shadow-2xl`}>
                  
                  {/* Icon Container */}
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${card.color} mb-6 shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={28} className="text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {card.title}
                  </h3>

                  {/* Divider */}
                  <div className={`w-12 h-1 bg-gradient-to-r ${card.color} rounded-full mb-4`}></div>

                  {/* Description */}
                  <p className="text-gray-600 leading-relaxed text-base">
                    {card.description}
                  </p>

                  {/* Hover Background Accent */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`}></div>
                </div>

                {/* Glow effect */}
                <div className={`absolute -inset-1 bg-gradient-to-r ${card.color} rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10`}></div>
              </div>
            )
          })}
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-3 gap-6 mt-16 pt-16 border-t border-gray-200">
          <div className="text-center">
            <h4 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
              10K+
            </h4>
            <p className="text-gray-600 text-sm mt-2">Laporan Terproses</p>
          </div>
          <div className="text-center">
            <h4 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
              50K+
            </h4>
            <p className="text-gray-600 text-sm mt-2">Pengguna Aktif</p>
          </div>
          <div className="text-center">
            <h4 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
              100%
            </h4>
            <p className="text-gray-600 text-sm mt-2">Transparansi</p>
          </div>
        </div>
      </div>
    </section>
  )
}