'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X, LogOut, Settings, ChevronDown, Building2 } from 'lucide-react'

type User = {
  nama: string
  role: 'masyarakat' | 'petugas' | 'admin' | 'dinas'
  avatar?: string
  id?: string
  email?: string
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

  const getInitial = (nama?: string) =>
    nama ? nama.charAt(0).toUpperCase() : 'U'

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500'
      case 'dinas':
        return 'bg-purple-500'
      case 'petugas':
        return 'bg-blue-500'
      case 'masyarakat':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'Admin'
      case 'dinas':
        return 'Dinas'
      case 'petugas':
        return 'Petugas'
      case 'masyarakat':
        return 'Masyarakat'
      default:
        return 'User'
    }
  }

  return (
    <nav className="bg-yellow-400 text-blue-900 px-4 sm:px-6 py-4 flex justify-between items-center shadow-lg fixed top-0 left-0 right-0 z-50">
      {/* Logo */}
      <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition">
        <div className="flex items-center justify-center">
          <img src="/logo.png" alt="Logo" className="h-10" />
        </div>
      </Link>

      {/* Burger button (mobile only) */}
      <div className="md:hidden">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-lg hover:bg-yellow-300 transition"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Navigation */}
      <div
        className={`flex-col md:flex md:flex-row md:items-center md:space-x-8 absolute md:static top-full left-0 w-full md:w-auto bg-yellow-400 md:bg-transparent shadow-lg md:shadow-none rounded-b-xl md:rounded-none transition-all duration-300 ${
          menuOpen ? 'flex' : 'hidden md:flex'
        }`}
      >
        {user ? (
          <>
            {/* Link navigasi sesuai role */}
            <div className="flex flex-col md:flex-row md:items-center md:space-x-8 space-y-2 md:space-y-0 px-4 md:px-0 py-4 md:py-0">
              {user.role === 'masyarakat' && (
                <>
                  <Link href="/" className="hover:text-blue-700 transition font-medium">
                    Beranda
                  </Link>
                  <Link href="/masyarakat/dashboard" className="hover:text-blue-700 transition font-medium">
                    Dashboard
                  </Link>
                  <Link href="/masyarakat/buat-laporan" className="hover:text-blue-700 transition font-medium">
                    Buat Laporan
                  </Link>
                  <Link href="/masyarakat/feedback" className="hover:text-blue-700 transition font-medium">
                    Feedback 
                  </Link>
                  <Link href="/masyarakat/riwayat" className="hover:text-blue-700 transition font-medium">
                    Riwayat
                  </Link>
                </>
              )}

              {user.role === 'petugas' && (
                <>
                  {/* <Link href="/petugas/dashboard-petugas" className="hover:text-blue-700 transition font-medium">
                    Dashboard
                  </Link> */}
                  <Link href="/petugas/tugas" className="hover:text-blue-700 transition font-medium">
                    Tugas Saya
                  </Link>
                  <Link href="/petugas/riwayat-tugas" className="hover:text-blue-700 transition font-medium">
                    Riwayat Tugas
                  </Link>
                </>
              )}

              {user.role === 'admin' && (
                <>
                  <Link href="/admin/dashboard" className="hover:text-blue-700 transition font-medium">
                    Dashboard
                  </Link>
                  <Link href="/admin/laporan" className="hover:text-blue-700 transition font-medium">
                    Laporan
                  </Link>
                  <Link href="/admin/manajemen-users" className="hover:text-blue-700 transition font-medium">
                    Akun
                  </Link>
                  <Link href="/admin/feedback" className="hover:text-blue-700 transition font-medium">
                    Feedback
                  </Link>
                                    <Link href="/admin/manajemen-dinas" className="hover:text-blue-700 transition font-medium">
                    Manajemen Dinas
                  </Link>

                </>
              )}

              {user.role === 'dinas' && (
                <>
                  <Link href="/dinas/dashboard" className="hover:text-blue-700 transition font-medium">
                    Dashboard
                  </Link>
                  <Link href="/dinas/laporan" className="hover:text-blue-700 transition font-medium">
                    Laporan Masuk
                  </Link>
                  <Link href="/dinas/petugas" className="hover:text-blue-700 transition font-medium">
                    Petugas
                  </Link>
                  <Link href="/dinas/statistik" className="hover:text-blue-700 transition font-medium">
                    Statistik
                  </Link>
                </>
              )}
            </div>

            {/* Avatar Dropdown */}
            <div className="flex items-center gap-4 px-4 md:px-0 py-4 md:py-0 border-t md:border-t-0 border-blue-600 md:border-t-0">
              <div className="relative">
                <button
                  onClick={() => setOpen(!open)}
                  className="flex items-center gap-2 hover:bg-yellow-300 px-3 py-2 rounded-lg transition"
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-blue-900 shadow">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt="User Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${getRoleBadgeColor(user?.role)} text-white font-semibold text-sm`}>
                          {user.role === 'dinas' ? <Building2 size={16} /> : getInitial(user?.nama)}
                        </div>
                      )}
                    </div>
                    {/* Role Badge */}
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getRoleBadgeColor(user?.role)} rounded-full border-2 border-yellow-400 flex items-center justify-center`}>
                      <span className="text-[8px] text-white font-bold">
                        {user.role === 'admin' ? 'A' : 
                         user.role === 'dinas' ? 'D' : 
                         user.role === 'petugas' ? 'P' : 'M'}
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm font-medium text-blue-900 leading-tight">{user?.nama}</span>
                    <span className="text-xs text-blue-700 leading-tight">{getRoleLabel(user?.role)}</span>
                  </div>
                  <ChevronDown size={16} className={`transition-transform text-blue-900 ${open ? 'rotate-180' : ''}`} />
                </button>

                {open && (
                  <div className="absolute right-0 mt-2 w-56 bg-white text-gray-800 shadow-xl rounded-xl overflow-hidden z-50 border border-gray-100">
                    {/* User Info Header */}
                    <div className="px-4 py-3 bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800 truncate">{user?.nama}</p>
                      <p className="text-xs text-gray-600 truncate">{user?.email || '-'}</p>
                      <div className="mt-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${getRoleBadgeColor(user?.role)}`}>
                          {user.role === 'dinas' && <Building2 size={12} />}
                          {getRoleLabel(user?.role)}
                        </span>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <Link
                      href="/edit-profile"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-sm font-medium border-b border-gray-100"
                      onClick={() => setOpen(false)}
                    >
                      <Settings size={16} />
                      Profile Setting
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 text-left px-4 py-3 text-red-600 hover:bg-red-50 transition text-sm font-medium"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center md:space-x-6 space-y-2 md:space-y-0 px-4 md:px-0 py-4 md:py-0">
            {isHomePage ? (
              <>
                <a href="#beranda" className="hover:text-blue-700 transition font-medium">
                  Beranda
                </a>
                <a href="#tentang" className="hover:text-blue-700 transition font-medium">
                  Tentang
                </a>
                <a href="#cara-lapor" className="hover:text-blue-700 transition font-medium">
                  Cara Lapor
                </a>
                <a href="#faq" className="hover:text-blue-700 transition font-medium">
                  FAQ
                </a>
              </>
            ) : (
              <Link href="/" className="hover:text-blue-700 transition font-medium">
                Beranda
              </Link>
            )}
            
            <div className="flex flex-col md:flex-row gap-3 md:gap-3 md:ml-4 md:pl-4 md:border-l md:border-yellow-300 pt-4 md:pt-0 border-blue-900">
              <Link 
                href="/login"
                className="text-center font-medium hover:text-blue-700 transition px-4 py-2 rounded-lg hover:bg-yellow-300"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-orange-500 text-white px-5 py-2 rounded-lg hover:bg-orange-600 transition text-center font-semibold"
              >
                Daftar
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}