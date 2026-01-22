'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { supabase } from '@/lib/supabase'
import { 
  Gift, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Loader2, 
  Ticket, 
  CheckCircle2, 
  TrendingUp, 
  LayoutGrid, 
  List, 
  AlertCircle, 
  X, 
  Save,
  Coins,
  ScanBarcode,
  User,
  Calendar,
  ShoppingBag
} from 'lucide-react'
import Swal from 'sweetalert2'

// --- Tipe Data ---
type Reward = {
  id?: string
  nama_reward: string
  mitra_nama: string
  deskripsi: string
  harga_poin: number
  stok: number
  gambar_url: string
}

type VoucherUser = {
  id: string
  kode_unik: string
  reward_nama: string
  status: string
  created_at: string
  masyarakat: {
    nama: string
    email: string
  }
}

export default function ManajemenRewards() {
  const [activeTab, setActiveTab] = useState<'reward' | 'validasi'>('reward')
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Data State
  const [rewards, setRewards] = useState<Reward[]>([])
  const [filteredRewards, setFilteredRewards] = useState<Reward[]>([])
  const [vouchers, setVouchers] = useState<VoucherUser[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [voucherCodeQuery, setVoucherCodeQuery] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Reward>({
    nama_reward: '', mitra_nama: '', deskripsi: '',
    harga_poin: 0, stok: 0, gambar_url: ''
  })
  const [isSaving, setIsSaving] = useState(false)

  // Stats Data
  const stats = [
    { id: 'total', label: 'Total Reward', count: rewards.length, icon: Gift, bg: 'bg-gradient-to-br from-purple-500 to-purple-600', text: 'text-purple-100' },
    { id: 'aktif', label: 'Voucher Aktif', count: vouchers.filter(v => v.status === 'belum_dipakai').length, icon: Ticket, bg: 'bg-gradient-to-br from-blue-500 to-cyan-500', text: 'text-blue-100' },
    { id: 'terpakai', label: 'Tervalidasi', count: vouchers.filter(v => v.status === 'sudah_dipakai').length, icon: CheckCircle2, bg: 'bg-gradient-to-br from-green-500 to-emerald-500', text: 'text-green-100' },
  ]

  useEffect(() => {
    AOS.init({ duration: 800, once: true })
    fetchData()
  }, [])

  useEffect(() => {
    const res = rewards.filter(r => 
      r.nama_reward.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.mitra_nama.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredRewards(res)
  }, [searchQuery, rewards])

  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. Fetch Rewards
      const { data: dataRewards } = await supabase.from('rewards').select('*').order('created_at', { ascending: false })
      setRewards(dataRewards || [])

      // 2. Fetch Vouchers
      const { data: dataVouchers } = await supabase
        .from('user_vouchers')
        .select(`*, masyarakat!user_vouchers_id_masyarakat_fkey ( nama, email )`)
        .order('created_at', { ascending: false })
        .limit(100)
      
      const mappedVouchers = dataVouchers?.map((v: any) => ({
        ...v,
        masyarakat: Array.isArray(v.masyarakat) ? v.masyarakat[0] : v.masyarakat
      }))
      setVouchers(mappedVouchers || [])

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // --- HANDLERS ---
  const handleOpenModal = (reward?: Reward) => {
    if (reward) {
      setIsEditing(true)
      setCurrentId(reward.id!)
      setFormData(reward)
    } else {
      setIsEditing(false)
      setCurrentId(null)
      setFormData({ nama_reward: '', mitra_nama: '', deskripsi: '', harga_poin: 0, stok: 0, gambar_url: '' })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setIsSaving(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      if (isEditing && currentId) {
        await supabase.from('rewards').update(formData).eq('id', currentId)
        Swal.fire('Berhasil!', 'Reward berhasil diperbarui.', 'success')
      } else {
        await supabase.from('rewards').insert(formData)
        Swal.fire('Berhasil!', 'Reward baru ditambahkan.', 'success')
      }
      handleCloseModal()
      fetchData()
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteReward = async (id: string) => {
    const result = await Swal.fire({
      title: 'Hapus Reward?',
      text: "Data tidak bisa dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#F04438',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    })

    if (result.isConfirmed) {
      await supabase.from('rewards').delete().eq('id', id)
      fetchData()
      Swal.fire('Terhapus!', 'Reward telah dihapus.', 'success')
    }
  }

  // --- VALIDASI VOUCHER SEARCH ---
  const filteredVouchers = voucherCodeQuery 
    ? vouchers.filter(v => v.kode_unik.toLowerCase().includes(voucherCodeQuery.toLowerCase()))
    : vouchers

  const handleValidateVoucher = async (voucherId: string) => {
    const result = await Swal.fire({
      title: 'Validasi Voucher?',
      text: "Voucher akan ditandai sebagai SUDAH DIPAKAI.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3E1C96',
      confirmButtonText: 'Ya, Validasi!'
    })

    if (result.isConfirmed) {
      const { error } = await supabase.from('user_vouchers').update({ status: 'sudah_dipakai' }).eq('id', voucherId)
      if (!error) {
        fetchData()
        Swal.fire('Sukses!', 'Voucher berhasil divalidasi.', 'success')
      }
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-[#FDF7EE] via-[#f8f4ff] to-[#FDF7EE] pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="mb-10" data-aos="fade-down">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#3E1C96] to-[#F04438] mb-3">
              🎁 Manajemen Reward
            </h1>
            <p className="text-gray-600 text-lg max-w-3xl">
              Kelola katalog hadiah penukaran poin dan validasi kode voucher warga.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8" data-aos="fade-up">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.id} className={`${stat.bg} text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-8 h-8 opacity-80" />
                    <span className="text-3xl font-bold">{stat.count}</span>
                  </div>
                  <p className={`${stat.text} font-medium tracking-wide uppercase text-xs`}>{stat.label}</p>
                </div>
              )
            })}
          </div>

          {/* TAB NAVIGATION */}
          <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-2xl shadow-sm border border-gray-100 flex mb-6 max-w-md mx-auto md:mx-0" data-aos="fade-up">
              <button 
                onClick={() => setActiveTab('reward')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'reward' ? 'bg-[#3E1C96] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                <Gift className="w-4 h-4"/> Katalog
              </button>
              <button 
                onClick={() => setActiveTab('validasi')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'validasi' ? 'bg-[#3E1C96] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                <ScanBarcode className="w-4 h-4"/> Validasi
              </button>
          </div>

          {/* MAIN CONTAINER */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-100" data-aos="fade-up" data-aos-delay="100">
            
            {/* --- TAB 1: MANAJEMEN REWARD --- */}
            {activeTab === 'reward' && (
              <>
                {/* Toolbar */}
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8]">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <ShoppingBag className="w-6 h-6"/> Data Katalog
                    </h2>

                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                      <div className="relative group w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#3E1C96] w-4 h-4 transition-colors" />
                        <input 
                          type="text"
                          placeholder="Cari Reward..."
                          className="w-full bg-white/90 border-0 py-2.5 pl-10 pr-4 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-purple-300 outline-none text-gray-800 shadow-sm"
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>

                      <div className="flex bg-white/20 p-1 rounded-xl">
                        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-[#3E1C96] shadow-sm' : 'text-white hover:bg-white/10'}`}><LayoutGrid className="w-4 h-4" /></button>
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-[#3E1C96] shadow-sm' : 'text-white hover:bg-white/10'}`}><List className="w-4 h-4" /></button>
                      </div>

                      <button 
                        onClick={() => handleOpenModal()} 
                        className="flex items-center justify-center gap-2 bg-[#F04438] hover:bg-[#D93025] text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-900/20"
                      >
                        <Plus className="w-4 h-4" /> Tambah
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-0 min-h-[400px]">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                      <Loader2 className="w-10 h-10 animate-spin text-[#3E1C96] mb-3" />
                      <p className="text-gray-500 text-sm font-medium">Sinkronisasi Data...</p>
                    </div>
                  ) : filteredRewards.length > 0 ? (
                    <div className="p-6">
                      {viewMode === 'grid' ? (
                        /* GRID VIEW */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredRewards.map((item) => (
                            <div key={item.id} className="group flex flex-col justify-between bg-white rounded-2xl border border-gray-100 hover:border-purple-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                                <div className="h-40 bg-gray-100 relative overflow-hidden">
                                    <img src={item.gambar_url || 'https://placehold.co/400x200?text=Reward'} alt={item.nama_reward} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-gray-700 shadow-sm">
                                      Stok: <span className={item.stok < 5 ? 'text-red-500' : 'text-green-600'}>{item.stok}</span>
                                    </div>
                                </div>
                                <div className="p-5 flex flex-col flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                       <p className="text-[10px] font-bold text-[#3E1C96] uppercase bg-indigo-50 px-2 py-0.5 rounded-md">{item.mitra_nama}</p>
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-1 group-hover:text-[#3E1C96] transition-colors">{item.nama_reward}</h3>
                                    <div className="flex items-center gap-1.5 text-[#F04438] font-extrabold text-lg mb-4">
                                        <Coins className="w-5 h-5 fill-current"/> {item.harga_poin}
                                    </div>
                                    <div className="mt-auto flex gap-2">
                                        <button onClick={() => handleOpenModal(item)} className="flex-1 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 font-bold text-sm hover:text-[#3E1C96] hover:border-[#3E1C96] transition-all"><Edit3 className="w-4 h-4 mx-auto"/></button>
                                        <button onClick={() => handleDeleteReward(item.id!)} className="flex-1 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 font-bold text-sm hover:text-[#F04438] hover:border-[#F04438] transition-all"><Trash2 className="w-4 h-4 mx-auto"/></button>
                                    </div>
                                </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* LIST VIEW */
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reward</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mitra</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Harga</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stok</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {filteredRewards.map((item, index) => (
                                <tr key={item.id} className={`hover:bg-purple-50/50 transition-all ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                  <td className="px-6 py-4 font-bold text-gray-800">{item.nama_reward}</td>
                                  <td className="px-6 py-4 text-sm text-gray-600">{item.mitra_nama}</td>
                                  <td className="px-6 py-4 font-bold text-[#F04438]">{item.harga_poin} Poin</td>
                                  <td className="px-6 py-4 text-sm font-bold">{item.stok}</td>
                                  <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <button onClick={() => handleOpenModal(item)} className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-[#3E1C96] hover:border-[#3E1C96] transition-all"><Edit3 className="w-4 h-4"/></button>
                                      <button onClick={() => handleDeleteReward(item.id!)} className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-[#F04438] hover:border-[#F04438] transition-all"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Tidak ada data reward.</p>
                    </div>
                  )}
                  
                  {/* Footer Table */}
                  {filteredRewards.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-400 uppercase">System v4.0</p>
                      <p className="text-sm text-gray-600">Total <span className="font-bold text-[#3E1C96]">{filteredRewards.length}</span> Items</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* --- TAB 2: VALIDASI VOUCHER --- */}
            {activeTab === 'validasi' && (
              <div className="p-0">
                 {/* Toolbar Validasi */}
                 <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8]">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <ScanBarcode className="w-6 h-6"/> Scanner Validasi
                    </h2>
                 </div>

                 <div className="p-8 min-h-[500px]">
                    {/* Big Search Input */}
                    <div className="max-w-2xl mx-auto mb-12">
                        <label className="block text-center text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">Input Kode Voucher User</label>
                        <div className="relative group shadow-xl shadow-purple-100 rounded-2xl">
                            <input 
                                type="text" 
                                placeholder="X99-ABC" 
                                className="w-full text-center text-3xl font-mono font-bold py-5 px-6 rounded-2xl border-2 border-gray-200 focus:border-[#3E1C96] focus:ring-4 focus:ring-purple-100 outline-none uppercase tracking-widest text-gray-800 transition-all placeholder-gray-300"
                                value={voucherCodeQuery}
                                onChange={(e) => setVoucherCodeQuery(e.target.value)}
                            />
                            <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none text-gray-300 group-focus-within:text-[#3E1C96] transition-colors">
                                <Search className="w-8 h-8"/>
                            </div>
                        </div>
                    </div>

                    {/* Result Card */}
                    <div className="max-w-3xl mx-auto space-y-4">
                        {loading ? (
                            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[#3E1C96]"/></div>
                        ) : filteredVouchers.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                 <Ticket className="w-16 h-16 mx-auto mb-4 opacity-20"/>
                                 <p className="font-medium">Kode voucher tidak ditemukan.</p>
                            </div>
                        ) : (
                            filteredVouchers.map((v) => (
                                <div key={v.id} className="bg-white rounded-3xl p-6 border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col md:flex-row items-center justify-between gap-6 transform hover:-translate-y-1">
                                    <div className="flex items-center gap-6 w-full md:w-auto">
                                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 border-2 ${v.status === 'sudah_dipakai' ? 'bg-gray-50 border-gray-200 text-gray-400' : 'bg-green-50 border-green-200 text-green-600'}`}>
                                            <Ticket className="w-10 h-10"/>
                                        </div>
                                        <div>
                                            <p className="text-3xl font-mono font-bold text-gray-800">{v.kode_unik}</p>
                                            <p className="text-lg font-bold text-[#3E1C96]">{v.reward_nama}</p>
                                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                                                <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md"><User className="w-3 h-3"/> {v.masyarakat?.nama}</span>
                                                <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md"><Calendar className="w-3 h-3"/> {new Date(v.created_at).toLocaleDateString('id-ID')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full md:w-auto text-center">
                                        {v.status === 'sudah_dipakai' ? (
                                            <span className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold text-sm border border-gray-200 cursor-not-allowed w-full md:w-auto justify-center">
                                                <CheckCircle2 className="w-5 h-5"/> SUDAH DIPAKAI
                                            </span>
                                        ) : (
                                            <button 
                                                onClick={() => handleValidateVoucher(v.id)}
                                                className="w-full md:w-auto px-8 py-3 bg-[#3E1C96] hover:bg-[#2e1572] text-white rounded-xl font-bold text-sm shadow-xl shadow-purple-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                            >
                                                <ScanBarcode className="w-5 h-5"/> Validasi Sekarang
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                 </div>
              </div>
            )}

          </div>
        </div>

        {/* --- MODAL POP UP (CRUD) --- */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             {/* Backdrop */}
             <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={handleCloseModal}></div>
             
             {/* Modal Content */}
             <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8] p-6 text-white flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                       {isEditing ? <Edit3 className="w-5 h-5"/> : <Plus className="w-5 h-5"/>}
                       {isEditing ? 'Edit Reward' : 'Tambah Reward Baru'}
                    </h3>
                    <button onClick={handleCloseModal} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                </div>

                <form onSubmit={handleSaveReward} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1 ml-1">Nama Reward</label>
                        <input 
                           type="text" required
                           value={formData.nama_reward} onChange={handleInputChange} 
                           name="nama_reward"
                           className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#3E1C96]/50 transition-all" 
                           placeholder="Contoh: Voucher Pulsa"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1 ml-1">Nama Mitra</label>
                            <input 
                               type="text" required
                               value={formData.mitra_nama} onChange={handleInputChange}
                               name="mitra_nama"
                               className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#3E1C96]/50 transition-all"
                               placeholder="Nama Toko"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1 ml-1">Stok Awal</label>
                            <input 
                               type="number" required
                               value={formData.stok} onChange={handleInputChange}
                               name="stok"
                               className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#3E1C96]/50 transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1 ml-1">Harga Poin</label>
                        <input 
                           type="number" required
                           value={formData.harga_poin} onChange={handleInputChange}
                           name="harga_poin"
                           className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-[#F04438] focus:outline-none focus:ring-2 focus:ring-[#3E1C96]/50 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1 ml-1">URL Gambar</label>
                        <input 
                           type="text" 
                           value={formData.gambar_url} onChange={handleInputChange}
                           name="gambar_url"
                           className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#3E1C96]/50 transition-all"
                           placeholder="https://..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1 ml-1">Deskripsi Singkat</label>
                        <textarea 
                           rows={3} 
                           value={formData.deskripsi} onChange={handleInputChange}
                           name="deskripsi"
                           className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#3E1C96]/50 transition-all resize-none"
                        ></textarea>
                    </div>

                    {/* Modal Actions */}
                    <div className="flex gap-3 pt-4">
                        <button 
                           type="button" 
                           onClick={handleCloseModal}
                           className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl transition-all"
                        >
                           Batal
                        </button>
                        <button 
                           type="submit" 
                           disabled={isSaving}
                           className="flex-[2] py-3 bg-[#3E1C96] hover:bg-[#2e1572] text-white font-bold rounded-xl shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-2"
                        >
                           {isSaving ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5"/>} Simpan
                        </button>
                    </div>
                </form>
             </div>
          </div>
        )}

      </div>
      <Footer />
    </>
  )
}