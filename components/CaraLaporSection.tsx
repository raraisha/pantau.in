'use client'

export default function CaraLaporSection() {
  return (
    <section
      id="cara-lapor"
      className="py-12 px-4 sm:px-6 lg:px-8 bg-white"
      data-aos="fade-up"
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
        {/* Text Section */}
        <div data-aos="fade-right" data-aos-delay="100">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-800 mb-4">
            Tonton cara lapor disini!
          </h2>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
            Pelajari langkah-langkah mudah untuk menyampaikan laporan dengan
            cepat dan tepat. Ikuti panduan video agar laporanmu bisa langsung
            ditindaklanjuti.
          </p>
          <a
            href="/masyarakat/buat-laporan"
            className="inline-block mt-6 bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-md transition text-sm sm:text-base font-medium"
          >
            Laporkan Sekarang
          </a>
        </div>

        {/* Video Section */}
        <div
          className="relative w-full h-56 sm:h-64 md:h-80 bg-gray-200 rounded-xl overflow-hidden shadow-lg"
          data-aos="zoom-in-left"
          data-aos-delay="300"
        >
          <video
            controls
            className="w-full h-full object-cover"
            poster="/poster-video.jpg"
          >
            <source src="/cara-lapor.mp4" type="video/mp4" />
            Browser kamu tidak mendukung pemutaran video.
          </video>
        </div>
      </div>
    </section>
  )
}
