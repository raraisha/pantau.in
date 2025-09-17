'use client'

export default function CaraLaporSection() {
  return (
 <section id="cara-lapor" className="..." data-aos="fade-up">
  <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
    <div className="text-left" data-aos="fade-right" data-aos-delay="100">
      <h2 className="text-3xl font-bold text-blue-800 mb-4">Tonton cara lapor disini!</h2>
      <p className="text-gray-600 text-md">
        Pelajari langkah-langkah mudah untuk menyampaikan laporan...
      </p>
    </div>

    <div
      className="relative w-full h-64 md:h-80 bg-gray-300 rounded-xl overflow-hidden"
      data-aos="zoom-in-left"
      data-aos-delay="300"
    >
      <video controls className="w-full h-full object-cover" poster="/poster-video.jpg">
        <source src="/cara-lapor.mp4" type="video/mp4" />
        Browser kamu tidak mendukung pemutaran video.
      </video>
    </div>
  </div>
</section>

  )
}
