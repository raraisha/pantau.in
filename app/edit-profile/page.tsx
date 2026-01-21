'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import { Loader2, CheckCircle, Upload, User, Lock, Mail, AlertCircle, Camera, Building2, Phone, MapPin, Shield } from 'lucide-react'

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
      // Get user info from localStorage
      const storedUser = localStorage.getItem('user')
      if (!storedUser) {
        setError('User tidak ditemukan di localStorage')
        setLoadingProfile(false)
        return
      }

      const userData = JSON.parse(storedUser)
      setUserRole(userData.role)
      setUserId(userData.id)
      setEmail(userData.email || '')

      // Fetch data based on role
      const tableMap: Record<UserRole, string> = {
        masyarakat: 'masyarakat',
        admin: 'admin',
        petugas: 'petugas',
        dinas: 'dinas'
      }

      const tableName = tableMap[userData.role]
      
      if (userData.role === 'dinas') {
        // Fetch dinas data
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
        } else {
          setError('Data dinas tidak ditemukan')
        }
      } else {
        // Fetch other roles data
        const { data, error } = await supabase
          .from(tableName)
          .select('nama, avatar, telp')
          .eq(userData.role === 'admin' ? 'id_admin' : 
              userData.role === 'petugas' ? 'id_petugas' : 'id_masyarakat', userData.id)
          .single()
        
        if (!error && data) {
          setNama(data.nama || '')
          setTelp(data.telp || '')
          if (data.avatar) setPreview(data.avatar)
        } else {
          setError('Data profil tidak ditemukan')
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

      // Upload avatar if changed (not for dinas)
      if (avatar && userRole !== 'dinas') {
        const fileExt = avatar.name.split('.').pop()
        const fileName = `${userId}-${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatar, { 
            upsert: true,
            cacheControl: '3600'
          })

        if (uploadError) throw new Error(`Gagal upload avatar: ${uploadError.message}`)

        const { data: publicUrl } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)

        avatarUrl = publicUrl.publicUrl
      }

      // Update based on role
      if (userRole === 'dinas') {
        const { error: updateError } = await supabase
          .from('dinas')
          .update({ 
            nama_dinas: namaDinas,
            telp,
            tipe_dinas: tipeDinas,
            wilayah_kerja: wilayahKerja,
            deskripsi,
            password: password.trim() ? password : undefined // Update password if provided
          })
          .eq('id_dinas', userId)

        if (updateError) throw updateError
      } else {
        const tableMap = {
          masyarakat: 'masyarakat',
          admin: 'admin',
          petugas: 'petugas'
        }
        
        const idColumn = userRole === 'admin' ? 'id_admin' : 
                        userRole === 'petugas' ? 'id_petugas' : 'id_masyarakat'

        const { error: updateError } = await supabase
          .from(tableMap[userRole as keyof typeof tableMap])
          .update({ nama, avatar: avatarUrl, telp })
          .eq(idColumn, userId)

        if (updateError) throw updateError
      }

      // Update password in auth (for non-dinas roles)
      if (password.trim() && userRole !== 'dinas') {
        if (password.length < 6) {
          throw new Error('Password minimal 6 karakter')
        }
        
        const { error: pwError } = await supabase.auth.updateUser({ password })
        if (pwError) throw pwError
      }

      // Update localStorage
      const updatedUser = {
        name: userRole === 'dinas' ? namaDinas : nama,
        role: userRole,
        id: userId,
        email
      }
      localStorage.setItem('user', JSON.stringify(updatedUser))

      setSuccess('✅ Profil berhasil diperbarui!')
      setPassword('')
      setTimeout(() => setSuccess(''), 5000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadge = () => {
    const configs = {
      admin: { color: 'from-red-500 to-rose-600', icon: <Shield className="w-4 h-4" />, label: 'Admin' },
      dinas: { color: 'from-purple-500 to-purple-600', icon: <Building2 className="w-4 h-4" />, label: 'Dinas' },
      petugas: { color: 'from-blue-500 to-cyan-600', icon: <User className="w-4 h-4" />, label: 'Petugas' },
      masyarakat: { color: 'from-green-500 to-emerald-600', icon: <User className="w-4 h-4" />, label: 'Masyarakat' }
    }
    
    const config = userRole ? configs[userRole] : configs.masyarakat
    
    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-semibold text-sm bg-gradient-to-r ${config.color} shadow-lg`}>
        {config.icon}
        {config.label}
      </div>
    )
  }

  if (loadingProfile) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-[#FDF7EE] via-[#f8f4ff] to-[#FDF7EE] pt-24 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-12 h-12 animate-spin text-[#3E1C96]" />
            <p className="text-gray-600 font-medium">Memuat profil...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-[#FDF7EE] via-[#f8f4ff] to-[#FDF7EE] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10" data-aos="fade-down">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#3E1C96] to-[#F04438] mb-4">
              ⚙️ Pengaturan Profil
            </h1>
            <p className="text-gray-600 text-lg mb-4">
              Kelola informasi akun dan preferensi keamanan Anda
            </p>
            {getRoleBadge()}
          </div>

          <div className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-3xl shadow-2xl overflow-hidden">
            {/* Success Alert */}
            {success && (
              <div className="mx-8 mt-8 flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200 shadow-sm animate-fade-in">
                <CheckCircle className="w-6 h-6 flex-shrink-0" />
                <span className="font-semibold">{success}</span>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="mx-8 mt-8 flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200 shadow-sm">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-8">
              {/* Avatar Section - Only for non-dinas */}
              {userRole !== 'dinas' && (
                <div className="pb-8 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-[#3E1C96]" />
                    Foto Profil
                  </h2>
                  
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="relative group">
                      {preview ? (
                        <img
                          src={preview}
                          alt="Avatar Preview"
                          className="w-32 h-32 rounded-full object-cover border-4 border-purple-200 shadow-xl"
                        />
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center border-4 border-purple-200 shadow-xl">
                          <User className="w-16 h-16 text-purple-400" />
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                    </div>

                    <div className="flex-1 w-full">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="avatar-upload"
                      />
                      <label
                        htmlFor="avatar-upload"
                        className="flex items-center justify-center gap-3 w-full px-6 py-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#3E1C96] hover:bg-purple-50/50 transition-all group"
                      >
                        <Upload className="w-5 h-5 text-gray-400 group-hover:text-[#3E1C96] transition-colors" />
                        <span className="text-sm text-gray-600 group-hover:text-[#3E1C96] font-semibold transition-colors">
                          {avatar ? 'Ganti Foto Profil' : 'Upload Foto Profil'}
                        </span>
                      </label>
                      <p className="text-xs text-gray-500 mt-3 text-center">
                        Format: JPG, PNG, GIF • Maksimal 5MB • Resolusi optimal: 400x400px
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Informasi Akun Section */}
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#3E1C96]" />
                  Informasi Akun
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Email (Read Only) */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                      <Mail className="w-4 h-4 text-[#3E1C96]" />
                      Email
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full px-4 py-3.5 pl-11 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed text-sm font-medium"
                      />
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 bg-gray-200 px-2.5 py-1 rounded-full font-medium">
                        Tidak dapat diubah
                      </span>
                    </div>
                  </div>

                  {/* Nama - Different for Dinas */}
                  {userRole === 'dinas' ? (
                    <>
                      <div className="space-y-2 md:col-span-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                          <Building2 className="w-4 h-4 text-[#3E1C96]" />
                          Nama Dinas
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={namaDinas}
                            onChange={(e) => setNamaDinas(e.target.value)}
                            placeholder="Contoh: Dinas Kesehatan Kota Bandung"
                            className="text-black w-full px-4 py-3.5 pl-11 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3E1C96] focus:border-[#3E1C96] outline-none text-sm transition-all bg-white hover:border-gray-300 font-medium"
                            required
                          />
                          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                          <Shield className="w-4 h-4 text-[#3E1C96]" />
                          Tipe Dinas
                        </label>
                        <input
                          type="text"
                          value={tipeDinas}
                          onChange={(e) => setTipeDinas(e.target.value)}
                          placeholder="Contoh: Kesehatan, Lingkungan, dll"
                          className="text-black w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3E1C96] focus:border-[#3E1C96] outline-none text-sm transition-all bg-white hover:border-gray-300 font-medium"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                          <MapPin className="w-4 h-4 text-[#3E1C96]" />
                          Wilayah Kerja
                        </label>
                        <input
                          type="text"
                          value={wilayahKerja}
                          onChange={(e) => setWilayahKerja(e.target.value)}
                          placeholder="Contoh: Kota Bandung"
                          className="text-black w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3E1C96] focus:border-[#3E1C96] outline-none text-sm transition-all bg-white hover:border-gray-300 font-medium"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                          <User className="w-4 h-4 text-[#3E1C96]" />
                          Deskripsi
                        </label>
                        <textarea
                          value={deskripsi}
                          onChange={(e) => setDeskripsi(e.target.value)}
                          placeholder="Deskripsi singkat tentang dinas..."
                          rows={3}
                          className="text-black w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3E1C96] focus:border-[#3E1C96] outline-none text-sm transition-all bg-white hover:border-gray-300 font-medium resize-none"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2 md:col-span-2">
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                        <User className="w-4 h-4 text-[#3E1C96]" />
                        Nama Lengkap
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={nama}
                          onChange={(e) => setNama(e.target.value)}
                          placeholder="Masukkan nama lengkap Anda"
                          className="text-black w-full px-4 py-3.5 pl-11 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3E1C96] focus:border-[#3E1C96] outline-none text-sm transition-all bg-white hover:border-gray-300 font-medium"
                          required
                        />
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  )}

                  {/* Nomor Telepon */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                      <Phone className="w-4 h-4 text-[#3E1C96]" />
                      Nomor Telepon
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={telp}
                        onChange={(e) => setTelp(e.target.value)}
                        placeholder="08xx xxxx xxxx"
                        className="text-black w-full px-4 py-3.5 pl-11 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3E1C96] focus:border-[#3E1C96] outline-none text-sm transition-all bg-white hover:border-gray-300 font-medium"
                      />
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Keamanan Section */}
              <div className="space-y-6 pt-6 border-t border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#3E1C96]" />
                  Keamanan Akun
                </h2>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                    <Lock className="w-4 h-4 text-[#3E1C96]" />
                    Password Baru (Opsional)
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 6 karakter • Kosongkan jika tidak ingin mengubah"
                      className="text-black w-full px-4 py-3.5 pl-11 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3E1C96] focus:border-[#3E1C96] outline-none text-sm transition-all bg-white hover:border-gray-300 font-medium"
                    />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  {password && password.length > 0 && password.length < 6 && (
                    <p className="text-xs text-orange-600 flex items-center gap-1.5 mt-2 font-medium">
                      <AlertCircle className="w-4 h-4" />
                      Password harus minimal 6 karakter
                    </p>
                  )}
                  {password && password.length >= 6 && (
                    <p className="text-xs text-green-600 flex items-center gap-1.5 mt-2 font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Password valid
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl font-bold text-white text-lg
                           bg-gradient-to-r from-[#3E1C96] via-[#5B2CB8] to-[#F04438] 
                           hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                           transition-all duration-300 flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Menyimpan Perubahan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>

                <p className="text-xs text-center text-gray-500 mt-4 font-medium">
                  🔒 Semua data Anda dienkripsi dan dilindungi dengan keamanan tingkat enterprise
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}