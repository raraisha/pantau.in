'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import { 
  Loader2, CheckCircle, Upload, User, Lock, Mail, 
  AlertCircle, Camera, Building2, Phone, MapPin, 
  Shield, Save, AtSign, Globe
} from 'lucide-react'

type UserRole = 'masyarakat' | 'admin' | 'petugas' | 'dinas'

export default function EditProfilePage() {
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [telp, setTelp] = useState('')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [userId, setUserId] = useState<string>('')

  const [loading, setLoading] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Dinas specific fields
  const [namaDinas, setNamaDinas] = useState('')
  const [tipeDinas, setTipeDinas] = useState('')
  const [wilayahKerja, setWilayahKerja] = useState('')
  const [deskripsi, setDeskripsi] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const storedUser = localStorage.getItem('user')
      if (!storedUser) {
        setError('Sesi habis, silakan login ulang.')
        setLoadingProfile(false)
        return
      }

      const userData = JSON.parse(storedUser)
      setUserRole(userData.role)
      setUserId(userData.id)
      setEmail(userData.email || '')

      const tableMap: Record<UserRole, string> = {
        masyarakat: 'masyarakat',
        admin: 'admin',
        petugas: 'petugas',
        dinas: 'dinas'
      }

      const tableName = tableMap[userData.role as UserRole]
      
      if (userData.role === 'dinas') {
        const { data, error } = await supabase
          .from('dinas')
          .select('*')
          .eq('id_dinas', userData.id)
          .single()
        
        if (!error && data) {
          setNamaDinas(data.nama_dinas || '')
          setEmail(data.email || '')
          setTelp(data.telp || '')
          setTipeDinas(data.tipe_dinas || '')
          setWilayahKerja(data.wilayah_kerja || '')
          setDeskripsi(data.deskripsi || '')
        }
      } else {
        const idColumn = userData.role === 'admin' ? 'id_admin' : userData.role === 'petugas' ? 'id_petugas' : 'id_masyarakat'
        const { data, error } = await supabase
          .from(tableName)
          .select('nama, avatar, telp')
          .eq(idColumn, userData.id)
          .single()
        
        if (!error && data) {
          setNama(data.nama || '')
          setTelp(data.telp || '')
          if (data.avatar) setPreview(data.avatar)
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file maksimal 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        setError('File harus berupa gambar')
        return
      }
      setAvatar(file)
      setPreview(URL.createObjectURL(file))
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (!userRole || !userId) throw new Error('Data user tidak lengkap')

      let avatarUrl = preview

      if (avatar && userRole !== 'dinas') {
        const fileExt = avatar.name.split('.').pop()
        const fileName = `${userId}-${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatar, { upsert: true })

        if (uploadError) throw new Error(`Gagal upload avatar: ${uploadError.message}`)

        const { data: publicUrl } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)

        avatarUrl = publicUrl.publicUrl
      }

      if (userRole === 'dinas') {
        const { error: updateError } = await supabase
          .from('dinas')
          .update({ 
            nama_dinas: namaDinas,
            telp,
            tipe_dinas: tipeDinas,
            wilayah_kerja: wilayahKerja,
            deskripsi,
            password: password.trim() ? password : undefined
          })
          .eq('id_dinas', userId)

        if (updateError) throw updateError
      } else {
        const tableMap = { masyarakat: 'masyarakat', admin: 'admin', petugas: 'petugas' }
        const idColumn = userRole === 'admin' ? 'id_admin' : userRole === 'petugas' ? 'id_petugas' : 'id_masyarakat'

        const { error: updateError } = await supabase
          .from(tableMap[userRole])
          .update({ nama, avatar: avatarUrl, telp })
          .eq(idColumn, userId)

        if (updateError) throw updateError
      }

      if (password.trim() && userRole !== 'dinas') {
        if (password.length < 6) throw new Error('Password minimal 6 karakter')
        const { error: pwError } = await supabase.auth.updateUser({ password })
        if (pwError) throw pwError
      }

      const updatedUser = {
        name: userRole === 'dinas' ? namaDinas : nama,
        role: userRole,
        id: userId,
        email,
        avatar: avatarUrl
      }
      localStorage.setItem('user', JSON.stringify(updatedUser))

      setSuccess('Profil berhasil diperbarui!')
      setPassword('')
      setTimeout(() => setSuccess(''), 4000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#F8F9FE] pt-28 pb-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800">Pengaturan Akun</h1>
            <p className="text-slate-500 mt-1">Kelola informasi pribadi dan keamanan akun Anda.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* --- LEFT COLUMN: IDENTITY CARD --- */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center relative overflow-hidden">
                  {/* Background Decoration */}
                  <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-[#3E1C96] to-purple-600"></div>
                  
                  {/* Avatar Wrapper */}
                  <div className="relative mt-8 mb-4 group">
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-100 relative z-10">
                      {preview ? (
                        <img src={preview} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-purple-50 text-purple-300">
                          {userRole === 'dinas' ? <Building2 size={48}/> : <User size={48}/>}
                        </div>
                      )}
                    </div>
                    
                    {/* Camera Button (Only for Non-Dinas) */}
                    {userRole !== 'dinas' && (
                      <label 
                        htmlFor="avatar-upload" 
                        className="absolute bottom-0 right-0 z-20 bg-white p-2 rounded-full shadow-md border border-slate-100 cursor-pointer hover:bg-purple-50 transition-colors group-hover:scale-110"
                      >
                        <Camera className="w-5 h-5 text-purple-600" />
                        <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={handleFileChange} />
                      </label>
                    )}
                  </div>

                  {/* Name & Role */}
                  <h2 className="text-xl font-bold text-slate-800 break-words w-full px-2">
                    {userRole === 'dinas' ? namaDinas : nama || 'User Tanpa Nama'}
                  </h2>
                  <p className="text-slate-500 text-sm mb-4">{email}</p>
                  
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider
                    ${userRole === 'admin' ? 'bg-red-100 text-red-600' : 
                      userRole === 'dinas' ? 'bg-purple-100 text-purple-600' :
                      userRole === 'petugas' ? 'bg-blue-100 text-blue-600' : 
                      'bg-green-100 text-green-600'}`}>
                    {userRole}
                  </span>
                </div>

                {/* Status Alerts in Sidebar for Visibility */}
                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="text-sm font-semibold">{success}</div>
                  </div>
                )}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="text-sm font-semibold">{error}</div>
                  </div>
                )}
              </div>

              {/* --- RIGHT COLUMN: EDIT FORM --- */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Card 1: General Information */}
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                    <User className="w-5 h-5 text-purple-600"/> Informasi Umum
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Field Email (Read Only) */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400"/>
                        <input 
                          type="email" 
                          value={email} 
                          disabled 
                          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed font-medium"
                        />
                        <div className="absolute right-4 top-3.5 text-xs text-slate-400 font-semibold bg-slate-100 px-2 rounded">Locked</div>
                      </div>
                    </div>

                    {/* Dynamic Fields Based on Role */}
                    {userRole === 'dinas' ? (
                      <>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nama Instansi</label>
                          <div className="relative">
                            <Building2 className="absolute left-4 top-3.5 w-5 h-5 text-slate-400"/>
                            <input 
                              type="text" 
                              value={namaDinas} 
                              onChange={(e) => setNamaDinas(e.target.value)}
                              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all font-medium"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tipe Dinas</label>
                          <div className="relative">
                            <Shield className="absolute left-4 top-3.5 w-5 h-5 text-slate-400"/>
                            <input 
                              type="text" 
                              value={tipeDinas} 
                              onChange={(e) => setTipeDinas(e.target.value)}
                              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 outline-none transition-all font-medium"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Wilayah Kerja</label>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-slate-400"/>
                            <input 
                              type="text" 
                              value={wilayahKerja} 
                              onChange={(e) => setWilayahKerja(e.target.value)}
                              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 outline-none transition-all font-medium"
                            />
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Deskripsi Singkat</label>
                          <textarea 
                            rows={3}
                            value={deskripsi} 
                            onChange={(e) => setDeskripsi(e.target.value)}
                            className="w-full p-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 outline-none transition-all font-medium resize-none"
                            placeholder="Jelaskan fungsi dinas..."
                          />
                        </div>
                      </>
                    ) : (
                      // Non-Dinas Fields
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nama Lengkap</label>
                        <div className="relative">
                          <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400"/>
                          <input 
                            type="text" 
                            value={nama} 
                            onChange={(e) => setNama(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all font-medium"
                          />
                        </div>
                      </div>
                    )}

                    {/* Phone Number (All Roles) */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nomor Telepon / Kontak</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-400"/>
                        <input 
                          type="text" 
                          value={telp} 
                          onChange={(e) => setTelp(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 outline-none transition-all font-medium"
                          placeholder="08xxxxxxxx"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Security */}
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                    <Lock className="w-5 h-5 text-purple-600"/> Keamanan
                  </h3>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Password Baru <span className="text-slate-400 font-normal normal-case">(Kosongkan jika tidak ingin mengubah)</span></label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400"/>
                      <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 outline-none transition-all font-medium"
                        placeholder="••••••••••••"
                      />
                    </div>
                    {password && password.length < 6 && (
                      <p className="text-xs text-red-500 mt-2 font-medium">Password harus minimal 6 karakter.</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end pt-4">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full md:w-auto px-8 py-4 bg-[#3E1C96] hover:bg-[#2e1572] text-white font-bold rounded-xl shadow-lg shadow-purple-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5"/>}
                    Simpan Perubahan
                  </button>
                </div>

              </div>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  )
}