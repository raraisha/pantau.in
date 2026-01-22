'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { supabase } from '@/lib/supabase'
import { Users, UserCheck, Shield, Loader2, AlertCircle, CheckCircle, Edit2, Trash2, Eye, EyeOff, Mail, Phone, History, ArrowLeft } from 'lucide-react'

type TabType = 'user' | 'petugas' | 'admin'
type ActionType = 'list' | 'edit' | 'history'

// --- TIPE DATA SESUAI SCHEMA DATABASE BARU ---
type Masyarakat = {
  id_masyarakat: string // Primary Key di tabel masyarakat
  nama: string
  email: string
  telp?: string
  created_at: string
}

type Petugas = {
  id_petugas: string // Primary Key
  nama: string
  email: string
  telp?: string
  created_at: string
}

type Admin = {
  id_admin: string // Primary Key
  nama: string
  email: string
  created_at: string
}

type Laporan = {
  id_laporan: string
  judul: string
  status: string
  created_at: string
}

export default function KelolaAkun() {
  const [activeTab, setActiveTab] = useState<TabType>('user')
  const [action, setAction] = useState<ActionType>('list')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [stats, setStats] = useState({ user: 0, petugas: 0, admin: 0 })

  // State Data
  const [masyarakatList, setMasyarakatList] = useState<Masyarakat[]>([])
  const [petugasList, setPetugasList] = useState<Petugas[]>([])
  const [adminList, setAdminList] = useState<Admin[]>([])

  // State Form
  const [formData, setFormData] = useState({ nama: '', email: '', password: '', telp: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [showPass, setShowPass] = useState(false)
  const [historyLaporan, setHistoryLaporan] = useState<Laporan[]>([])

  useEffect(() => {
    AOS.init({ duration: 800, once: true })
    fetchAllStats()
  }, [])

  useEffect(() => {
    if (action === 'list') fetchData()
  }, [activeTab, action])

  // --- 1. FETCH STATISTIK ---
  const fetchAllStats = async () => {
    try {
      const [resMasyarakat, resPetugas, resAdmin] = await Promise.all([
        supabase.from('masyarakat').select('id_masyarakat', { count: 'exact', head: true }),
        supabase.from('petugas').select('id_petugas', { count: 'exact', head: true }),
        supabase.from('admin').select('id_admin', { count: 'exact', head: true })
      ])
      setStats({
        user: resMasyarakat.count || 0,
        petugas: resPetugas.count || 0,
        admin: resAdmin.count || 0
      })
    } catch (err) {
      console.error(err)
    }
  }

  // --- 2. FETCH DATA UTAMA ---
  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'user') {
        // Fetch Tabel Masyarakat
        const { data, error } = await supabase
          .from('masyarakat')
          .select('id_masyarakat, nama, email, telp, created_at')
          .order('created_at', { ascending: false })
        
        if(error) throw error
        setMasyarakatList(data || [])

      } else if (activeTab === 'petugas') {
        // Fetch Tabel Petugas
        const { data, error } = await supabase
          .from('petugas')
          .select('id_petugas, nama, email, telp, created_at')
          .order('created_at', { ascending: false })

        if(error) throw error
        setPetugasList(data || [])

      } else if (activeTab === 'admin') {
        // Fetch Tabel Admin
        const { data, error } = await supabase
          .from('admin') // Nama tabel: admin (bukan admins)
          .select('id_admin, nama, email, created_at')
          .order('created_at', { ascending: false })

        if(error) throw error
        setAdminList(data || [])
      }
    } catch (err: any) {
      console.error(err)
      setError("Gagal mengambil data: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  // --- 3. FETCH HISTORY LAPORAN ---
  const fetchHistory = async (id: string) => {
    try {
      let query = supabase.from('laporan').select('id_laporan, judul, status, created_at').order('created_at', { ascending: false })
      
      // Sesuaikan kolom foreign key di tabel laporan
      if (activeTab === 'user') {
        query = query.eq('id_masyarakat', id) // Pastikan di tabel laporan namanya id_masyarakat
      } else if (activeTab === 'petugas') {
        // Petugas mungkin pakai tabel 'laporan_petugas' atau kolom 'id_petugas' di laporan (sesuaikan relasi)
        // Disini saya asumsikan ambil dari tabel laporan yang ditangani petugas
        // Kalau relasinya many-to-many, logic ini perlu disesuaikan.
        // Untuk simpelnya, kita kosongkan dulu kalau struktur relasi petugas-laporan belum fix.
        setHistoryLaporan([]) 
        return
      }

      const { data, error } = await query
      if (error) throw error
      setHistoryLaporan(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  // --- 4. CRUD HANDLERS ---
  
  const startEdit = (data: any) => {
    // Mapping data ke form
    setFormData({
        nama: data.nama,
        email: data.email,
        telp: data.telp || '',
        password: '' // Kosongkan password saat edit
    })
    // Mapping ID (karena tabel masyarakat pakai id_masyarakat, sisanya id)
    setEditingId(activeTab === 'user' ? data.id_masyarakat : data.id)
    setAction('edit')
    setError('')
  }

  const handleDelete = async (id: string) => {
    if (!confirm(`Yakin hapus ${activeTab} ini?`)) return
    
    try {
      let table = ''
      let pk = 'id'

      if (activeTab === 'user') { table = 'masyarakat'; pk = 'id_masyarakat' }
      else if (activeTab === 'petugas') { table = 'petugas'; pk = 'id' }
      else { table = 'admin'; pk = 'id' }

      const { error } = await supabase.from(table).delete().eq(pk, id)
      if (error) throw error

      setSuccess('Data berhasil dihapus!')
      fetchData()
      fetchAllStats()
    } catch (err: any) {
      setError(err.message || 'Gagal hapus data')
    }
  }

  const handleSaveEdit = async () => {
    if (!formData.nama || !formData.email) {
      setError('Nama dan email wajib diisi')
      return
    }
    setLoading(true)
    
    try {
      const updatePayload: any = { 
          nama: formData.nama, 
          email: formData.email 
      }
      
      // Tambah field telp jika bukan admin
      if (activeTab !== 'admin') {
          updatePayload.telp = formData.telp
      }

      // Hanya update password jika diisi
      if (formData.password) {
          updatePayload.password = formData.password
      }

      let table = ''
      let pk = 'id'

      if (activeTab === 'user') { table = 'masyarakat'; pk = 'id_masyarakat' }
      else if (activeTab === 'petugas') { table = 'petugas'; pk = 'id' }
      else { table = 'admin'; pk = 'id' }

      const { error: err } = await supabase
        .from(table)
        .update(updatePayload)
        .eq(pk, editingId)

      if (err) throw err

      setSuccess('Data berhasil diupdate!')
      setFormData({ nama: '', email: '', password: '', telp: '' })
      setEditingId(null)
      setAction('list')
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Gagal update data')
    } finally {
      setLoading(false)
    }
  }

  // Helper UI
  const formatDate = (date: string) => new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'menunggu': return 'bg-yellow-100 text-yellow-700'
      case 'diproses': return 'bg-blue-100 text-blue-700'
      case 'selesai': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const clearError = () => { setError(''); setSuccess('') }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-[#FDF7EE] via-[#f8f4ff] to-[#FDF7EE] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-10" data-aos="fade-down">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#3E1C96] to-[#F04438] mb-3">
              🔐 Manajemen Akun
            </h1>
            <p className="text-gray-800 text-lg max-w-3xl font-medium">
              Kelola akun masyarakat, petugas, dan admin dengan mudah dan aman.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8" data-aos="fade-up">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{stats.user}</span>
              </div>
              <p className="text-blue-100 font-medium">Total Masyarakat</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <UserCheck className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{stats.petugas}</span>
              </div>
              <p className="text-purple-100 font-medium">Total Petugas</p>
            </div>

            <div className="bg-gradient-to-br from-pink-500 to-rose-500 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <Shield className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{stats.admin}</span>
              </div>
              <p className="text-pink-100 font-medium">Total Admin</p>
            </div>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2" data-aos="fade-down">
              <AlertCircle className="w-5 h-5" /> {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2" data-aos="fade-down">
              <CheckCircle className="w-5 h-5" /> {success}
            </div>
          )}

          {/* Tabs */}
          {action === 'list' && (
            <div className="flex gap-3 mb-8" data-aos="fade-up" data-aos-delay="100">
              {(['user', 'petugas', 'admin'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setAction('list'); clearError() }}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8] text-white shadow-lg'
                      : 'bg-white text-gray-800 hover:shadow-md'
                  }`}
                >
                  {tab === 'user' ? <Users className="w-5 h-5" /> : tab === 'petugas' ? <UserCheck className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                  {tab === 'user' ? 'Masyarakat' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* List View */}
          {action === 'list' && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-100" data-aos="fade-up">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8]">
                <h2 className="text-2xl font-bold text-white">📂 Daftar {activeTab === 'user' ? 'Masyarakat' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-[#3E1C96]" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-800 uppercase">Nama</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-800 uppercase">Email</th>
                        {activeTab !== 'admin' && <th className="px-6 py-4 text-left text-xs font-semibold text-gray-800 uppercase">Telepon</th>}
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-800 uppercase">Terdaftar</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-800 uppercase">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(activeTab === 'user' ? masyarakatList : activeTab === 'petugas' ? petugasList : adminList).length === 0 ? (
                         <tr><td colSpan={5} className="p-8 text-center text-gray-500">Data kosong</td></tr>
                      ) : (
                        (activeTab === 'user' ? masyarakatList : activeTab === 'petugas' ? petugasList : adminList).map((item: any, i) => (
                            <tr key={item.id || item.id_masyarakat} className={`hover:bg-purple-50/50 transition ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                            <td className="px-6 py-4 font-semibold text-gray-900">{item.nama}</td>
                            <td className="px-6 py-4 text-gray-800 flex items-center gap-2"><Mail className="w-4 h-4" /> {item.email}</td>
                            {activeTab !== 'admin' && (
                                <td className="px-6 py-4 text-gray-800"><span className="flex items-center gap-2"><Phone className="w-4 h-4" /> {item.telp || '-'}</span></td>
                            )}
                            <td className="px-6 py-4 text-gray-800 text-sm">{formatDate(item.created_at)}</td>
                            <td className="px-6 py-4 text-center flex justify-center gap-2">
                                {activeTab === 'user' && (
                                    <button onClick={() => { fetchHistory(item.id_masyarakat); setAction('history'); clearError() }} className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200" title="Lihat history">
                                    <History className="w-4 h-4" />
                                    </button>
                                )}
                                <button onClick={() => { startEdit(item); clearError() }} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200">
                                <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(activeTab === 'user' ? item.id_masyarakat : item.id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                                <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                            </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* History View */}
          {action === 'history' && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-100" data-aos="fade-up">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8]">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">📋 History Laporan</h2>
                  <button onClick={() => { setAction('list'); clearError() }} className="flex items-center gap-2 bg-white text-[#3E1C96] px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all">
                    <ArrowLeft className="w-5 h-5" /> Kembali
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-[#3E1C96]" />
                </div>
              ) : historyLaporan.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-800 uppercase">Judul Laporan</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-800 uppercase">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-800 uppercase">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {historyLaporan.map((h, i) => (
                        <tr key={h.id_laporan} className={`hover:bg-purple-50/50 transition ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <td className="px-6 py-4 font-semibold text-gray-900">{h.judul}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(h.status)}`}>
                              {h.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-800 text-sm">{formatDate(h.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-800 font-medium">Belum ada history laporan</p>
                </div>
              )}
            </div>
          )}

          {/* Form Edit */}
          {action === 'edit' && (
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 max-w-2xl mx-auto" data-aos="fade-up">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                ✏️ Edit {activeTab === 'user' ? 'Masyarakat' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h2>

              <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Nama *</label>
                    <input
                      type="text"
                      value={formData.nama}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#3E1C96] focus:ring-2 focus:ring-[#3E1C96]/20 outline-none transition-all text-gray-900"
                      placeholder="Masukkan nama"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#3E1C96] focus:ring-2 focus:ring-[#3E1C96]/20 outline-none transition-all text-gray-900"
                      placeholder="Masukkan email"
                    />
                  </div>
                  
                  {activeTab !== 'admin' && (
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">No. Telepon</label>
                        <input
                        type="text"
                        value={formData.telp}
                        onChange={(e) => setFormData({ ...formData, telp: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#3E1C96] focus:ring-2 focus:ring-[#3E1C96]/20 outline-none transition-all text-gray-900"
                        placeholder="Masukkan nomor telepon"
                        />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Password (kosongkan jika tidak diubah)</label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#3E1C96] focus:ring-2 focus:ring-[#3E1C96]/20 outline-none transition-all text-gray-900"
                        placeholder="Masukkan password"
                      />
                      <button
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-4 top-3.5 text-gray-600 hover:text-gray-800"
                      >
                        {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => { setAction('list'); clearError() }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Simpan Perubahan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}