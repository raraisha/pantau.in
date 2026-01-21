'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { supabase } from '@/lib/supabase'
import { 
  Users, UserPlus, Search, Filter, MoreVertical, Edit2, Trash2, 
  Power, PowerOff, Eye, Phone, Mail, MapPin, Briefcase, Calendar,
  TrendingUp, AlertCircle, CheckCircle, Clock, X, Save, Loader2,
  Award, Activity, BarChart3, Download, Upload, RefreshCw, UserCheck
} from 'lucide-react'

type Petugas = {
  id_petugas: string
  id_dinas: string
  nama: string
  email: string
  telp?: string
  alamat?: string
  jabatan?: string
  beban_kerja: number
  status_aktif: boolean
  created_at: string
  updated_at?: string
}

export default function DinasPetugasManagement() {
  const [petugas, setPetugas] = useState<Petugas[]>([])
  const [filteredPetugas, setFilteredPetugas] = useState<Petugas[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'semua' | 'aktif' | 'nonaktif'>('semua')
  const [sortBy, setSortBy] = useState<'nama' | 'beban_kerja' | 'terbaru'>('nama')
  const [dinasInfo, setDinasInfo] = useState<any>(null)
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add')
  const [selectedPetugas, setSelectedPetugas] = useState<Petugas | null>(null)
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    telp: '',
    alamat: '',
    jabatan: ''
  })
  const [formErrors, setFormErrors] = useState<any>({})
  const [submitting, setSubmitting] = useState(false)

  // Dropdown menu state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    aktif: 0,
    nonaktif: 0,
    rataBebanKerja: 0,
    totalBebanKerja: 0
  })

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setDinasInfo(user)
    if (user.id) {
      fetchPetugas(user.id)
    }
  }, [])

  useEffect(() => {
    applyFilters()
  }, [petugas, searchQuery, filterStatus, sortBy])

  const fetchPetugas = async (idDinas: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('petugas')
        .select('*')
        .eq('id_dinas', idDinas)
        .order('created_at', { ascending: false })

      if (error) throw error

      setPetugas(data || [])
      calculateStats(data || [])
    } catch (err) {
      console.error('Error fetching petugas:', err)
      alert('Gagal memuat data petugas')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data: Petugas[]) => {
    const aktif = data.filter(p => p.status_aktif)
    const totalBeban = aktif.reduce((sum, p) => sum + (p.beban_kerja || 0), 0)
    
    setStats({
      total: data.length,
      aktif: aktif.length,
      nonaktif: data.filter(p => !p.status_aktif).length,
      rataBebanKerja: aktif.length > 0 ? Math.round(totalBeban / aktif.length * 10) / 10 : 0,
      totalBebanKerja: totalBeban
    })
  }

  const applyFilters = () => {
    let result = [...petugas]

    // Filter by status
    if (filterStatus === 'aktif') {
      result = result.filter(p => p.status_aktif)
    } else if (filterStatus === 'nonaktif') {
      result = result.filter(p => !p.status_aktif)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p => 
        p.nama.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query) ||
        p.telp?.toLowerCase().includes(query) ||
        p.jabatan?.toLowerCase().includes(query)
      )
    }

    // Sort
    if (sortBy === 'nama') {
      result.sort((a, b) => a.nama.localeCompare(b.nama))
    } else if (sortBy === 'beban_kerja') {
      result.sort((a, b) => (b.beban_kerja || 0) - (a.beban_kerja || 0))
    } else if (sortBy === 'terbaru') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    setFilteredPetugas(result)
  }

  const validateForm = () => {
    const errors: any = {}

    if (!formData.nama.trim()) {
      errors.nama = 'Nama wajib diisi'
    }

    if (!formData.email.trim()) {
      errors.email = 'Email wajib diisi'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Format email tidak valid'
    }

    if (formData.telp && !/^[0-9+\-\s()]+$/.test(formData.telp)) {
      errors.telp = 'Format nomor telepon tidak valid'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleOpenModal = (mode: 'add' | 'edit' | 'view', petugas?: Petugas) => {
    setModalMode(mode)
    setSelectedPetugas(petugas || null)
    
    if (mode === 'edit' && petugas) {
      setFormData({
        nama: petugas.nama,
        email: petugas.email,
        telp: petugas.telp || '',
        alamat: petugas.alamat || '',
        jabatan: petugas.jabatan || ''
      })
    } else if (mode === 'add') {
      setFormData({
        nama: '',
        email: '',
        telp: '',
        alamat: '',
        jabatan: ''
      })
    }
    
    setFormErrors({})
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedPetugas(null)
    setFormData({
      nama: '',
      email: '',
      telp: '',
      alamat: '',
      jabatan: ''
    })
    setFormErrors({})
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setSubmitting(true)
    try {
      if (modalMode === 'add') {
        // Add new petugas
        const { error } = await supabase
          .from('petugas')
          .insert({
            id_dinas: dinasInfo.id,
            nama: formData.nama,
            email: formData.email,
            telp: formData.telp || null,
            alamat: formData.alamat || null,
            jabatan: formData.jabatan || null,
            beban_kerja: 0,
            status_aktif: true
          })

        if (error) throw error
        alert('✅ Petugas berhasil ditambahkan!')
      } else if (modalMode === 'edit' && selectedPetugas) {
        // Update petugas
        const { error } = await supabase
          .from('petugas')
          .update({
            nama: formData.nama,
            email: formData.email,
            telp: formData.telp || null,
            alamat: formData.alamat || null,
            jabatan: formData.jabatan || null,
            updated_at: new Date().toISOString()
          })
          .eq('id_petugas', selectedPetugas.id_petugas)

        if (error) throw error
        alert('✅ Data petugas berhasil diperbarui!')
      }

      // Refresh data
      await fetchPetugas(dinasInfo.id)
      handleCloseModal()
    } catch (err: any) {
      console.error('Error saving petugas:', err)
      alert('❌ Gagal menyimpan data: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (petugas: Petugas) => {
    const newStatus = !petugas.status_aktif
    const confirmMsg = newStatus 
      ? `Aktifkan kembali petugas ${petugas.nama}?`
      : `Nonaktifkan petugas ${petugas.nama}? Petugas tidak akan menerima tugas baru.`
    
    if (!confirm(confirmMsg)) return

    try {
      const { error } = await supabase
        .from('petugas')
        .update({ 
          status_aktif: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id_petugas', petugas.id_petugas)

      if (error) throw error

      alert(`✅ Status petugas berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}!`)
      await fetchPetugas(dinasInfo.id)
    } catch (err: any) {
      console.error('Error toggling status:', err)
      alert('❌ Gagal mengubah status: ' + err.message)
    }
  }

  const handleDelete = async (petugas: Petugas) => {
    if (petugas.beban_kerja > 0) {
      alert('⚠️ Tidak dapat menghapus petugas yang masih memiliki tugas aktif!')
      return
    }

    if (!confirm(`⚠️ Hapus petugas ${petugas.nama}? Tindakan ini tidak dapat dibatalkan!`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('petugas')
        .delete()
        .eq('id_petugas', petugas.id_petugas)

      if (error) throw error

      alert('✅ Petugas berhasil dihapus!')
      await fetchPetugas(dinasInfo.id)
    } catch (err: any) {
      console.error('Error deleting petugas:', err)
      alert('❌ Gagal menghapus petugas: ' + err.message)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  const getBebanKerjaColor = (beban: number) => {
    if (beban === 0) return 'text-green-600 bg-green-100'
    if (beban <= 3) return 'text-blue-600 bg-blue-100'
    if (beban <= 6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    
    <div className="min-h-screen bg-gradient-to-br from-[#FDF7EE] via-[#f8f4ff] to-[#FDF7EE] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
              <Navbar />
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#3E1C96] to-[#F04438] mb-3">
                👥 Manajemen Petugas
              </h1>
              <p className="text-gray-600 text-lg">
                Kelola tim petugas lapangan dengan sistem terorganisir
              </p>
            </div>
            <button
              onClick={() => handleOpenModal('add')}
              className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8] text-white font-bold rounded-xl hover:shadow-xl transition-all hover:scale-105"
            >
              <UserPlus className="w-5 h-5" />
              Tambah Petugas
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 opacity-90" />
              <span className="text-4xl font-bold">{stats.total}</span>
            </div>
            <p className="text-purple-100 font-semibold text-sm">Total Petugas</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-500 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <UserCheck className="w-8 h-8 opacity-90" />
              <span className="text-4xl font-bold">{stats.aktif}</span>
            </div>
            <p className="text-green-100 font-semibold text-sm">Petugas Aktif</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-pink-500 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <PowerOff className="w-8 h-8 opacity-90" />
              <span className="text-4xl font-bold">{stats.nonaktif}</span>
            </div>
            <p className="text-red-100 font-semibold text-sm">Non-Aktif</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 opacity-90" />
              <span className="text-4xl font-bold">{stats.totalBebanKerja}</span>
            </div>
            <p className="text-blue-100 font-semibold text-sm">Total Tugas</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8 opacity-90" />
              <span className="text-4xl font-bold">{stats.rataBebanKerja}</span>
            </div>
            <p className="text-orange-100 font-semibold text-sm">Rata-rata Beban</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama, email, telepon, atau jabatan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3E1C96] focus:border-[#3E1C96] outline-none text-sm transition-all bg-white font-medium"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-6 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3E1C96] focus:border-[#3E1C96] outline-none text-sm font-semibold bg-white cursor-pointer hover:border-gray-300 transition-all"
            >
              <option value="nama">📝 Nama A-Z</option>
              <option value="beban_kerja">📊 Beban Kerja</option>
              <option value="terbaru">📅 Terbaru</option>
            </select>

            {/* Filter Status */}
            <div className="flex gap-2">
              {(['semua', 'aktif', 'nonaktif'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    filterStatus === status
                      ? 'bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8] text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'semua' ? 'Semua' : status === 'aktif' ? 'Aktif' : 'Non-Aktif'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Petugas List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-[#3E1C96] mb-4" />
            <p className="text-gray-600 font-medium">Memuat data petugas...</p>
          </div>
        ) : filteredPetugas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPetugas.map((p) => (
              <div
                key={p.id_petugas}
                className={`bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border-2 overflow-hidden hover:shadow-2xl transition-all hover:scale-[1.02] ${
                  p.status_aktif ? 'border-gray-200' : 'border-red-200 opacity-75'
                }`}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-white ${
                        p.status_aktif 
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                          : 'bg-gray-400'
                      }`}>
                        {p.nama.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{p.nama}</h3>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          p.status_aktif 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {p.status_aktif ? (
                            <><CheckCircle className="w-3 h-3" /> Aktif</>
                          ) : (
                            <><PowerOff className="w-3 h-3" /> Non-Aktif</>
                          )}
                        </span>
                      </div>
                    </div>
                    
                    {/* Actions Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setOpenDropdown(openDropdown === p.id_petugas ? null : p.id_petugas)}
                        className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                      </button>
                      
                      {openDropdown === p.id_petugas && (
                        <div className="absolute right-0 top-10 bg-white rounded-xl shadow-2xl border-2 border-gray-100 py-2 z-10 min-w-[180px]">
                          <button
                            onClick={() => {
                              handleOpenModal('view', p)
                              setOpenDropdown(null)
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Lihat Detail
                          </button>
                          <button
                            onClick={() => {
                              handleOpenModal('edit', p)
                              setOpenDropdown(null)
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm font-semibold text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit Data
                          </button>
                          <button
                            onClick={() => {
                              handleToggleStatus(p)
                              setOpenDropdown(null)
                            }}
                            className={`w-full px-4 py-2.5 text-left text-sm font-semibold hover:bg-opacity-10 flex items-center gap-2 ${
                              p.status_aktif ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'
                            }`}
                          >
                            {p.status_aktif ? (
                              <><PowerOff className="w-4 h-4" /> Nonaktifkan</>
                            ) : (
                              <><Power className="w-4 h-4" /> Aktifkan</>
                            )}
                          </button>
                          <hr className="my-2 border-gray-100" />
                          <button
                            onClick={() => {
                              handleDelete(p)
                              setOpenDropdown(null)
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                            disabled={p.beban_kerja > 0}
                          >
                            <Trash2 className="w-4 h-4" />
                            Hapus Petugas
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-3 mb-4">
                    {p.jabatan && (
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold text-gray-700">{p.jabatan}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 truncate">{p.email}</span>
                    </div>
                    {p.telp && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{p.telp}</span>
                      </div>
                    )}
                    {p.alamat && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span className="text-gray-600 line-clamp-2">{p.alamat}</span>
                      </div>
                    )}
                  </div>

                  {/* Beban Kerja */}
                  <div className={`flex items-center justify-between p-3 rounded-xl ${getBebanKerjaColor(p.beban_kerja)}`}>
                    <span className="text-sm font-bold">Beban Kerja</span>
                    <span className="text-2xl font-bold">{p.beban_kerja}</span>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Bergabung {formatDate(p.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/95 rounded-2xl shadow-xl">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Tidak Ada Petugas</h3>
            <p className="text-gray-600 mb-6">Belum ada petugas yang terdaftar atau sesuai dengan filter Anda.</p>
            <button
              onClick={() => handleOpenModal('add')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8] text-white font-bold rounded-xl hover:shadow-xl transition-all"
            >
              <UserPlus className="w-5 h-5" />
              Tambah Petugas Pertama
            </button>
          </div>
        )}

        {/* Summary */}
        {filteredPetugas.length > 0 && (
          <div className="mt-8 text-center text-gray-600 font-medium">
            <p>Menampilkan <span className="font-bold text-[#3E1C96] text-lg">{filteredPetugas.length}</span> dari <span className="font-bold text-[#3E1C96] text-lg">{petugas.length}</span> petugas</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8] text-white p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  {modalMode === 'add' && <><UserPlus className="w-6 h-6" /> Tambah Petugas Baru</>}
                  {modalMode === 'edit' && <><Edit2 className="w-6 h-6" /> Edit Data Petugas</>}
                  {modalMode === 'view' && <><Eye className="w-6 h-6" /> Detail Petugas</>}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {modalMode === 'view' && selectedPetugas ? (
                // View Mode
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl font-bold text-white">
                      {selectedPetugas.nama.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">{selectedPetugas.nama}</h3>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-1 ${
                        selectedPetugas.status_aktif 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {selectedPetugas.status_aktif ? (
                          <><CheckCircle className="w-3 h-3" /> Aktif</>
                        ) : (
                          <><PowerOff className="w-3 h-3" /> Non-Aktif</>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Mail className="w-4 h-4" />
                        <span className="font-semibold">Email</span>
                      </div>
                      <p className="text-gray-800 font-bold">{selectedPetugas.email}</p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Phone className="w-4 h-4" />
                        <span className="font-semibold">Telepon</span>
                      </div>
                      <p className="text-gray-800 font-bold">{selectedPetugas.telp || '-'}</p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Briefcase className="w-4 h-4" />
                        <span className="font-semibold">Jabatan</span>
                      </div>
                      <p className="text-gray-800 font-bold">{selectedPetugas.jabatan || '-'}</p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Activity className="w-4 h-4" />
                        <span className="font-semibold">Beban Kerja</span>
                      </div>
                      <p className="text-2xl font-bold text-[#3E1C96]">{selectedPetugas.beban_kerja} tugas</p>
                    </div>
                  </div>

                  {selectedPetugas.alamat && (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <MapPin className="w-4 h-4" />
                        <span className="font-semibold">Alamat</span>
                      </div>
                      <p className="text-gray-800 font-bold">{selectedPetugas.alamat}</p>
                    </div>
                  )}

                  <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                    <div className="flex items-center gap-2 text-blue-700 text-sm mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="font-semibold">Informasi Sistem</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Bergabung sejak: <span className="font-bold">{formatDate(selectedPetugas.created_at)}</span>
                    </p>
                    {selectedPetugas.updated_at && (
                      <p className="text-sm text-gray-600 mt-1">
                        Terakhir diperbarui: <span className="font-bold">{formatDate(selectedPetugas.updated_at)}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setModalMode('edit')
                        setFormData({
                          nama: selectedPetugas.nama,
                          email: selectedPetugas.email,
                          telp: selectedPetugas.telp || '',
                          alamat: selectedPetugas.alamat || '',
                          jabatan: selectedPetugas.jabatan || ''
                        })
                      }}
                      className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Edit2 className="w-5 h-5" />
                      Edit Data
                    </button>
                    <button
                      onClick={handleCloseModal}
                      className="flex-1 px-6 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              ) : (
                // Add/Edit Mode
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Nama Lengkap <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.nama}
                        onChange={(e) => setFormData({...formData, nama: e.target.value})}
                        placeholder="Masukkan nama lengkap petugas"
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#3E1C96] outline-none text-sm font-medium ${
                          formErrors.nama ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        }`}
                      />
                      {formErrors.nama && (
                        <p className="text-red-500 text-xs mt-1 font-semibold">{formErrors.nama}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="contoh@dinas.go.id"
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#3E1C96] outline-none text-sm font-medium ${
                          formErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        }`}
                      />
                      {formErrors.email && (
                        <p className="text-red-500 text-xs mt-1 font-semibold">{formErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Nomor Telepon
                      </label>
                      <input
                        type="text"
                        value={formData.telp}
                        onChange={(e) => setFormData({...formData, telp: e.target.value})}
                        placeholder="08xxxxxxxxxx"
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#3E1C96] outline-none text-sm font-medium ${
                          formErrors.telp ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        }`}
                      />
                      {formErrors.telp && (
                        <p className="text-red-500 text-xs mt-1 font-semibold">{formErrors.telp}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Jabatan
                      </label>
                      <input
                        type="text"
                        value={formData.jabatan}
                        onChange={(e) => setFormData({...formData, jabatan: e.target.value})}
                        placeholder="Contoh: Petugas Lapangan, Koordinator, Supervisor"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3E1C96] outline-none text-sm font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Alamat
                      </label>
                      <textarea
                        value={formData.alamat}
                        onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                        placeholder="Masukkan alamat lengkap petugas"
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3E1C96] outline-none text-sm font-medium resize-none"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-700 font-semibold">
                      ℹ️ Informasi: Petugas baru akan otomatis berstatus <span className="font-bold">Aktif</span> dengan beban kerja <span className="font-bold">0 tugas</span>.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleCloseModal}
                      className="flex-1 px-6 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex-1 px-6 py-3.5 bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8] text-white font-bold rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          {modalMode === 'add' ? 'Tambah Petugas' : 'Simpan Perubahan'}
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}