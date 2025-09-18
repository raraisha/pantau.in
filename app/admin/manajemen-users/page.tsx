'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { supabase } from '@/lib/supabase'

type User = {
  id: string
  nama: string
  email: string
  lokasi?: string
  created_at: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    AOS.init({ duration: 800, once: true })
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('users')
      .select('id, nama, email, lokasi, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error.message)
      setLoading(false)
      return
    }

    setUsers(data || [])
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin mau hapus user ini?')) return
    const { error } = await supabase.from('users').delete().eq('id', id)
    if (error) {
      console.error('Error deleting user:', error.message)
      return
    }
    fetchUsers()
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#FDF7EE] pt-24 px-6">
        {/* Header */}
        <div data-aos="fade-down">
          <h1 className="text-3xl font-bold text-[#3E1C96] mb-2">👤 Manajemen Users</h1>
          <p className="text-gray-700 mb-8 text-lg">
            Kelola data user yang terdaftar dalam sistem.
          </p>
        </div>

        {/* Tabel Users */}
        <div
          className="bg-white p-6 rounded-2xl shadow-lg overflow-x-auto"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-[#3E1C96]">📂 Daftar Users</h2>
            <button
              onClick={() => (window.location.href = '/admin/users/new')}
              className="px-4 py-2 rounded-lg bg-[#3E1C96] text-white text-sm hover:bg-[#2d1470] transition"
            >
              + Tambah User
            </button>
          </div>

          {loading ? (
            <p className="text-gray-500">Loading data...</p>
          ) : users.length > 0 ? (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left text-sm text-black">
                  <th className="p-3">Nama</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Lokasi</th>
                  <th className="p-3">Tanggal Daftar</th>
                  <th className="p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 text-sm">
                    <td className="p-3 text-black">{user.nama}</td>
                    <td className="p-3 text-black">{user.email}</td>
                    <td className="p-3 text-black">{user.lokasi || '-'}</td>
                    <td className="p-3 text-black">
                      {new Date(user.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => (window.location.href = `/admin/users/${user.id}`)}
                        className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs hover:bg-blue-800 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs hover:bg-red-800 transition"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">Belum ada user terdaftar.</p>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
