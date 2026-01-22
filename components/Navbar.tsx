'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Menu, X, LogOut, Settings, ChevronDown, 
  Building2, Coins, Users, Award, MessageSquare, LayoutDashboard, FileText
} from 'lucide-react'

type User = {
  nama: string
  role: 'masyarakat' | 'petugas' | 'admin' | 'dinas'
  avatar?: string
  id?: string
  email?: string
} | null

export default function Navbar() {
  const [user, setUser] = useState<User>(null)
  const [poin, setPoin] = useState(0)
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  // 1. Ambil User dari LocalStorage
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

  // 2. Fetch Poin Realtime dari Supabase (Khusus Masyarakat)
  useEffect(() => {
    const fetchPoin = async () => {
      if (user?.role === 'masyarakat' && user.email) {
        const { data } = await supabase
          .from('masyarakat')
          .select('poin')
          .eq('email', user.email)
          .single()
        
        if (data) {
          setPoin(data.poin || 0)
        }
      }
    }

    if (user) {
      fetchPoin()
    }
  }, [user])

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
      case 'admin': return 'bg-red-500'
      case 'dinas': return 'bg-purple-500'
      case 'petugas': return 'bg-blue-500'
      case 'masyarakat': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin': return 'Admin'
      case 'dinas': return 'Dinas'
      case 'petugas': return 'Petugas'
      case 'masyarakat': return 'Masyarakat'
      default: return 'User'
    }
  }

  // Helper component untuk link biasa
  const NavLink = ({ href, children }: { href: string, children: React.ReactNode }) => (
    <Link href={href} className="hover:text-blue-700 transition font-medium text-blue-900 block py-1 md:py-0">
      {children}
    </Link>
  )

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
            {/* --- BAGIAN LINK NAVIGASI --- */}
            <div className="flex flex-col md:flex-row md:items-center md:space-x-6 space-y-2 md:space-y-0 px-4 md:px-0 py-4 md:py-0">
              
              {user.role === 'masyarakat' && (
                <>
                  <NavLink href="/">Beranda</NavLink>
                  <NavLink href="/masyarakat/dashboard">Dashboard</NavLink>
                  <NavLink href="/masyarakat/buat-laporan">Buat Laporan</NavLink>
                  <NavLink href="/masyarakat/feedback">Feedback</NavLink>
                  <NavLink href="/masyarakat/riwayat">Riwayat</NavLink>
                </>
              )}

              {user.role === 'petugas' && (
                <>
                  <NavLink href="/petugas/tugas">Tugas Saya</NavLink>
                  <NavLink href="/petugas/riwayat-tugas">Riwayat Tugas</NavLink>
                </>
              )}

              {user.role === 'dinas' && (
                <>
                  <NavLink href="/dinas/dashboard">Dashboard</NavLink>
                  <NavLink href="/dinas/laporan">Laporan Masuk</NavLink>
                  <NavLink href="/dinas/petugas">Petugas</NavLink>
                  <NavLink href="/dinas/statistik">Statistik</NavLink>
                </>
              )}

              {/* --- ADMIN SECTION (DI SEDERHANAKAN) --- */}
{/* --- ADMIN SECTION (YANG UDAH DI FIX) --- */}
{user.role === 'admin' && (
  <>
    <NavLink href="/admin/dashboard">Dashboard</NavLink>
    <NavLink href="/admin/laporan">Laporan</NavLink>

    {/* Dropdown 1: Data Master */}
    <div className="relative group md:py-2">
      <button className="flex items-center gap-1 hover:text-blue-700 font-medium w-full md:w-auto justify-between">
        <span>Data Master</span>
        <ChevronDown size={14} className="group-hover:rotate-180 transition-transform"/>
      </button>

      {/* FIX: Wrapper transparan dengan padding-top (pt-2) sebagai jembatan */}
      <div className="md:absolute md:top-full md:left-0 md:hidden md:group-hover:block z-50 pt-2 w-full md:w-auto">
        
        {/* Box Asli Menu (Background & Shadow pindah ke sini) */}
        <div className="bg-yellow-300 md:bg-white text-blue-900 shadow-none md:shadow-xl rounded-lg overflow-hidden min-w-[180px] border-l-2 border-blue-900 md:border-0 ml-4 md:ml-0">
          <Link href="/admin/manajemen-users" className="block px-4 py-2 text-sm hover:bg-yellow-100 md:hover:bg-gray-50">
            <span className="flex items-center gap-2"><Users size={14}/> Manajemen Akun</span>
          </Link>
          <Link href="/admin/manajemen-dinas" className="block px-4 py-2 text-sm hover:bg-yellow-100 md:hover:bg-gray-50">
            <span className="flex items-center gap-2"><Building2 size={14}/> Manajemen Dinas</span>
          </Link>
        </div>
      </div>
    </div>

    {/* Dropdown 2: Layanan */}
    <div className="relative group md:py-2">
      <button className="flex items-center gap-1 hover:text-blue-700 font-medium w-full md:w-auto justify-between">
        <span>Layanan</span>
        <ChevronDown size={14} className="group-hover:rotate-180 transition-transform"/>
      </button>

      {/* FIX: Wrapper transparan dengan padding-top (pt-2) */}
      <div className="md:absolute md:top-full md:left-0 md:hidden md:group-hover:block z-50 pt-2 w-full md:w-auto">
        
        {/* Box Asli Menu */}
        <div className="bg-yellow-300 md:bg-white text-blue-900 shadow-none md:shadow-xl rounded-lg overflow-hidden min-w-[180px] border-l-2 border-blue-900 md:border-0 ml-4 md:ml-0">
          <Link href="/admin/feedback" className="block px-4 py-2 text-sm hover:bg-yellow-100 md:hover:bg-gray-50">
             <span className="flex items-center gap-2"><MessageSquare size={14}/> Feedback</span>
          </Link>
          <Link href="/admin/rewards" className="block px-4 py-2 text-sm hover:bg-yellow-100 md:hover:bg-gray-50">
             <span className="flex items-center gap-2"><Award size={14}/> Rewards</span>
          </Link>
        </div>
      </div>
    </div>
  </>
)}
              
            </div>

            {/* --- BAGIAN KANAN (POIN & PROFILE) --- */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 px-4 md:px-0 py-4 md:py-0 border-t md:border-t-0 border-blue-600 md:border-0">
              
              {user.role === 'masyarakat' && (
                <Link 
                  href="/masyarakat/poin"
                  className="flex items-center gap-2 bg-white/90 hover:bg-white px-3 py-1.5 rounded-full border border-yellow-500 shadow-sm transition group w-fit"
                >
                  <div className="w-6 h-6 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center border border-yellow-600 text-yellow-900 shadow-inner">
                    <Coins size={14} className="group-hover:scale-110 transition-transform"/>
                  </div>
                  <span className="text-sm font-bold text-blue-900 group-hover:text-blue-700">
                    {poin.toLocaleString()} <span className="text-xs font-normal opacity-70">Poin</span>
                  </span>
                </Link>
              )}

              {/* Avatar Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setOpen(!open)}
                  className="flex items-center gap-2 hover:bg-yellow-300 px-3 py-2 rounded-lg transition w-full md:w-auto"
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-blue-900 shadow shrink-0">
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
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium text-blue-900 leading-tight">{user?.nama}</span>
                    <span className="text-xs text-blue-700 leading-tight">{getRoleLabel(user?.role)}</span>
                  </div>
                  <ChevronDown size={16} className={`ml-auto md:ml-0 transition-transform text-blue-900 ${open ? 'rotate-180' : ''}`} />
                </button>

                {open && (
                  <div className="absolute right-0 md:right-0 left-0 md:left-auto mt-2 w-full md:w-56 bg-white text-gray-800 shadow-xl rounded-xl overflow-hidden z-50 border border-gray-100">
                    {/* User Info Header */}
                    <div className="px-4 py-3 bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800 truncate">{user?.nama}</p>
                      <p className="text-xs text-gray-600 truncate">{user?.email || '-'}</p>
                    </div>

                    {/* Menu Items */}
                    {user.role === 'masyarakat' && (
                       <Link
                       href="/masyarakat/poin"
                       className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-sm font-medium border-b border-gray-100 text-yellow-700"
                       onClick={() => setOpen(false)}
                     >
                       <Coins size={16} />
                       Poin Saya ({poin})
                     </Link>
                    )}

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
                <a href="#beranda" className="hover:text-blue-700 transition font-medium">Beranda</a>
                <a href="#tentang" className="hover:text-blue-700 transition font-medium">Tentang</a>
                <a href="#cara-lapor" className="hover:text-blue-700 transition font-medium">Cara Lapor</a>
                <a href="#faq" className="hover:text-blue-700 transition font-medium">FAQ</a>
              </>
            ) : (
              <Link href="/" className="hover:text-blue-700 transition font-medium">Beranda</Link>
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