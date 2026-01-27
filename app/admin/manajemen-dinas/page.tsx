'use client'

import { useEffect, useState, KeyboardEvent } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import { 
  Building2, Plus, Search, Trash2, Edit3, Loader2, 
  LayoutGrid, List, AlertCircle,
  X, Save, Tag, Hash, Mail, ArrowLeft, Phone
} from 'lucide-react'
import Swal from 'sweetalert2'

// --- TIPE DATA ---
type Dinas = {
  id?: string
  nama_dinas: string
  id_dinas: string 
  telp: string
  email: string
  alamat: string
  kata_kunci: string[] 
}

type ActionType = 'list' | 'form'

export default function ManajemenDinas() {
  // State Data
  const [dinasList, setDinasList] = useState<Dinas[]>([])
  const [filtered, setFiltered] = useState<Dinas[]>([])
  const [loading, setLoading] = useState(true)
  
  // State UI & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [action, setAction] = useState<ActionType>('list')
  
  // State Form
  const [isEditing, setIsEditing] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [formData, setFormData] = useState({
    nama_dinas: '',
    id_dinas: '',
    telp: '',
    email: '',
    alamat: '',
  })

  // --- EFFECT ---
  useEffect(() => {
    // AOS DIHAPUS DISINI
    fetchDinas()
  }, [])

  useEffect(() => {
    const query = searchQuery.toLowerCase()
    const res = dinasList.filter(d => 
      (d.nama_dinas || '').toLowerCase().includes(query) ||
      (d.id_dinas || '').toLowerCase().includes(query) ||
      (Array.isArray(d.kata_kunci) ? d.kata_kunci.join(' ').toLowerCase().includes(query) : false)
    )
    setFiltered(res)
  }, [searchQuery, dinasList])

  // --- FETCH DATA ---
  const fetchDinas = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('dinas')
        .select('*')
        .order('nama_dinas', { ascending: true })
      
      if (error) throw error
      setDinasList(data || [])
    } catch (err: any) {
      console.error('Error fetching dinas:', err)
      Swal.fire('Error', 'Gagal memuat data dinas', 'error')
    } finally {
      setLoading(false)
    }
  }

  // --- HANDLERS ---
  const handleOpenForm = (dinas?: Dinas) => {
    if (dinas) {
      setIsEditing(true)
      setCurrentId(dinas.id!)
      setFormData({
        nama_dinas: dinas.nama_dinas || '',
        id_dinas: dinas.id_dinas || '',
        telp: dinas.telp || '',
        email: dinas.email || '',
        alamat: dinas.alamat || '',
      })
      setTags(Array.isArray(dinas.kata_kunci) ? dinas.kata_kunci : [])
    } else {
      setIsEditing(false)
      setCurrentId(null)
      setTags([])
      setFormData({ nama_dinas: '', id_dinas: '', telp: '', email: '', alamat: '' })
    }
    setAction('form')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const dataToSave = { ...formData, kata_kunci: tags }

      if (isEditing && currentId) {
        const { error } = await supabase.from('dinas').update(dataToSave).eq('id', currentId)
        if (error) throw error
        Swal.fire('Berhasil!', 'Data instansi diperbarui.', 'success')
      } else {
        const { error } = await supabase.from('dinas').insert([dataToSave])
        if (error) throw error
        Swal.fire('Berhasil!', 'Instansi ditambahkan.', 'success')
      }
      
      setAction('list')
      fetchDinas()
    } catch (error: any) {
      Swal.fire('Gagal', error.message, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (dbId: string) => {
    const result = await Swal.fire({
      title: 'Hapus Instansi?',
      text: "Data tidak bisa dikembalikan setelah dihapus!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#F04438',
      confirmButtonText: 'Ya, Hapus!'
    })

    if (result.isConfirmed) {
      try {
        const { error } = await supabase.from('dinas').delete().eq('id', dbId)
        if (error) throw error
        fetchDinas()
        Swal.fire('Terhapus!', 'Data instansi telah dihapus.', 'success')
      } catch (error: any) {
        Swal.fire('Gagal', error.message, 'error')
      }
    }
  }

  // Logic Tag Input
  const addTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
      setTagInput('')
    }
  }
  const removeTag = (idx: number) => {
    setTags(tags.filter((_, i) => i !== idx))
  }
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-[#FDF7EE] via-[#f8f4ff] to-[#FDF7EE] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#3E1C96] to-[#F04438] mb-3 leading-tight">
              🏛️ Direktori Dinas
            </h1>
            <p className="text-gray-800 text-lg max-w-3xl font-medium">
              Manajemen instansi pemerintah dan pengaturan kata kunci cerdas untuk optimasi laporan.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-3xl shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <Building2 className="w-10 h-10 opacity-80" />
                <span className="text-4xl font-black">{dinasList.length}</span>
              </div>
              <p className="text-blue-100 font-bold uppercase tracking-wider text-xs">Total Instansi</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white p-6 rounded-3xl shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <Tag className="w-10 h-10 opacity-80" />
                <span className="text-4xl font-black">
                  {dinasList.reduce((acc, curr) => acc + (curr.kata_kunci?.length || 0), 0)}
                </span>
              </div>
              <p className="text-purple-100 font-bold uppercase tracking-wider text-xs">Total Kata Kunci</p>
            </div>
            
            <div 
              className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-center items-center cursor-pointer hover:scale-105 transition-transform" 
              onClick={() => handleOpenForm()}
            >
               <Plus className="w-8 h-8 mb-1" />
               <p className="font-black text-sm uppercase tracking-widest">Tambah Dinas Baru</p>
            </div>
          </div>

          {/* Search Bar Section */}
          {action === 'list' && (
            <div className="flex flex-col md:flex-row gap-4 mb-8 items-center">
               <div className="relative flex-1 group w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#3E1C96] w-5 h-5 transition-colors" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    placeholder="Cari nama dinas, kode, atau kata kunci..." 
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-transparent focus:border-[#3E1C96]/20 rounded-2xl shadow-lg outline-none text-gray-800 font-medium transition-all"
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
               <div className="flex bg-white p-1.5 rounded-2xl shadow-md border border-gray-100">
                  <button onClick={() => setViewMode('grid')} className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${viewMode === 'grid' ? 'bg-[#3E1C96] text-white shadow-lg' : 'text-gray-400'}`}>
                    <LayoutGrid className="w-4 h-4"/> <span className="text-xs font-bold uppercase">Grid</span>
                  </button>
                  <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-[#3E1C96] text-white shadow-lg' : 'text-gray-400'}`}>
                    <List className="w-4 h-4"/> <span className="text-xs font-bold uppercase">List</span>
                  </button>
               </div>
            </div>
          )}

          {/* MAIN CONTENT AREA */}
          {action === 'list' ? (
            <div className="min-h-[400px]">
              {loading ? (
                <div className="flex flex-col justify-center items-center py-24">
                  <Loader2 className="w-12 h-12 animate-spin text-[#3E1C96] mb-4" />
                  <p className="text-gray-500 font-bold animate-pulse">Menghubungkan ke Database...</p>
                </div>
              ) : filtered.length > 0 ? (
                viewMode === 'grid' ? (
                  /* --- GRID VIEW --- */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((dinas) => (
                      <div 
                        key={dinas.id}
                        className="group bg-white rounded-[32px] p-8 shadow-xl hover:shadow-2xl transition-all border border-gray-100 flex flex-col justify-between relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-[80px] -mr-8 -mt-8 transition-all group-hover:bg-[#3E1C96] group-hover:opacity-10 opacity-50"></div>
                        <div>
                          <div className="flex justify-between items-start mb-6">
                            <div className="w-14 h-14 bg-gradient-to-br from-[#3E1C96] to-[#5B2CB8] rounded-2xl flex items-center justify-center text-white shadow-lg">
                              <Building2 className="w-7 h-7"/>
                            </div>
                            <div className="flex gap-2">
                               <button onClick={() => handleOpenForm(dinas)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Edit3 className="w-4 h-4"/></button>
                               <button onClick={() => handleDelete(dinas.id!)} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-4 h-4"/></button>
                            </div>
                          </div>
                          <h3 className="font-black text-[#1A0B42] text-xl mb-1 group-hover:text-[#3E1C96] transition-colors uppercase tracking-tight leading-tight">{dinas.nama_dinas}</h3>
                          <div className="flex items-center gap-2 text-[10px] font-black text-purple-400 mb-5 tracking-[0.2em] uppercase">
                            <Hash className="w-3 h-3"/> {dinas.id_dinas}
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-8">
                             {Array.isArray(dinas.kata_kunci) && dinas.kata_kunci.length > 0 ? (
                               dinas.kata_kunci.slice(0, 6).map((tag, i) => (
                                 <span key={`${dinas.id}-tag-${i}`} className="text-[9px] bg-gray-50 text-gray-600 font-black px-2.5 py-1.5 rounded-lg border border-gray-100 uppercase tracking-tighter">
                                   #{tag}
                                 </span>
                               ))
                             ) : <span className="text-[10px] text-gray-300 italic">No keywords set</span>}
                             {dinas.kata_kunci && dinas.kata_kunci.length > 6 && (
                                <span className="text-[9px] text-gray-400 font-bold self-center">+{dinas.kata_kunci.length - 6}</span>
                             )}
                          </div>
                        </div>
                        <div className="pt-5 border-t border-gray-50 space-y-2.5 text-xs text-gray-500 font-bold uppercase tracking-wider">
                            <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-[#3E1C96]"/> {dinas.telp || '-'}</div>
                            <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-[#F04438]"/> <span className="lowercase truncate">{dinas.email || '-'}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* --- TABLE VIEW --- */
                  <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden border border-gray-100">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr className="text-[10px] uppercase text-gray-400 font-black tracking-[0.2em]">
                          <th className="py-5 px-8">Instansi & Kontak</th>
                          <th className="py-5 px-8">Kata Kunci Utama</th>
                          <th className="py-5 px-8 text-center">Manajemen</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filtered.map((dinas) => (
                          <tr key={dinas.id} className="hover:bg-purple-50/30 transition-colors group">
                            <td className="py-6 px-8">
                              <p className="font-black text-gray-900 group-hover:text-[#3E1C96] transition-colors uppercase tracking-tight">{dinas.nama_dinas}</p>
                              <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400 font-bold tracking-widest uppercase">
                                <span>{dinas.id_dinas}</span>
                                <span>•</span>
                                <span className="lowercase">{dinas.email || '-'}</span>
                              </div>
                            </td>
                            <td className="py-6 px-8">
                              <div className="flex flex-wrap gap-1 max-w-[350px]">
                                {Array.isArray(dinas.kata_kunci) ? dinas.kata_kunci.slice(0, 4).map((tag, i) => (
                                  <span key={`table-tag-${dinas.id}-${i}`} className="text-[9px] bg-white border border-gray-200 px-2 py-1 rounded-md font-black text-gray-500 uppercase">#{tag}</span>
                                )) : '-'}
                              </div>
                            </td>
                            <td className="py-6 px-8">
                              <div className="flex justify-center gap-3">
                                <button onClick={() => handleOpenForm(dinas)} className="p-3 bg-white shadow-sm border border-gray-100 rounded-xl text-[#3E1C96] hover:bg-[#3E1C96] hover:text-white transition-all"><Edit3 size={16}/></button>
                                <button onClick={() => handleDelete(dinas.id!)} className="p-3 bg-white shadow-sm border border-gray-100 rounded-xl text-red-600 hover:bg-red-600 hover:text-white transition-all"><Trash2 size={16}/></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                /* --- EMPTY STATE --- */
                <div className="py-32 text-center bg-white/50 rounded-[40px] border-4 border-dashed border-gray-200">
                  <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg font-bold uppercase tracking-widest">Data Tidak Ditemukan</p>
                  <button onClick={() => setSearchQuery('')} className="mt-4 text-[#3E1C96] font-bold text-sm hover:underline">Reset Pencarian</button>
                </div>
              )}
            </div>
          ) : (
            /* --- FORM VIEW --- */
            <div className="max-w-3xl mx-auto bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8] flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">{isEditing ? '✏️ Edit Data Instansi' : '🏛️ Registrasi Dinas Baru'}</h2>
                  <p className="text-purple-100 text-sm font-medium mt-1">Pastikan informasi kontak dan kode dinas sudah valid.</p>
                </div>
                <button onClick={() => setAction('list')} className="p-3 bg-white/10 text-white rounded-2xl hover:bg-white/20 transition-all"><ArrowLeft/></button>
              </div>

              <form onSubmit={handleSave} className="p-10 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nama Resmi Instansi</label>
                    <input 
                      type="text" required value={formData.nama_dinas} 
                      onChange={(e) => setFormData({...formData, nama_dinas: e.target.value})} 
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-[#3E1C96]/20 rounded-2xl px-6 py-4 outline-none font-black text-gray-800 transition-all" 
                      placeholder="Contoh: Dinas Pekerjaan Umum"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">ID / Kode Unik</label>
                    <input 
                      type="text" required value={formData.id_dinas} 
                      onChange={(e) => setFormData({...formData, id_dinas: e.target.value})} 
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-[#3E1C96]/20 rounded-2xl px-6 py-4 outline-none font-mono text-[#3E1C96] font-bold transition-all uppercase" 
                      placeholder="DPU-001"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nomor Telepon</label>
                    <input 
                      type="text" value={formData.telp} 
                      onChange={(e) => setFormData({...formData, telp: e.target.value})} 
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-[#3E1C96]/20 rounded-2xl px-6 py-4 outline-none font-bold text-gray-800 transition-all" 
                      placeholder="021-xxxx"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Korespondensi</label>
                    <input 
                      type="email" value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})} 
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-[#3E1C96]/20 rounded-2xl px-6 py-4 outline-none font-bold text-gray-800 transition-all" 
                      placeholder="kontak@dinas.go.id"
                    />
                  </div>
                </div>

                {/* Tag Input Box */}
                <div className="p-6 bg-[#F8F7FF] rounded-[32px] border-2 border-purple-50 mt-4">
                  <label className="block text-[10px] font-black text-[#3E1C96] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Tag size={14}/> Kata Kunci Klasifikasi (Tekan Enter)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-4">
                     {tags.map((tag, index) => (
                       <div key={`form-tag-${index}-${tag}`} className="bg-white text-[#3E1C96] border border-purple-100 px-4 py-2 rounded-xl text-[11px] font-black uppercase flex items-center gap-3 shadow-sm">
                         {tag}
                         <button type="button" onClick={() => removeTag(index)} className="hover:text-red-500 transition-colors"><X size={14}/></button>
                       </div>
                     ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" value={tagInput} 
                      onChange={(e) => setTagInput(e.target.value)} 
                      onKeyDown={handleKeyDown} 
                      placeholder="Contoh: Infrastruktur, Drainase, dll..." 
                      className="flex-1 bg-white border-none rounded-2xl px-6 py-4 text-sm font-bold shadow-inner focus:ring-2 focus:ring-purple-200 outline-none transition-all" 
                    />
                    <button type="button" onClick={addTag} className="bg-[#3E1C96] px-6 rounded-2xl text-white font-black hover:bg-[#2D1370] transition-all shadow-lg shadow-purple-900/20 active:scale-90">+</button>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                   <button type="button" onClick={() => setAction('list')} className="flex-1 py-4 text-gray-400 font-black uppercase tracking-widest hover:text-gray-600 transition-all">Batal</button>
                   <button 
                    type="submit" disabled={isSaving} 
                    className="flex-[2] py-4 bg-gradient-to-r from-[#3E1C96] to-[#5B2CB8] text-white font-black rounded-2xl shadow-xl shadow-purple-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
                   >
                     {isSaving ? <Loader2 className="animate-spin" /> : <Save />} {isEditing ? 'Simpan Perubahan' : 'Daftarkan Instansi'}
                   </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}