'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { 
  Coins, History, TrendingUp, Gift, Loader2, 
  ArrowUpRight, ShoppingBag, Ticket, Megaphone, 
  CheckCircle2, AlertCircle, Copy, X
} from 'lucide-react'

// --- Tipe Data ---
type Reward = {
  id: string
  nama_reward: string
  mitra_nama: string
  deskripsi: string
  harga_poin: number
  stok: number
  gambar_url: string
}

type Voucher = {
  id: string
  reward_nama: string
  kode_unik: string
  status: string
  created_at: string
}

type ToastType = {
  show: boolean
  message: string
  type: 'success' | 'error'
}

// --- Hardcode Iklan (Ads) ---
const ADS_CAMPAIGNS = [
  {
    id: 1,
    title: "Lapor Jalan Rusak",
    desc: "Bonus 2x Poin minggu ini!",
    color: "from-blue-500 to-cyan-400",
    icon: <Megaphone className="w-5 h-5 text-white" />
  },
  {
    id: 2,
    title: "Voucher Gratis",
    desc: "Spesial pelapor aktif.",
    color: "from-orange-500 to-amber-400",
    icon: <Gift className="w-5 h-5 text-white" />
  }
]

export default function HalamanPoin() {
  const [loading, setLoading] = useState(true)
  const [redeemLoading, setRedeemLoading] = useState(false)
  
  // State User & Data
  const [user, setUser] = useState<any>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [poin, setPoin] = useState(0)
  const [riwayat, setRiwayat] = useState<any[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [vouchers, setVouchers] = useState<Voucher[]>([])

  // UI State
  const [activeTab, setActiveTab] = useState<'katalog' | 'voucher' | 'riwayat'>('katalog')
  const [toast, setToast] = useState<ToastType>({ show: false, message: '', type: 'success' })
  
  // State Modal Konfirmasi (Pengganti Confirm Alert)
  const [confirmModal, setConfirmModal] = useState<{ show: boolean, reward: Reward | null }>({
    show: false,
    reward: null
  })

  // --- HELPER: SHOW TOAST ---
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000)
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    showToast('Kode voucher disalin!', 'success')
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)

      const { data: profile } = await supabase
        .from('masyarakat')
        .select('id_masyarakat, poin')
        .eq('email', user.email)
        .single()
      
      if (!profile) return

      setProfileId(profile.id_masyarakat)
      setPoin(profile.poin || 0)

      // Parallel Fetching biar ngebut
      const [rewardsRes, vouchersRes, historyRes] = await Promise.all([
        supabase.from('rewards').select('*').order('harga_poin', { ascending: true }),
        supabase.from('user_vouchers').select('*').eq('id_masyarakat', profile.id_masyarakat).order('created_at', { ascending: false }),
        supabase.from('poin').select('*').eq('id_masyarakat', profile.id_masyarakat).order('created_at', { ascending: false })
      ])

      setRewards(rewardsRes.data || [])
      setVouchers(vouchersRes.data || [])
      setRiwayat(historyRes.data || [])

    } catch (err) {
        console.error("Error:", err)
    } finally {
        setLoading(false)
    }
  }

  // --- 1. KLIK TOMBOL TUKAR (Buka Modal) ---
  const openConfirmModal = (reward: Reward) => {
    if (!profileId) return
    if (poin < reward.harga_poin) {
      showToast("Poin kamu kurang nih, yuk lapor lagi!", "error")
      return
    }
    // Set data modal biar muncul
    setConfirmModal({ show: true, reward })
  }

  // --- 2. PROSES TUKAR (Saat klik "Ya" di Modal) ---
  const handleProcessRedeem = async () => {
    const reward = confirmModal.reward
    if (!reward || !profileId) return

    setRedeemLoading(true)

    try {
      const { data, error } = await supabase.rpc('tukar_reward', {
        p_id_masyarakat: profileId,
        p_reward_id: reward.id
      })

      if (error) throw error

      if (data.success) {
        // Tutup Modal
        setConfirmModal({ show: false, reward: null })
        
        showToast(`Berhasil! Kode: ${data.kode}`, 'success')
        
        // Update UI Optimistic
        setPoin(prev => prev - reward.harga_poin)
        setRewards(prev => prev.map(r => r.id === reward.id ? {...r, stok: r.stok - 1} : r))
        
        fetchData() // Sync data
        setActiveTab('voucher')
      } else {
        showToast(data.message, 'error')
        setConfirmModal({ show: false, reward: null })
      }

    } catch (err: any) {
      console.error(err)
      showToast("Terjadi kesalahan sistem", 'error')
    } finally {
      setRedeemLoading(false)
    }
  }

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-purple-600 w-10 h-10"/></div>

  return (
    <div className="min-h-screen bg-[#F8F9FE] pb-12 font-sans text-slate-800">
      <Navbar />

      {/* --- CUSTOM TOAST (NOTIFIKASI) --- */}
      <div className={`fixed top-24 right-4 z-[9999] transition-all duration-300 transform ${toast.show ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border ${toast.type === 'success' ? 'bg-white border-green-200 text-green-700' : 'bg-white border-red-200 text-red-600'}`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5"/> : <AlertCircle className="w-5 h-5"/>}
            <span className="font-semibold text-sm">{toast.message}</span>
        </div>
      </div>

      {/* --- CUSTOM MODAL KONFIRMASI (PENGGANTI ALERT) --- */}
      {confirmModal.show && confirmModal.reward && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
          {/* Backdrop Blur */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => !redeemLoading && setConfirmModal({ show: false, reward: null })}
          ></div>

          {/* Modal Card */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Gift className="w-8 h-8"/>
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-2">Tukar Poin?</h3>
              <p className="text-sm text-slate-500 mb-6">
                Kamu akan menukar <span className="font-bold text-orange-600">{confirmModal.reward.harga_poin} Poin</span><br/>
                untuk mendapatkan <span className="font-bold text-slate-800">{confirmModal.reward.nama_reward}</span>.
              </p>

              <div className="flex gap-3">
                <button
                  disabled={redeemLoading}
                  onClick={() => setConfirmModal({ show: false, reward: null })}
                  className="flex-1 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  disabled={redeemLoading}
                  onClick={handleProcessRedeem}
                  className="flex-1 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition flex items-center justify-center gap-2"
                >
                  {redeemLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : null}
                  Ya, Tukar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-6xl mx-auto pt-28 px-4 sm:px-6">
        
        {/* Header Title */}
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <span className="bg-yellow-400 p-2 rounded-xl text-yellow-900 shadow-sm"><Coins className="w-6 h-6" /></span>
             Dompet & Reward
            </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- SIDEBAR KIRI (Saldo & Ads) --- */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 1. Wallet Card Premium */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 p-8 text-white shadow-2xl shadow-purple-200 group transition-all hover:scale-[1.01]">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
               <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/20 to-transparent"></div>
               
               <div className="relative z-10">
                   <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-indigo-100 text-sm font-medium mb-1">Total Poin Aktif</p>
                            <h2 className="text-5xl font-extrabold tracking-tight">{poin.toLocaleString()}</h2>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/10 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-yellow-300" /> Member
                        </div>
                   </div>

                   <div className="flex gap-3">
                        <button 
                            onClick={() => setActiveTab('riwayat')}
                            className="flex-1 bg-white text-indigo-700 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:bg-indigo-50 transition active:scale-95 flex items-center justify-center gap-2">
                            <History className="w-4 h-4"/> Riwayat
                        </button>
                        <button 
                            onClick={() => setActiveTab('katalog')}
                            className="flex-1 bg-yellow-400 text-yellow-900 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:bg-yellow-300 transition active:scale-95 flex items-center justify-center gap-2">
                            <Gift className="w-4 h-4"/> Tukar
                        </button>
                   </div>
               </div>
            </div>

            {/* 2. Mini Ads Cards */}
            <div className="grid grid-cols-2 gap-3">
              {ADS_CAMPAIGNS.map((ad) => (
                <div key={ad.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer group relative overflow-hidden">
                   <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${ad.color} opacity-10 rounded-bl-full -mr-4 -mt-4 transition group-hover:scale-150`}></div>
                   <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${ad.color} flex items-center justify-center shadow-sm mb-3 group-hover:-translate-y-1 transition`}>
                      {ad.icon}
                   </div>
                   <h4 className="font-bold text-slate-800 text-sm leading-tight">{ad.title}</h4>
                   <p className="text-[10px] text-slate-500 mt-1">{ad.desc}</p>
                </div>
              ))}
            </div>

            {/* 3. Level Progress */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-end mb-2">
                    <h3 className="font-bold text-slate-700">Level Warga</h3>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">Level 2</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 mb-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full" style={{ width: '70%' }}></div>
                </div>
                <p className="text-xs text-slate-500">Kumpulkan <span className="font-bold text-slate-800">300 poin</span> lagi untuk naik level.</p>
            </div>
          </div>

          {/* --- CONTENT KANAN --- */}
          <div className="lg:col-span-8">
            
            {/* Custom Tab Switcher */}
            <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 flex mb-6 relative z-0">
              {['katalog', 'voucher', 'riwayat'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 relative z-10 
                    ${activeTab === tab 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                >
                  {tab === 'katalog' && <ShoppingBag className="w-4 h-4"/>}
                  {tab === 'voucher' && <Ticket className="w-4 h-4"/>}
                  {tab === 'riwayat' && <History className="w-4 h-4"/>}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* TAB: KATALOG */}
            {activeTab === 'katalog' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {rewards.length === 0 ? (
                  <div className="col-span-full py-20 text-center flex flex-col items-center justify-center opacity-50">
                    <ShoppingBag className="w-16 h-16 text-slate-300 mb-4"/>
                    <p>Belum ada reward tersedia.</p>
                  </div>
                ) : (
                  rewards.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group">
                      <div className="h-40 bg-slate-100 relative overflow-hidden">
                         <img src={item.gambar_url || 'https://placehold.co/400x200?text=Reward'} alt={item.nama_reward} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                         <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 shadow-sm border border-white/50">
                            Stok: <span className={item.stok < 5 ? 'text-red-500' : ''}>{item.stok}</span>
                         </div>
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                         <div className="flex justify-between items-start mb-2">
                             <span className="text-[10px] font-extrabold tracking-wider text-indigo-500 bg-indigo-50 px-2 py-1 rounded uppercase">{item.mitra_nama}</span>
                         </div>
                         <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2">{item.nama_reward}</h3>
                         <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1">{item.deskripsi}</p>
                         
                         <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                            <div className="flex items-center gap-1.5 text-orange-600 font-extrabold text-lg">
                                <Coins className="w-5 h-5 fill-current"/> {item.harga_poin}
                            </div>
                            <button 
                                onClick={() => openConfirmModal(item)}
                                disabled={item.stok <= 0 || poin < item.harga_poin}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2
                                ${item.stok <= 0 
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                    : poin < item.harga_poin 
                                    ? 'bg-red-50 text-red-400 cursor-not-allowed border border-red-100'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                                }`}
                            >
                                {item.stok <= 0 ? 'Habis' : 'Tukar'}
                            </button>
                         </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: VOUCHER (Style Tiket Bioskop) */}
            {activeTab === 'voucher' && (
              <div className="space-y-4">
                {vouchers.length === 0 ? (
                  <div className="col-span-full py-20 text-center flex flex-col items-center justify-center opacity-50">
                    <Ticket className="w-16 h-16 text-slate-300 mb-4"/>
                    <p>Kamu belum punya voucher.</p>
                  </div>
                ) : (
                  vouchers.map((v) => (
                    <div key={v.id} className="relative bg-white rounded-xl shadow-sm border border-slate-200 flex overflow-hidden group hover:shadow-md transition">
                       {/* Hiasan Bolongan Tiket Kiri */}
                       <div className="absolute top-1/2 -left-3 w-6 h-6 bg-[#F8F9FE] rounded-full border border-slate-200 z-10"></div>
                       {/* Hiasan Bolongan Tiket Kanan */}
                       <div className="absolute top-1/2 -right-3 w-6 h-6 bg-[#F8F9FE] rounded-full border border-slate-200 z-10"></div>
                       
                       {/* Garis Putus-putus */}
                       <div className="hidden sm:block absolute top-2 bottom-2 right-40 w-px border-l-2 border-dashed border-slate-200"></div>

                       <div className="flex-1 p-5 pl-8 flex flex-col justify-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">E-VOUCHER</span>
                          <h3 className="text-xl font-bold text-slate-800 mb-1">{v.reward_nama}</h3>
                          <p className="text-xs text-slate-500">Ditukar pada: {new Date(v.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                       </div>

                       <div className="w-40 bg-slate-50 border-l border-slate-100 p-4 flex flex-col items-center justify-center text-center relative z-0">
                          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">KODE UNIK</p>
                          <div 
                            onClick={() => handleCopyCode(v.kode_unik)}
                            className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-mono font-bold text-lg text-indigo-600 tracking-widest cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition flex items-center gap-2 group/code"
                          >
                             {v.kode_unik} 
                             <Copy className="w-3 h-3 opacity-0 group-hover/code:opacity-100 transition"/>
                          </div>
                          <span className={`mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${v.status === 'sudah_dipakai' ? 'bg-slate-200 text-slate-500' : 'bg-green-100 text-green-700'}`}>
                             {v.status === 'sudah_dipakai' ? 'Sudah Dipakai' : 'Belum Dipakai'}
                          </span>
                       </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: RIWAYAT */}
            {activeTab === 'riwayat' && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Aktivitas Terakhir
                </div>
                <div className="divide-y divide-slate-100">
                    {riwayat.length === 0 ? (
                       <div className="p-8 text-center text-slate-400 text-sm">Belum ada aktivitas.</div>
                    ) : (
                        riwayat.map((item) => (
                            <div key={item.id} className="p-5 hover:bg-slate-50 transition flex justify-between items-center group">
                                <div className="flex gap-4 items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${item.jumlah > 0 ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                                        {item.jumlah > 0 ? <ArrowUpRight className="w-5 h-5" /> : <Ticket className="w-5 h-5"/>}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-700 transition">{item.keterangan || 'Transaksi Poin'}</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                                            {new Date(item.created_at).toLocaleDateString('id-ID', {
                                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <span className={`font-bold text-base ${item.jumlah > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                  {item.jumlah > 0 ? '+' : ''}{item.jumlah}
                                </span>
                            </div>
                        ))
                    )}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  )
}   