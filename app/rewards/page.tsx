'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import { Coins, ShoppingBag, ArrowRight, Lock, Gift } from 'lucide-react'
import Link from 'next/link'

type Reward = {
  id: string
  nama_reward: string
  mitra_nama: string
  deskripsi: string
  harga_poin: number
  stok: number
  gambar_url: string
}

export default function PublicRewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false) // State Login

  useEffect(() => {
    // 1. Cek Session User
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session) // true kalau ada session
    }

    // 2. Fetch Data Reward
    const fetchRewards = async () => {
      const { data } = await supabase
        .from('rewards')
        .select('*')
        .order('harga_poin', { ascending: true })
      
      setRewards(data || [])
      setLoading(false)
    }

    checkSession()
    fetchRewards()
  }, [])

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#F8F9FE] pt-28 pb-12 font-sans">
        <div className="max-w-6xl mx-auto px-4">
          
          {/* Header */}
          <div className="text-center mb-12">
            <span className="bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider mb-4 inline-block">
              Katalog Reward
            </span>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-4">
              Tukarkan Poin Kebaikanmu
            </h1>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">
              Setiap laporan yang kamu buat sangat berarti. Ini adalah apresiasi kecil dari kami dan mitra UMKM untuk warga yang peduli.
            </p>
          </div>

          {/* Grid Reward */}
          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => <div key={i} className="h-80 bg-slate-200 rounded-2xl animate-pulse"></div>)}
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rewards.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col">
                  
                  {/* Image */}
                  <div className="h-48 bg-slate-100 relative overflow-hidden">
                    <img 
                      src={item.gambar_url || 'https://placehold.co/400x300?text=Reward'} 
                      alt={item.nama_reward} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-700" 
                    />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold text-slate-800 shadow-sm uppercase tracking-wide">
                      {item.mitra_nama}
                    </div>
                    {/* Badge Stok Habis (Opsional) */}
                    {item.stok <= 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="bg-red-600 text-white px-4 py-1 rounded-full font-bold text-sm transform -rotate-12">STOK HABIS</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-bold text-xl text-slate-800 mb-2 leading-tight">{item.nama_reward}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-6 flex-1">{item.deskripsi}</p>
                    
                    <div className="border-t border-slate-100 pt-4 flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-1.5 text-orange-600 font-extrabold text-xl">
                        <Coins className="w-5 h-5 fill-current"/> {item.harga_poin}
                      </div>
                      
                      {/* --- LOGIKA TOMBOL BERDASARKAN STATUS LOGIN --- */}
                      {isLoggedIn ? (
                        // 1. JIKA SUDAH LOGIN -> Link ke Dashboard Poin
                        <Link 
                          href="/masyarakat/poin" 
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
                        >
                          <Gift className="w-4 h-4"/> Tukar Sekarang
                        </Link>
                      ) : (
                        // 2. JIKA BELUM LOGIN -> Link ke Halaman Login
                        <Link 
                          href="/login" 
                          className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-indigo-600 transition group/btn bg-slate-50 px-3 py-2 rounded-lg hover:bg-indigo-50"
                        >
                          <Lock className="w-4 h-4"/> Login to Redeem
                        </Link>
                      )}

                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bottom CTA (Hanya muncul kalau belum login) */}
          {!isLoggedIn && (
            <div className="mt-20 bg-[#3E1C96] rounded-3xl p-10 text-center text-white relative overflow-hidden">
               <div className="relative z-10">
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">Belum Punya Akun?</h2>
                  <p className="text-purple-200 mb-8 max-w-xl mx-auto">Daftar sekarang untuk mulai mengumpulkan poin dari laporan pertamamu.</p>
                  <Link href="/register" className="inline-flex items-center gap-2 bg-yellow-400 text-yellow-900 px-8 py-3 rounded-xl font-bold hover:bg-yellow-300 transition shadow-lg">
                     Daftar Sekarang <ArrowRight className="w-5 h-5"/>
                  </Link>
               </div>
               <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            </div>
          )}

        </div>
      </div>
      <Footer />
    </>
  )
}