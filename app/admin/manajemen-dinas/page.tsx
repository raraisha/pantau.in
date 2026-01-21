'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { supabase } from '@/lib/supabase'
import { 
  Building2, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Loader2, 
  MapPin, 
  Phone,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Globe,
  LayoutGrid,
  List,
  AlertCircle,
  X,
  Save,
  MoreHorizontal
} from 'lucide-react'
import Swal from 'sweetalert2'

// Tipe Data
type Dinas = {
  id?: string
  nama_dinas: string
  kode_dinas: string
  telp: string
  email: string
}

export default function ManajemenDinas() {
  const [dinasList, setDinasList] = useState<Dinas[]>([])
  const [filtered, setFiltered] = useState<Dinas[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // State untuk Modal & Form
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Dinas>({
    nama_dinas: '',
    kode_dinas: '',
    telp: '',
    email: ''
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    AOS.init({ duration: 800, once: true })
    fetchDinas()
  }, [])

  useEffect(() => {
    const res = dinasList.filter(d => 
      d.nama_dinas.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.kode_dinas?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFiltered(res)
  }, [searchQuery, dinasList])

  const fetchDinas = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('dinas').select('*').order('nama_dinas')
      if (error) throw error
      setDinasList(data || [])
    } catch (err: any) {
      console.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  // --- HANDLERS UNTUK MODAL & CRUD ---

  const handleOpenModal = (dinas?: Dinas) => {
    if (dinas) {
      // Mode Edit
      setIsEditing(true)
      setCurrentId(dinas.id!)
      setFormData({
        nama_dinas: dinas.nama_dinas,
        kode_dinas: dinas.kode_dinas,
        telp: dinas.telp,
        email: dinas.email
      })
    } else {
      // Mode Tambah
      setIsEditing(false)
      setCurrentId(null)
      setFormData({ nama_dinas: '', kode_dinas: '', telp: '', email: '' })
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      if (isEditing && currentId) {
        // Update
        const { error } = await supabase
          .from('dinas')
          .update(formData)
          .eq('id', currentId)
        if (error) throw error
        Swal.fire('Berhasil!', 'Data instansi berhasil diperbarui.', 'success')
      } else {
        // Create
        const { error } = await supabase
          .from('dinas')
          .insert([formData])
        if (error) throw error
        Swal.fire('Berhasil!', 'Instansi baru berhasil ditambahkan.', 'success')
      }
      
      handleCloseModal()
      fetchDinas()
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Data yang dihapus tidak dapat dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#F04438',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    })

    if (result.isConfirmed) {
      try {
        const { error } = await supabase.from('dinas').delete().eq('id', id)
        if (error) throw error
        Swal.fire('Terhapus!', 'Data instansi telah dihapus.', 'success')
        fetchDinas()
      } catch (error: any) {
        Swal.fire('Gagal', error.message, 'error')
      }
    }
  }

  // --- STATISTIK UI ---
  const stats = [
    { id: 'total', label: 'Total Instansi', count: dinasList.length, icon: Building2, bg: 'bg-gradient-to-br from-purple-500 to-purple-600', text: 'text-purple-100' },
    { id: 'aktif', label: 'Dinas Aktif', count: dinasList.length, icon: ShieldCheck, bg: 'bg-gradient-to-br from-blue-500 to-cyan-500', text: 'text-blue-100' },
    { id: 'verif', label: 'Terverifikasi', count: dinasList.length, icon: TrendingUp, bg: 'bg-gradient-to-br from-green-500 to-emerald-500', text: 'text-green-100' },
  ]

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-[#FDF7EE] via-[#f8f4ff] to-[#FDF7EE] pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="mb-10" data-aos="fade-down">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#3E1C96] to-[#F04438] mb-3">
              🏛️ Direktori Dinas
            </h1>
            <p className="text-gray-600 text-lg max-w-3xl">
              Manajemen otoritas instansi pemerintah dan pengaturan akses sistem terpadu.
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

          {/* Main Container */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-100" data-aos="fade-up" data-aos-delay="100">
            
            {/* Toolbar */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8]">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  📂 Data Instansi
                </h2>

                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                  <div className="relative group w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#3E1C96] w-4 h-4 transition-colors" />
                    <input 
                      type="text"
                      placeholder="Cari Dinas..."
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
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="w-10 h-10 animate-spin text-[#3E1C96] mb-3" />
                <p className="text-gray-500 text-sm font-medium">Sinkronisasi Data...</p>
              </div>
            ) : filtered.length > 0 ? (
              <div className="p-0">
                {viewMode === 'list' ? (
                  // --- LIST VIEW ---
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Instansi</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Info Kontak</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Alamat</th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filtered.map((dinas, index) => (
                          <tr key={dinas.id} className={`hover:bg-purple-50/50 transition-all ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-[#3E1C96]">
                                  <Building2 className="w-5 h-5" />
                                </div>
                                <p className="font-bold text-[#3E1C96]">{dinas.nama_dinas}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold text-gray-500 flex items-center gap-1"><Globe className="w-3 h-3" /> {dinas.kode_dinas}</span>
                                <span className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {dinas.telp}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{dinas.email}</td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => handleOpenModal(dinas)} className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-[#3E1C96] hover:border-[#3E1C96] transition-all"><Edit3 className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(dinas.id!)} className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-[#F04438] hover:border-[#F04438] transition-all"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  // --- GRID VIEW (Dengan Button Detail yang Diminta) ---
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-gray-50/50">
                    {filtered.map((dinas) => (
                      <div key={dinas.id} className="group flex flex-col justify-between bg-white rounded-2xl p-6 border border-gray-100 hover:border-purple-200 shadow-sm hover:shadow-xl transition-all duration-300">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-[#3E1C96] group-hover:bg-[#3E1C96] group-hover:text-white transition-all">
                              <Building2 className="w-6 h-6" />
                            </div>
                            <button onClick={() => handleDelete(dinas.id!)} className="p-1.5 text-gray-300 hover:text-[#F04438] transition-colors"><Trash2 className="w-4 h-4"/></button>
                          </div>
                          
                          <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[#3E1C96] transition-colors line-clamp-2">
                            {dinas.nama_dinas}
                          </h3>

                          <div className="space-y-2 mb-6">
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
                              <Globe className="w-3.5 h-3.5" /> ID: {dinas.kode_dinas}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <MapPin className="w-3.5 h-3.5" /> <span className="truncate">{dinas.alamat}</span>
                            </div>
                          </div>
                        </div>

                        {/* BUTTON DETAIL INSTANSI (POP UP) */}
                        <button 
                          onClick={() => handleOpenModal(dinas)}
                          className="w-full relative overflow-hidden group/btn bg-white border-2 border-[#3E1C96] text-[#3E1C96] font-bold py-2.5 px-4 rounded-xl transition-all hover:text-white hover:shadow-lg hover:shadow-purple-900/20 active:scale-95"
                        >
                          <span className="relative z-10 flex items-center justify-center gap-2">
                             Detail Instansi <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                          </span>
                          <div className="absolute inset-0 h-full w-full scale-0 rounded-xl transition-all duration-300 group-hover/btn:scale-100 group-hover/btn:bg-[#3E1C96]"></div>
                        </button>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Data tidak ditemukan.</p>
              </div>
            )}
            
            {/* Footer Summary */}
            {filtered.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <p className="text-xs font-bold text-gray-400 uppercase">Directory v4.0</p>
                <p className="text-sm text-gray-600">Total <span className="font-bold text-[#3E1C96]">{filtered.length}</span> Data</p>
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
                
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8] p-6 text-white flex justify-between items-center">
                   <h3 className="text-xl font-bold flex items-center gap-2">
                      {isEditing ? <Edit3 className="w-5 h-5"/> : <Plus className="w-5 h-5"/>}
                      {isEditing ? 'Edit Data Instansi' : 'Tambah Instansi Baru'}
                   </h3>
                   <button onClick={handleCloseModal} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                      <X className="w-6 h-6" />
                   </button>
                </div>

                {/* Modal Form */}
                <form onSubmit={handleSave} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1 ml-1">Nama Instansi</label>
                    <input 
                      type="text" name="nama_dinas" required
                      value={formData.nama_dinas} onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#3E1C96]/50 focus:border-[#3E1C96] transition-all"
                      placeholder="Contoh: Dinas Kesehatan"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1 ml-1">Kode Dinas</label>
                      <input 
                        type="text" name="kode_dinas" required
                        value={formData.kode_dinas} onChange={handleInputChange}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#3E1C96]/50 transition-all"
                        placeholder="DNS-001"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1 ml-1">Kontak/Telp</label>
                      <input 
                        type="text" name="telp" 
                        value={formData.telp} onChange={handleInputChange}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#3E1C96]/50 transition-all"
                        placeholder="(021) 1234567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1 ml-1">Alamat Lengkap</label>
                    <textarea 
                      name="alamat" rows={3}
                      value={formData.alamat} onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#3E1C96]/50 transition-all resize-none"
                      placeholder="Alamat kantor dinas..."
                    />
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
                      {isSaving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" /> Menyimpan...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" /> Simpan Data
                        </>
                      )}
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