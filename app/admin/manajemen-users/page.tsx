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

type User = {
  id: string
  nama: string
  email: string
  password?: string
  created_at: string
}

type Petugas = {
  id: string
  nama: string
  email: string
  password?: string
  telp?: string
  created_at: string
}

type Admin = {
  id: string
  nama: string
  email: string
  password?: string
  created_at: string
}

type Laporan = {
  id: string
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

  const [users, setUsers] = useState<User[]>([])
  const [userForm, setUserForm] = useState({ nama: '', email: '', password: '' })
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [showUserPass, setShowUserPass] = useState(false)
  const [userHistory, setUserHistory] = useState<Laporan[]>([])

  const [petugas, setPetugas] = useState<Petugas[]>([])
  const [petugasForm, setPetugasForm] = useState({ nama: '', email: '', password: '', telp: '' })
  const [editingPetugasId, setEditingPetugasId] = useState<string | null>(null)
  const [showPetugasPass, setShowPetugasPass] = useState(false)
  const [petugasHistory, setPetugasHistory] = useState<Laporan[]>([])

  const [admins, setAdmins] = useState<Admin[]>([])
  const [adminForm, setAdminForm] = useState({ nama: '', email: '', password: '' })
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null)
  const [showAdminPass, setShowAdminPass] = useState(false)

  useEffect(() => {
    AOS.init({ duration: 800, once: true })
    fetchAllData()
  }, [])

  useEffect(() => {
    if (action === 'list') fetchData()
  }, [activeTab, action])

  const fetchAllData = async () => {
    try {
      const [userRes, petugasRes, adminRes] = await Promise.all([
        supabase.from('users').select('id'),
        supabase.from('petugas').select('id'),
        supabase.from('admins').select('id')
      ])
      setStats({
        user: userRes.data?.length || 0,
        petugas: petugasRes.data?.length || 0,
        admin: adminRes.data?.length || 0
      })
    } catch (err) {
      console.error(err)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'user') {
        const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false })
        setUsers(data || [])
      } else if (activeTab === 'petugas') {
        const { data } = await supabase.from('petugas').select('*').order('created_at', { ascending: false })
        setPetugas(data || [])
      } else if (activeTab === 'admin') {
        const { data } = await supabase.from('admins').select('*').order('created_at', { ascending: false })
        setAdmins(data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserHistory = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('laporan')
        .select('id, judul, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      setUserHistory(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const fetchPetugasHistory = async (petugasId: string) => {
    try {
      const { data } = await supabase
        .from('laporan')
        .select('id, judul, status, created_at')
        .eq('petugas_id', petugasId)
        .order('created_at', { ascending: false })
      setPetugasHistory(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const handleEditUser = async () => {
    if (!userForm.nama || !userForm.email) {
      setError('Nama dan email wajib diisi')
      return
    }
    setLoading(true)
    try {
      const updateData: any = { nama: userForm.nama, email: userForm.email }
      if (userForm.password) updateData.password = userForm.password
      const { error: err } = await supabase.from('users').update(updateData).eq('id', editingUserId)
      if (err) throw err
      setSuccess('User berhasil diupdate!')
      setUserForm({ nama: '', email: '', password: '' })
      setEditingUserId(null)
      setAction('list')
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Gagal update user')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Yakin hapus user ini?')) return
    try {
      await supabase.from('users').delete().eq('id', id)
      setSuccess('User berhasil dihapus!')
      fetchData()
      fetchAllData()
    } catch (err: any) {
      setError(err.message || 'Gagal hapus user')
    }
  }

  const handleEditPetugas = async () => {
    if (!petugasForm.nama || !petugasForm.email) {
      setError('Nama dan email wajib diisi')
      return
    }
    setLoading(true)
    try {
      const updateData: any = { nama: petugasForm.nama, email: petugasForm.email, telp: petugasForm.telp }
      if (petugasForm.password) updateData.password = petugasForm.password
      const { error: err } = await supabase.from('petugas').update(updateData).eq('id', editingPetugasId)
      if (err) throw err
      setSuccess('Petugas berhasil diupdate!')
      setPetugasForm({ nama: '', email: '', password: '', telp: '' })
      setEditingPetugasId(null)
      setAction('list')
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Gagal update petugas')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePetugas = async (id: string) => {
    if (!confirm('Yakin hapus petugas ini?')) return
    try {
      await supabase.from('petugas').delete().eq('id', id)
      setSuccess('Petugas berhasil dihapus!')
      fetchData()
      fetchAllData()
    } catch (err: any) {
      setError(err.message || 'Gagal hapus petugas')
    }
  }

  const handleEditAdmin = async () => {
    if (!adminForm.nama || !adminForm.email) {
      setError('Nama dan email wajib diisi')
      return
    }
    setLoading(true)
    try {
      const updateData: any = { nama: adminForm.nama, email: adminForm.email }
      if (adminForm.password) updateData.password = adminForm.password
      const { error: err } = await supabase.from('admins').update(updateData).eq('id', editingAdminId)
      if (err) throw err
      setSuccess('Admin berhasil diupdate!')
      setAdminForm({ nama: '', email: '', password: '' })
      setEditingAdminId(null)
      setAction('list')
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Gagal update admin')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm('Yakin hapus admin ini?')) return
    try {
      await supabase.from('admins').delete().eq('id', id)
      setSuccess('Admin berhasil dihapus!')
      fetchData()
      fetchAllData()
    } catch (err: any) {
      setError(err.message || 'Gagal hapus admin')
    }
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'menunggu': return 'bg-yellow-100 text-yellow-700'
      case 'diproses': return 'bg-blue-100 text-blue-700'
      case 'selesai': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

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
              Kelola akun user, petugas, dan admin dengan mudah dan aman.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8" data-aos="fade-up">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{stats.user}</span>
              </div>
              <p className="text-blue-100 font-medium">Total User</p>
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
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* List View */}
          {action === 'list' && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-100" data-aos="fade-up">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8]">
                <h2 className="text-2xl font-bold text-white">📂 Daftar {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-[#3E1C96]" />
                </div>
              ) : activeTab === 'user' && users.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-800 uppercase">Nama</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-800 uppercase">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-800 uppercase">Terdaftar</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-800 uppercase">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map((u, i) => (
                        <tr key={u.id} className={`hover:bg-purple-50/50 transition ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <td className="px-6 py-4 font-semibold text-gray-900">{u.nama}</td>
                          <td className="px-6 py-4 text-gray-800 flex items-center gap-2"><Mail className="w-4 h-4" /> {u.email}</td>
                          <td className="px-6 py-4 text-gray-800 text-sm">{formatDate(u.created_at)}</td>
                          <td className="px-6 py-4 text-center flex justify-center gap-2">
                            <button onClick={() => { fetchUserHistory(u.id); setAction('history'); clearError() }} className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200" title="Lihat history">
                              <History className="w-4 h-4" />
                            </button>
                            <button onClick={() => { startEditUser(u); clearError() }} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteUser(u.id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : activeTab === 'petugas' && petugas.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-800 uppercase">Nama</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-800 uppercase">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-800 uppercase">Terdaftar</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-800 uppercase">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {petugas.map((p, i) => (
                        <tr key={p.id} className={`hover:bg-purple-50/50 transition ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <td className="px-6 py-4 font-semibold text-gray-900">{p.nama}</td>
                          <td className="px-6 py-4 text-gray-800 flex items-center gap-2"><Mail className="w-4 h-4" /> {p.email}</td>
                          <td className="px-6 py-4 text-gray-800 flex items-center gap-2"><Phone className="w-4 h-4" /> {p.telp || '-'}</td>
                          <td className="px-6 py-4 text-gray-800 text-sm">{formatDate(p.created_at)}</td>
                          <td className="px-6 py-4 text-center flex justify-center gap-2">
                            <button onClick={() => { fetchPetugasHistory(p.id); setAction('history'); clearError() }} className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200" title="Lihat history">
                              <History className="w-4 h-4" />
                            </button>
                            <button onClick={() => { startEditPetugas(p); clearError() }} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeletePetugas(p.id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : activeTab === 'admin' && admins.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-800 uppercase">Nama</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-800 uppercase">Email</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-800 uppercase">Terdaftar</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-800 uppercase">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {admins.map((a, i) => (
                        <tr key={a.id} className={`hover:bg-purple-50/50 transition ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <td className="px-6 py-4 font-semibold text-gray-900">{a.nama}</td>
                          <td className="px-6 py-4 text-gray-800 flex items-center gap-2"><Mail className="w-4 h-4" /> {a.email}</td>
                          <td className="px-6 py-4 text-gray-800 text-sm">{formatDate(a.created_at)}</td>
                          <td className="px-6 py-4 text-center flex justify-center gap-2">
                            <button onClick={() => { startEditAdmin(a); clearError() }} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteAdmin(a.id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-800 font-medium">Belum ada data</p>
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
              ) : (activeTab === 'user' ? userHistory : petugasHistory).length > 0 ? (
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
                      {(activeTab === 'user' ? userHistory : petugasHistory).map((h, i) => (
                        <tr key={h.id} className={`hover:bg-purple-50/50 transition ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
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
                ✏️ Edit {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h2>

              <div className="space-y-5">
                {activeTab === 'user' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Nama *</label>
                      <input
                        type="text"
                        value={userForm.nama}
                        onChange={(e) => setUserForm({ ...userForm, nama: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#3E1C96] focus:ring-2 focus:ring-[#3E1C96]/20 outline-none transition-all text-gray-900"
                        placeholder="Masukkan nama"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Email *</label>
                      <input
                        type="email"
                        value={userForm.email}
                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#3E1C96] focus:ring-2 focus:ring-[#3E1C96]/20 outline-none transition-all text-gray-900"
                        placeholder="Masukkan email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Password (kosongkan jika tidak diubah)</label>
                      <div className="relative">
                        <input
                          type={showUserPass ? 'text' : 'password'}
                          value={userForm.password}
                          onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#3E1C96] focus:ring-2 focus:ring-[#3E1C96]/20 outline-none transition-all text-gray-900"
                          placeholder="Masukkan password"
                        />
                        <button
                          onClick={() => setShowUserPass(!showUserPass)}
                          className="absolute right-4 top-3.5 text-gray-600 hover:text-gray-800"
                        >
                          {showUserPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'petugas' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Nama *</label>
                      <input
                        type="text"
                        value={petugasForm.nama}
                        onChange={(e) => setPetugasForm({ ...petugasForm, nama: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#3E1C96] focus:ring-2 focus:ring-[#3E1C96]/20 outline-none transition-all text-gray-900"
                        placeholder="Masukkan nama"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Email *</label>
                      <input
                        type="email"
                        value={petugasForm.email}
                        onChange={(e) => setPetugasForm({ ...petugasForm, email: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#3E1C96] focus:ring-2 focus:ring-[#3E1C96]/20 outline-none transition-all text-gray-900"
                        placeholder="Masukkan email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">No. Telepon</label>
                      <input
                        type="text"
                        value={petugasForm.telp}
                        onChange={(e) => setPetugasForm({ ...petugasForm, telp: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#3E1C96] focus:ring-2 focus:ring-[#3E1C96]/20 outline-none transition-all text-gray-900"
                        placeholder="Masukkan nomor telepon"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Password (kosongkan jika tidak diubah)</label>
                      <div className="relative">
                        <input
                          type={showPetugasPass ? 'text' : 'password'}
                          value={petugasForm.password}
                          onChange={(e) => setPetugasForm({ ...petugasForm, password: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#3E1C96] focus:ring-2 focus:ring-[#3E1C96]/20 outline-none transition-all text-gray-900"
                          placeholder="Masukkan password"
                        />
                        <button
                          onClick={() => setShowPetugasPass(!showPetugasPass)}
                          className="absolute right-4 top-3.5 text-gray-600 hover:text-gray-800"
                        >
                          {showPetugasPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'admin' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Nama *</label>
                      <input
                        type="text"
                        value={adminForm.nama}
                        onChange={(e) => setAdminForm({ ...adminForm, nama: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#3E1C96] focus:ring-2 focus:ring-[#3E1C96]/20 outline-none transition-all text-gray-900"
                        placeholder="Masukkan nama"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Email *</label>
                      <input
                        type="email"
                        value={adminForm.email}
                        onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#3E1C96] focus:ring-2 focus:ring-[#3E1C96]/20 outline-none transition-all text-gray-900"
                        placeholder="Masukkan email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Password (kosongkan jika tidak diubah)</label>
                      <div className="relative">
                        <input
                          type={showAdminPass ? 'text' : 'password'}
                          value={adminForm.password}
                          onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#3E1C96] focus:ring-2 focus:ring-[#3E1C96]/20 outline-none transition-all text-gray-900"
                          placeholder="Masukkan password"
                        />
                        <button
                          onClick={() => setShowAdminPass(!showAdminPass)}
                          className="absolute right-4 top-3.5 text-gray-600 hover:text-gray-800"
                        >
                          {showAdminPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => { setAction('list'); clearError() }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    if (activeTab === 'user') handleEditUser()
                    else if (activeTab === 'petugas') handleEditPetugas()
                    else handleEditAdmin()
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Update
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )

  function startEditUser(u: User) {
    setUserForm({ nama: u.nama, email: u.email, password: '' })
    setEditingUserId(u.id)
    setAction('edit')
  }

  function startEditPetugas(p: Petugas) {
    setPetugasForm({ nama: p.nama, email: p.email, password: '', telp: p.telp || '' })
    setEditingPetugasId(p.id)
    setAction('edit')
  }

  function startEditAdmin(a: Admin) {
    setAdminForm({ nama: a.nama, email: a.email, password: '' })
    setEditingAdminId(a.id)
    setAction('edit')
  }

  function clearError() {
    setError('')
    setSuccess('')
  }
}