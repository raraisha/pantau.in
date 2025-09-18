'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

type User = {
  name: string
  role: 'masyarakat' | 'petugas' | 'admin'
  avatar?: string
} | null

export default function Navbar() {
  const [user, setUser] = useState<User>(null)
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
    window.location.href = '/login'
  }

  const isHomePage = pathname === '/'

  const getInitial = (name?: string) =>
    name ? name.charAt(0).toUpperCase() : 'U'

  return (
    <nav className="bg-yellow-400 px-6 py-4 flex justify-between items-center shadow-md fixed top-0 left-0 right-0 z-50">
      {/* Logo */}
      <div className="flex items-center space-x-2">
        <img src="/logo.png" alt="Logo" className="h-10" />
      </div>

      {/* Burger button (mobile) */}
      <div className="md:hidden">
        <button onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Navigation */}
      <div
        className={`flex-col md:flex md:flex-row md:items-center md:space-x-6 text-blue-900 font-semibold absolute md:static top-16 left-0 w-full md:w-auto bg-yellow-400 md:bg-transparent transition-all duration-300 ${
          menuOpen ? 'flex' : 'hidden'
        }`}
      >
        {user ? (
          <>
            {/* Link navigasi sesuai role */}
            {user.role === 'masyarakat' && (
              <>
                <Link href="/">Beranda</Link>
                <Link href="/masyarakat/dashboard">Dashboard</Link>
                <Link href="/masyarakat/buat-laporan">Buat Laporan</Link>
                <Link href="/masyarakat/riwayat">Riwayat Laporan</Link>
              </>
            )}

            {user.role === 'petugas' && (
              <>
                <Link href="/dashboard-petugas">Dashboard Petugas</Link>
                <Link href="/riwayat-tugas">Riwayat Tugas</Link>
              </>
            )}

            {user.role === 'admin' && (
              <>
                <Link href="/admin/dashboard">Dashboard Admin</Link>
                <Link href="/admin/laporan">Manajemen Laporan</Link>
                <Link href="/admin/manajemen-petugas">Manajemen Petugas</Link>
                <Link href="/admin/manajemen-users">Manajemen Users</Link>
              </>
            )}

            {/* Notifikasi */}
            <button className="text-xl">🔔</button>

            {/* Avatar + Dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpen(!open)}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="User Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white">
                    {getInitial(user?.name)}
                  </div>
                )}
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-md overflow-hidden">
                  <a
                    href="/edit-profile"
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Profile Setting
                  </a>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {isHomePage ? (
              <>
                <a href="#beranda" className="hover:underline scroll-smooth">
                  Beranda
                </a>
                <a href="#tentang" className="hover:underline scroll-smooth">
                  Tentang
                </a>
                <a href="#cara-lapor" className="hover:underline scroll-smooth">
                  Cara Lapor
                </a>
                <a href="#faq" className="hover:underline scroll-smooth">
                  FAQ
                </a>
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
