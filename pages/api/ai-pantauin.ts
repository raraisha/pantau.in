import type { NextApiRequest, NextApiResponse } from 'next'

// Mock responses untuk testing
const mockResponses: { [key: string]: string } = {
  'default': 'Pantau.in adalah platform pelaporan masalah publik di Bandung yang memudahkan masyarakat untuk melaporkan berbagai masalah seperti jalan rusak, sampah menumpuk, atau fasilitas umum yang rusak. Laporan akan ditangani oleh petugas yang ditugaskan oleh admin.',
  'cara': 'Untuk membuat laporan di Pantau.in, kamu perlu login terlebih dahulu, lalu masuk ke menu "Buat Laporan". Isi judul, deskripsi, upload foto (opsional), dan tentukan lokasi masalah di peta. Setelah laporan dikirim, kamu akan mendapat konfirmasi via email.',
  'status': 'Kamu bisa memantau status laporan melalui dashboard di akun kamu. Setiap perubahan status (menunggu, diproses, selesai) akan diberitahukan melalui email secara otomatis.',
  'login': 'Ya, kamu harus login untuk membuat laporan. Ini untuk memastikan validitas data dan memudahkan pelacakan status laporan. Kamu bisa daftar gratis dengan email dan NIK.',
  'gratis': 'Ya, Pantau.in sepenuhnya gratis untuk digunakan oleh seluruh masyarakat Bandung. Tidak ada biaya apapun untuk membuat atau memantau laporan.',
  'email': 'Email notifikasi akan dikirim otomatis saat: (1) Laporan berhasil dibuat, (2) Admin menugaskan petugas untuk menangani, dan (3) Laporan selesai ditangani oleh petugas.'
}

function findBestMatch(question: string): string {
  const lowerQuestion = question.toLowerCase()
  
  if (lowerQuestion.includes('cara') || lowerQuestion.includes('bagaimana') || lowerQuestion.includes('gimana')) {
    return mockResponses['cara']
  }
  if (lowerQuestion.includes('status') || lowerQuestion.includes('pantau') || lowerQuestion.includes('cek')) {
    return mockResponses['status']
  }
  if (lowerQuestion.includes('login') || lowerQuestion.includes('daftar') || lowerQuestion.includes('akun')) {
    return mockResponses['login']
  }
  if (lowerQuestion.includes('biaya') || lowerQuestion.includes('gratis') || lowerQuestion.includes('bayar')) {
    return mockResponses['gratis']
  }
  if (lowerQuestion.includes('email') || lowerQuestion.includes('notif')) {
    return mockResponses['email']
  }
  
  return mockResponses['default']
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { question } = req.body

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ 
        answer: 'Pertanyaan tidak valid. Silakan coba lagi.' 
      })
    }

    console.log('Question received:', question)
 
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Get mock response
    const answer = findBestMatch(question)
    
    console.log('Sending answer:', answer)

    return res.status(200).json({ answer })

  } catch (error) {
    console.error('AI API Error:', error)
    return res.status(500).json({ 
      answer: 'Maaf, terjadi kesalahan saat memproses pertanyaan. Silakan coba lagi.' 
    })
  }
}