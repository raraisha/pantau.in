'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import { Loader2, CheckCircle, Upload, User, Lock, Mail, AlertCircle, Camera } from 'lucide-react'

export default function EditProfilePage() {
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')

  const [loading, setLoading] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [table, setTable] = useState<'users' | 'admins' | 'petugas' | null>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('User tidak ditemukan')
        setLoadingProfile(false)
        return
      }

      setEmail(user.email || '')

      const checkTable = async (tableName: 'users' | 'admins' | 'petugas') => {
        const { data, error } = await supabase
          .from(tableName)
          .select('nama, avatar')
          .eq('id', user.id)
          .single()
        
        if (!error && data) {
          setNama(data.nama || '')
          if (data.avatar) setPreview(data.avatar)
          setTable(tableName)
          return true
        }
        return false
      }

      const found = await checkTable('users') ||
                    await checkTable('admins') ||
                    await checkTable('petugas')

      if (!found) {
        setError('Data profil tidak ditemukan')
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
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file maksimal 5MB')
        return
      }

      // Validate file type
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User tidak ditemukan')
      if (!table) throw new Error('Data user tidak ditemukan di tabel manapun')

      let avatarUrl = preview

      // Upload avatar if changed
      if (avatar) {
        const fileExt = avatar.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        
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

      // Update nama + avatar
      const { error: updateError } = await supabase
        .from(table)
        .update({ nama, avatar: avatarUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Update password if provided
      if (password.trim()) {
        if (password.length < 6) {
          throw new Error('Password minimal 6 karakter')
        }
        
        const { error: pwError } = await supabase.auth.updateUser({ password })
        if (pwError) throw pwError
      }

      setSuccess('✓ Profil berhasil diperbarui!')
      setPassword('')
      setTimeout(() => setSuccess(''), 5000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loadingProfile) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-[#FDF7EE] via-[#f8f4ff] to-[#FDF7EE] pt-24 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-[#3E1C96]" />
            <p className="text-gray-600">Memuat profil...</p>
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
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#3E1C96] to-[#F04438] mb-3">
              ⚙️ Edit Profil
            </h1>
            <p className="text-gray-600 text-lg">
              Perbarui informasi profil dan keamanan akun Anda
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-xl border-2 border-gray-100 p-8 md:p-10 rounded-3xl shadow-2xl space-y-8">
            {/* Success Alert */}
            {success && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-2 border-green-200 shadow-sm animate-fade-in">
                <CheckCircle className="w-6 h-6 flex-shrink-0" />
                <span className="font-medium">{success}</span>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-2 border-red-200 shadow-sm">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Avatar Section */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Camera className="w-4 h-4 text-[#3E1C96]" />
                Foto Profil
              </label>
              
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Avatar Preview */}
                <div className="relative group">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Avatar Preview"
                      className="w-32 h-32 rounded-full object-cover border-4 border-purple-200 shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center border-4 border-purple-200 shadow-lg">
                      <User className="w-16 h-16 text-purple-400" />
                    </div>
                  )}
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Upload Button */}
                <div className="flex-1 w-full sm:w-auto">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="flex items-center justify-center gap-3 w-full px-6 py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#3E1C96] hover:bg-purple-50/50 transition-all group"
                  >
                    <Upload className="w-5 h-5 text-gray-400 group-hover:text-[#3E1C96] transition-colors" />
                    <span className="text-sm text-gray-600 group-hover:text-[#3E1C96] font-medium transition-colors">
                      {avatar ? 'Ganti Foto' : 'Upload Foto'}
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-2 text-center sm:text-left">
                    Maksimal 5MB. Format: JPG, PNG, GIF
                  </p>
                </div>
              </div>
            </div>

            {/* Email (Read Only) */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Mail className="w-4 h-4 text-[#3E1C96]" />
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Tidak dapat diubah
                </span>
              </div>
            </div>

            {/* Nama */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <User className="w-4 h-4 text-[#3E1C96]" />
                Nama Lengkap
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Masukkan nama lengkap"
                className="text-black w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3E1C96] focus:border-[#3E1C96] outline-none text-sm transition-all bg-white hover:border-gray-300"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Lock className="w-4 h-4 text-[#3E1C96]" />
                Password Baru (Opsional)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter, kosongkan jika tidak ingin mengubah"
                className="text-black w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3E1C96] focus:border-[#3E1C96] outline-none text-sm transition-all bg-white hover:border-gray-300"
              />
              {password && password.length < 6 && (
                <p className="text-xs text-orange-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Password minimal 6 karakter
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-white text-lg
                       bg-gradient-to-r from-[#3E1C96] via-[#5B2CB8] to-[#F04438] 
                       hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                       transition-all duration-200 flex items-center justify-center gap-3"
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

            {/* Info Text */}
            <p className="text-xs text-center text-gray-500">
              Pastikan informasi yang Anda masukkan sudah benar sebelum menyimpan
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}