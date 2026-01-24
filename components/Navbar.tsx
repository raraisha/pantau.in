'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Menu, X, LogOut, Settings, ChevronDown, 
  Building2, Coins, Users, Award, MessageSquare, LayoutGrid
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

  // --- LOGIC & STATE (TIDAK BERUBAH) ---
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

  useEffect(() => {
    const fetchPoin = async () => {
      if (user?.role === 'masyarakat' && user.email) {
        const { data } = await supabase
          .from('masyarakat')
          .select('poin')
          .eq('email', user.email)
          .single()
        if (data) setPoin(data.poin || 0)
      }
    }
    if (user) fetchPoin()
  }, [user])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('user')
    setUser(null)
    window.location.href = '/login'
  }

  const isHomePage = pathname === '/'
  const getInitial = (nama?: string) => nama ? nama.charAt(0).toUpperCase() : 'U'

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500 border-red-600'
      case 'dinas': return 'bg-purple-500 border-purple-600'
      case 'petugas': return 'bg-blue-500 border-blue-600'
      case 'masyarakat': return 'bg-green-500 border-green-600'
      default: return 'bg-gray-500 border-gray-600'
    }
  }

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin': return 'Administrator'
      case 'dinas': return 'Instansi Dinas'
      case 'petugas': return 'Petugas Lapangan'
      case 'masyarakat': return 'Warga'
      default: return 'User'
    }
  }

  // --- HELPER COMPONENT BARU UNTUK LINK MODERN ---
  const ModernNavLink = ({ href, children }: { href: string, children: React.ReactNode }) => {
    const isActive = pathname === href
    return (
      <Link 
        href={href} 
        className={`px-4 py-2 rounded-full font-bold transition-all duration-200 text-base
          ${isActive 
            ? 'bg-yellow-600/20 text-blue-900' // Style saat aktif
            : 'text-blue-900 hover:bg-yellow-300 hover:text-blue-800 hover:shadow-sm' // Style hover modern
          } block md:inline-block mb-2 md:mb-0 text-center md:text-left`}
      >
        {children}
      </Link>
    )
  }

  // --- HELPER UNTUK LINK HOMEPAGE ---
  const HomeNavLink = ({ href, children }: { href: string, children: React.ReactNode }) => (
     <a 
       href={href} 
       className="px-4 py-2 rounded-full font-bold text-base text-blue-900 hover:bg-yellow-300 hover:text-blue-800 hover:shadow-sm transition-all duration-200 block md:inline-block mb-2 md:mb-0 text-center md:text-left"
     >
       {children}
     </a>
  )


  return (
    <nav className="bg-yellow-400 text-blue-900 shadow-md fixed top-0 left-0 right-0 z-50 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
        
        {/* LOGO (TIDAK DIGANTI) */}
        <Link href="/" className="flex items-center space-x-2 hover:scale-105 transition-transform group">
          <div className="flex items-center justify-center p-1 rounded-xl  backdrop-blur-sm group-hover:bg-white/40 transition-colors">
            <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
          </div>
        </Link>

        {/* Burger button (mobile only) */}
        <div className="md:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-full hover:bg-yellow-300 text-blue-900 transition active:scale-95"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Navigation Container */}
        <div
          className={`flex-col md:flex md:flex-row md:items-center md:justify-between absolute md:static top-[64px] left-0 w-full md:w-auto 
          bg-yellow-50 md:bg-transparent shadow-xl md:shadow-none rounded-b-2xl md:rounded-none p-6 md:p-0 gap-6 md:gap-0
          transition-all duration-300 ease-in-out origin-top
          ${menuOpen ? 'flex scale-y-100 opacity-100' : 'hidden md:flex scale-y-0 md:scale-y-100 opacity-0 md:opacity-100'}`}
        >
          {user ? (
            <>
              {/* --- LINKS SECTION --- */}
              <div className="flex flex-col md:flex-row md:items-center md:gap-2">
                {user.role === 'masyarakat' && (
                  <>
                    <ModernNavLink href="/">Beranda</ModernNavLink>
                    <ModernNavLink href="/masyarakat/dashboard">Dashboard</ModernNavLink>
                    <ModernNavLink href="/masyarakat/buat-laporan">Buat Laporan</ModernNavLink>
                    <ModernNavLink href="/masyarakat/feedback">Feedback</ModernNavLink>
                    <ModernNavLink href="/masyarakat/riwayat">Riwayat</ModernNavLink>
                  </>
                )}

                {user.role === 'petugas' && (
                  <>
                    <ModernNavLink href="/petugas/tugas">Tugas Saya</ModernNavLink>
                    <ModernNavLink href="/petugas/riwayat-tugas">Riwayat</ModernNavLink>
                  </>
                )}

                {user.role === 'dinas' && (
                  <>
                    <ModernNavLink href="/dinas/dashboard">Dashboard</ModernNavLink>
                    {/* <ModernNavLink href="/dinas/laporan">Laporan Masuk</ModernNavLink> */}
                    <ModernNavLink href="/dinas/petugas">Petugas</ModernNavLink>
                    <ModernNavLink href="/dinas/statistik">Statistik</ModernNavLink>
                  </>
                )}

                {user.role === 'admin' && (
                  <>
                    <ModernNavLink href="/admin/dashboard">Dashboard</ModernNavLink>
                    <ModernNavLink href="/admin/laporan">Laporan</ModernNavLink>

                    {/* Dropdown 1: Data Master */}
                    <div className="relative group md:px-2 py-2 md:py-0">
                      <button className="flex items-center gap-1 px-4 py-2 rounded-full font-bold text-base text-blue-900 hover:bg-yellow-300 transition-all w-full md:w-auto justify-between">
                        <span>Master</span>
                        <ChevronDown size={14} className="group-hover:rotate-180 transition-transform"/>
                      </button>
                      {/* Dropdown Content */}
                      <div className="md:absolute md:top-full md:left-0 md:pt-3 hidden group-hover:block z-50 w-full md:w-56">
                        <div className="bg-white text-blue-900 shadow-xl rounded-2xl overflow-hidden border border-yellow-500/20 p-2 flex flex-col gap-1 animate-in fade-in zoom-in-95">
                          <Link href="/admin/manajemen-users" className="flex items-center gap-3 px-3 py-2 text-base font-medium hover:bg-yellow-100 text-blue-800 rounded-xl transition">
                            <Users size={16}/> Manajemen Akun
                          </Link>
                          <Link href="/admin/manajemen-dinas" className="flex items-center gap-3 px-3 py-2 text-base font-medium hover:bg-yellow-100 text-blue-800 rounded-xl transition">
                            <Building2 size={16}/> Manajemen Dinas
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Dropdown 2: Layanan */}
                    <div className="relative group md:px-2 py-2 md:py-0">
                      <button className="flex items-center gap-1 px-4 py-2 rounded-full font-bold text-base text-blue-900 hover:bg-yellow-300 transition-all w-full md:w-auto justify-between">
                        <span>Layanan</span>
                        <ChevronDown size={14} className="group-hover:rotate-180 transition-transform"/>
                      </button>
                      {/* Dropdown Content */}
                      <div className="md:absolute md:top-full md:left-0 md:pt-3 hidden group-hover:block z-50 w-full md:w-56">
                        <div className="bg-white text-blue-900 shadow-xl rounded-2xl overflow-hidden border border-yellow-500/20 p-2 flex flex-col gap-1 animate-in fade-in zoom-in-95">
                          <Link href="/admin/feedback" className="flex items-center gap-3 px-3 py-2 text-base font-medium hover:bg-yellow-100 text-blue-800 rounded-xl transition">
                             <MessageSquare size={16}/> Feedback
                          </Link>
                          <Link href="/admin/rewards" className="flex items-center gap-3 px-3 py-2 text-base font-medium hover:bg-yellow-100 text-blue-800 rounded-xl transition">
                             <Award size={16}/> Rewards
                          </Link>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* --- USER CAPSULE SECTION (RIGHT) --- */}
              <div className="md:ml-auto">
                 <div className="flex flex-col md:flex-row items-center gap-3 bg-yellow-300/60 md:rounded-full p-1 pr-2 md:pl-1 border border-yellow-500/30 md:backdrop-blur-sm">
                  
                  {/* Poin Badge */}
                  {user.role === 'masyarakat' && (
                    <Link 
                      href="/masyarakat/poin"
                      className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm transition group hover:shadow-md hover:scale-105 w-full md:w-auto justify-center"
                    >
                      <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full flex items-center justify-center text-white shadow-inner">
                        <Coins size={14} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform"/>
                      </div>
                      <span className="text-sm font-extrabold text-blue-900 leading-none">
                        {poin.toLocaleString()} <span className="text-[10px] font-bold text-blue-700 uppercase">Poin</span>
                      </span>
                    </Link>
                  )}

                  {/* Avatar Dropdown */}
                  <div className="relative w-full md:w-auto">
                    <button
                      onClick={() => setOpen(!open)}
                      className="flex items-center gap-3 hover:bg-yellow-300/80 p-1.5 md:pr-3 rounded-full transition-all w-full md:w-auto group"
                    >
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-sm bg-blue-900 group-hover:shadow-md transition-shadow">
                          {user.avatar ? (
                            <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${getRoleBadgeColor(user?.role).replace('border-', 'from-').replace('500', '400')} to-blue-900 text-white font-bold text-sm`}>
                              {user.role === 'dinas' ? <Building2 size={16} /> : getInitial(user.nama)}
                            </div>
                          )}
                        </div>
                        {/* Role Indicator Dot */}
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${getRoleBadgeColor(user?.role).split(' ')[0]}`}></div>
                      </div>
                      
                      <div className="flex flex-col items-start text-left overflow-hidden">
                        <span className="text-sm font-bold text-blue-950 leading-tight truncate max-w-[120px]">
                          {user.nama?.split(' ')[0] || 'User'}
                        </span>
                        <span className="text-[10px] font-bold text-blue-800/70 leading-tight uppercase tracking-wider">
                          {user.role}
                        </span>
                      </div>
                      <ChevronDown size={16} className={`ml-auto md:ml-2 text-blue-800 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu User */}
                    {open && (
                      <div className="absolute right-0 mt-3 w-full md:w-72 bg-white text-blue-900 shadow-xl rounded-2xl overflow-hidden z-50 border border-yellow-500/20 animate-in fade-in zoom-in-95 origin-top-right">
                        {/* Header */}
                        <div className="p-5 bg-gradient-to-br from-yellow-50 to-white border-b border-yellow-100 flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-sm bg-gradient-to-br ${getRoleBadgeColor(user.role).replace('border-', 'from-').replace('500', '400')} to-blue-900`}>
                              {getInitial(user.nama)}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-base font-bold text-blue-950 truncate">{user.nama}</p>
                            <p className="text-xs text-blue-700/70 truncate mb-2 font-medium">{user.email || '-'}</p>
                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-extrabold border uppercase tracking-wider ${getRoleBadgeColor(user.role)} bg-opacity-10`}>
                              {getRoleLabel(user.role)}
                            </span>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2 flex flex-col gap-1">
                          {user.role === 'masyarakat' && (
                             <Link
                             href="/masyarakat/poin"
                             className="flex items-center gap-3 px-4 py-3 hover:bg-yellow-50 text-blue-800 hover:text-orange-700 rounded-xl transition text-sm font-bold group"
                             onClick={() => setOpen(false)}
                           >
                             <Coins size={18} className="text-orange-500 group-hover:scale-110 transition-transform"/>
                             Dompet Poin
                           </Link>
                          )}

                          <Link
                            href="/edit-profile"
                            className="flex items-center gap-3 px-4 py-3 hover:bg-yellow-50 text-blue-800 hover:text-blue-950 rounded-xl transition text-sm font-bold group"
                            onClick={() => setOpen(false)}
                          >
                            <Settings size={18} className="text-blue-500 group-hover:rotate-45 transition-transform"/>
                            Pengaturan Akun
                          </Link>
                          
                          <div className="h-px bg-yellow-100/50 my-2 mx-4"></div>
                          
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition text-sm font-bold group"
                          >
                            <LogOut size={18} className="group-hover:translate-x-1 transition-transform"/>
                            Keluar Aplikasi
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                 </div>
              </div>
            </>
          ) : (
            // --- GUEST NAVIGATION ---
            <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4 md:gap-0">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-1">
                {isHomePage ? (
                  <>
                    <HomeNavLink href="#beranda">Beranda</HomeNavLink>
                    <HomeNavLink href="#tentang">Tentang</HomeNavLink>
                    <HomeNavLink href="#cara-lapor">Cara Lapor</HomeNavLink>
                    <HomeNavLink href="#faq">FAQ</HomeNavLink>
                  </>
                ) : (
                  <ModernNavLink href="/">Beranda</ModernNavLink>
                )}
              </div>

              <div className="flex flex-col md:flex-row items-center gap-3 mt-4 md:mt-0 md:ml-auto">
                <Link 
                  href="/login"
                  className="text-sm font-bold text-blue-900 hover:bg-yellow-300/50 px-6 py-2.5 rounded-full transition w-full md:w-auto text-center"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-900 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-md hover:bg-blue-800 hover:shadow-lg transition-all hover:scale-105 active:scale-95 w-full md:w-auto text-center"
                >
                  Daftar Sekarang
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}