'use client'

export default function TentangSection() {
  return (
    <section id="tentang" className="py-20 px-6 md:px-12 bg-gray-50" data-aos="fade-up">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-lg" data-aos="flip-left" data-aos-delay="100">
          <h3 className="text-xl font-semibold mb-4 text-blue-900">Apa Itu Pantau.in?</h3>
          <p className="text-gray-700">
            Pantau.in adalah platform partisipatif yang memungkinkan warga untuk melaporkan isu lingkungan dan berkolaborasi dengan pemerintah.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg" data-aos="flip-right" data-aos-delay="300">
          <h3 className="text-xl font-semibold mb-4 text-blue-900">Misi Kami</h3>
          <p className="text-gray-700">
            Misi kami adalah menciptakan lingkungan yang lebih bersih dan transparan melalui teknologi dan partisipasi publik.
          </p>
        </div>
      </div>
    </section>
  )
}
