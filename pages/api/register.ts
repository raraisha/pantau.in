import { supabase } from '@/lib/supabase'
import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  const { nik, nama, email, telp, password } = req.body

  if (!nik || !nama || !email || !password) {
    return res.status(400).json({ error: 'Semua field wajib diisi' })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const { data, error } = await supabase.from('users').insert([
    {
      nik,
      nama,
      email,
      telp,
      password: hashedPassword,
    },
  ])

  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({ message: 'Registrasi berhasil!', data })
}
