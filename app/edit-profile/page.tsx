'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import { Loader2, CheckCircle, Upload } from 'lucide-react'

export default function EditProfilePage() {
  const [nama, setNama] = useState('')
  const [password, setPassword] = useState('')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [table, setTable] = useState<'users' | 'admins' | 'petugas' | null>(null)

  // load profile awal
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // fungsi bantu buat cek ke tabel tertentu
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

      // cek urutan tables
      await checkTable('users') ||
      await checkTable('admins') ||
      await checkTable('petugas')
    }

    loadProfile()
  }, [])

  // handle avatar preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatar(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User tidak ditemukan')
      if (!table) throw new Error('Data user tidak ditemukan di tabel manapun')

      let avatarUrl = preview

      // upload avatar
      if (avatar) {
        const fileExt = avatar.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatar, { upsert: true })

        if (uploadError) throw uploadError

        const { data: publicUrl } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)

        avatarUrl = publicUrl.publicUrl
      }

      // update nama + avatar di tabel yg sesuai
      const { error: updateError } = await supabase
        .from(table)
        .update({ nama, avatar: avatarUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      // update password kalo ada
      if (password) {
        const { error: pwError } = await supabase.auth.updateUser({ password })
        if (pwError) throw pwError
      }

      setSuccess('Profil berhasil diperbarui 🎉')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-[#FDF7EE] to-[#f8f4ff] pt-24 px-6 flex justify-center">
        <form
          onSubmit={handleSubmit}
          className="bg-white/80 backdrop-blur-lg border border-gray-200 p-8 rounded-2xl shadow-lg w-full max-w-2xl space-y-6 text-gray-800"
        >
          <h1 className="text-3xl font-bold text-[#3E1C96]">⚙️ Edit Profil</h1>

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-700 border border-green-200 animate-fade-in">
              <CheckCircle className="w-5 h-5" />
              <span>{success}</span>
            </div>
          )}

          {/* Avatar */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Avatar</label>
            <div className="flex items-center gap-4">
              {preview ? (
                <img
                  src={preview}
                  alt="Avatar Preview"
                  className="w-20 h-20 rounded-full object-cover border"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-gray-500" />
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleFileChange} />
            </div>
          </div>

          {/* Nama */}
          <div className="relative">
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="peer w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#3E1C96] focus:border-[#3E1C96] outline-none text-sm"
              required
            />
            <label className="absolute left-3 -top-2.5 bg-white px-1 text-xs text-gray-600 peer-focus:text-[#3E1C96] transition">
              Nama Lengkap
            </label>
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Biarkan kosong jika tidak ingin ganti password"
              className="peer w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#3E1C96] focus:border-[#3E1C96] outline-none text-sm"
            />
            <label className="absolute left-3 -top-2.5 bg-white px-1 text-xs text-gray-600 peer-focus:text-[#3E1C96] transition">
              Password Baru
            </label>
          </div>

          {/* Tombol */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-white 
                       bg-gradient-to-r from-[#3E1C96] to-[#F04438] 
                       hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Simpan Perubahan'
            )}
          </button>
        </form>
      </div>
      <Footer />
    </>
  )
}
