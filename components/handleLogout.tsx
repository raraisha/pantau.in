'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

type User = {
  name: string
  level: 'masyarakat' | 'petugas' | 'admin'
} | null

export default function Navbar() {
  const [user, setUser] = useState<User>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  // Fungsi logout
  const handleLogout = () => {
    localStorage.removeItem('user') // hapus user dari localStorage
    setUser(null) // reset state
    router.push('/login') // redirect ke login (atau "/" kalau mau ke home)
  }

  // Cek apakah kita di homepage ("/") untuk nampilkan anchor link
  const isHomePage = pathname === '/'

  return (
    <nav className="bg-yellow-400 px-6 py-4 flex justify-between items-center shadow-md fixed top-0 left-0 right-0 z-50">
      {/* Logo */}
      <div className="flex items-center space-x-2">
        <img src="/logo.png" alt="Logo" className="h-10" />
      </div>

      {/* Navigation */}
      <div className="flex items-center space-x-6 text-blue-900 font-semibold">
        {user ? (
          user.level === 'masyarakat' ? (
            <>
              <Link href="/">Beranda</Link>
              <Link href="/buat-laporan">Buat Laporan</Link>
              <Link href="/riwayat">Riwayat Laporan</Link>
              <button
                onClick={handleLogout}
                className="hover:underline text-red-600"
              >
                Logout
              </button>
            </>
          ) : user.level === 'petugas' ? (
            <>
              <Link href="/dashboard-petugas">Dashboard Petugas</Link>
              <Link href="/riwayat-tugas">Riwayat Tugas</Link>
              <button
                onClick={handleLogout}
                className="hover:underline text-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/dashboard-admin">Dashboard Admin</Link>
              <Link href="/manajemen-petugas">Manajemen Petugas</Link>
              <button
                onClick={handleLogout}
                className="hover:underline text-red-600"
              >
                Logout
              </button>
            </>
          )
        ) : (
          <>
            {isHomePage ? (
              <>
                <a href="#beranda" className="hover:underline scroll-smooth">Beranda</a>
                <a href="#tentang" className="hover:underline scroll-smooth">Tentang</a>
                <a href="#cara-lapor" className="hover:underline scroll-smooth">Cara Lapor</a>
                <a href="#faq" className="hover:underline scroll-smooth">FAQ</a>
              </>
            ) : (
              <Link href="/">Beranda</Link>
            )}
            <Link href="/login">Login</Link>
            <Link
              href="/register"
              className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition"
            >
              Daftar
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
