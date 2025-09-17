'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-yellow-400 text-blue-900 py-10 px-6 md:px-12 mt-16 rounded-t-xl shadow-inner">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <div className="flex items-center space-x-2 mb-2">
      <div className="flex items-center space-x-2">
        <img src="/logo.png" alt="Logo" className="h-10" />
      </div>
          </div>
          <p className="text-sm">
            Platform penghubung antara masyarakat dan instansi pemerintah untuk menciptakan lingkungan yang lebih baik.
          </p>
        </div>

        <div>
          <h3 className="font-bold mb-2">Navigasi</h3>
          <ul className="text-sm space-y-1">
            <li><Link href="/">Beranda</Link></li>
            <li><Link href="#tentang">Tentang</Link></li>
            <li><Link href="#cara-lapor">Cara Lapor</Link></li>
            <li><Link href="/login">Login</Link></li>
            <li><Link href="/register">Daftar</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold mb-2">Kontak</h3>
          <ul className="text-sm space-y-1">
            <li>Email: <a href="mailto:cs@pantau.in" className="underline">cs@pantau.in</a></li>
            <li>WhatsApp: <a href="https://wa.me/6281234567890" className="underline">+62 812-3456-7890</a></li>
            <li>Instagram: <a href="https://instagram.com/pantau.in" className="underline">@pantau.in</a></li>
          </ul>
        </div>
      </div>
      <div className="text-center text-sm mt-10 text-blue-800">
        © {new Date().getFullYear()} Pantau.In. All rights reserved.
      </div>
    </footer>
  )
}
