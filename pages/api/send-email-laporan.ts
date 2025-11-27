import type { NextApiRequest, NextApiResponse } from 'next'
import nodemailer from 'nodemailer'

// --- Nodemailer Transporter Setup ---
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  // Check if SMTP configuration is missing
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD || !process.env.SMTP_FROM) {
    console.error('SMTP Configuration Missing')
    return res.status(500).json({
      message: 'Konfigurasi SMTP server tidak lengkap.'
    })
  }

  try {
    const {
      to,
      userName,
      laporanJudul,
      laporanDeskripsi,
      laporanId
    } = req.body

    // Validation
    if (!to || !userName || !laporanJudul || !laporanId) {
      return res.status(400).json({
        message: 'Data email tidak lengkap. Diperlukan: to, userName, laporanJudul, laporanId'
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return res.status(400).json({
        message: 'Format email tidak valid'
      })
    }

    // HTML Email Template
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0; 
              background-color: #f0f0f0;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: #ffffff; 
              border-radius: 8px; 
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); 
            }
            .header { 
              background: linear-gradient(135deg, #3E1C96 0%, #F04438 100%); 
              color: white; 
              padding: 30px; 
              border-radius: 8px 8px 0 0; 
              text-align: center; 
            }
            .header h1 { margin: 0; font-size: 28px; }
            .header p { margin: 10px 0 0 0; opacity: 0.95; }
            .content { 
              background: #f9f9f9; 
              padding: 30px; 
              border-radius: 0 0 8px 8px; 
              border-top: 1px solid #e0e0e0; 
            }
            .section { margin-bottom: 25px; }
            .section-title { 
              color: #3E1C96; 
              font-size: 16px; 
              font-weight: bold; 
              margin-bottom: 10px; 
              border-bottom: 2px solid #3E1C96; 
              padding-bottom: 8px; 
            }
            .info-box { 
              background: white; 
              padding: 15px; 
              border-left: 4px solid #3E1C96; 
              border-radius: 4px; 
              margin-bottom: 15px; 
            }
            .label { 
              color: #666; 
              font-size: 12px; 
              font-weight: 600; 
              text-transform: uppercase; 
              margin-bottom: 5px; 
            }
            .value { 
              color: #333; 
              font-size: 14px; 
              word-break: break-word; 
              white-space: pre-wrap; 
            }
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              padding-top: 20px; 
              border-top: 1px solid #e0e0e0; 
              color: #999; 
              font-size: 12px; 
            }
            .status-badge { 
              display: inline-block; 
              background: #F59E0B; 
              color: white; 
              padding: 8px 16px; 
              border-radius: 20px; 
              font-size: 12px; 
              font-weight: bold; 
              margin-top: 10px; 
            }
            .highlight-box {
              background: linear-gradient(135deg, #FFF7E9 0%, #FFFDF7 100%);
              border: 2px solid #F59E0B;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .laporan-id {
              font-size: 24px;
              font-weight: bold;
              color: #3E1C96;
              font-family: 'Courier New', monospace;
            }
          </style>
        </head>
        <body>
          <div style="background: #f0f0f0; padding: 20px;">
            <div class="container">
              <div class="header">
                <h1>🎉 Terima Kasih Telah Melapor!</h1>
                <p>Laporan Anda telah kami terima dan sedang diproses</p>
              </div>

              <div class="content">
                <p>Halo <strong>${userName}</strong>,</p>
                <p>
                  Terima kasih telah menggunakan layanan pelaporan kami. Laporan Anda sangat berarti untuk membantu 
                  kami meningkatkan kualitas layanan dan lingkungan yang lebih baik.
                </p>

                <div class="highlight-box">
                  <div class="label">ID Laporan Anda</div>
                  <div class="laporan-id">#${laporanId.substring(0, 8).toUpperCase()}</div>
                  <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">Simpan ID ini untuk referensi Anda</p>
                </div>

                <div class="section">
                  <div class="section-title">📋 Detail Laporan</div>
                  
                  <div class="info-box">
                    <div class="label">Judul Laporan</div>
                    <div class="value"><strong>${laporanJudul}</strong></div>
                  </div>

                  <div class="info-box">
                    <div class="label">Deskripsi</div>
                    <div class="value">${laporanDeskripsi || 'Tidak ada deskripsi'}</div>
                  </div>

                  <div class="info-box" style="border-left-color: #F59E0B;">
                    <div class="label">Status Saat Ini</div>
                    <div class="value" style="color: #F59E0B; font-weight: bold;">⏳ Menunggu Verifikasi Admin</div>
                  </div>
                </div>

                <div class="section">
                  <div class="section-title">📌 Langkah Selanjutnya</div>
                  <div style="background: white; padding: 15px; border-radius: 8px;">
                    <ol style="margin: 0; padding-left: 20px; color: #555;">
                      <li style="margin-bottom: 10px;">Admin akan memverifikasi laporan Anda dalam 1-2 hari kerja</li>
                      <li style="margin-bottom: 10px;">Setelah diverifikasi, petugas akan ditugaskan untuk menangani laporan</li>
                      <li style="margin-bottom: 10px;">Anda akan mendapatkan notifikasi email ketika status laporan berubah</li>
                      <li>Anda dapat memantau status laporan melalui dashboard Anda</li>
                    </ol>
                  </div>
                </div>

                <div style="text-align: center;">
                  <div class="status-badge">⏳ MENUNGGU VERIFIKASI</div>
                </div>

                <div class="section" style="margin-top: 30px; background: #E0F2FE; padding: 15px; border-radius: 8px; border-left: 4px solid #0284C7;">
                  <p style="margin: 0; color: #0C4A6E; font-size: 13px;">
                    💡 <strong>Tips:</strong> Pastikan notifikasi email Anda aktif agar tidak melewatkan update status laporan Anda.
                  </p>
                </div>

                <div class="footer">
                  <p><strong>© 2025 PantauIn Bandung</strong></p>
                  <p>Email ini dikirim secara otomatis. Mohon jangan membalas email ini.</p>
                  <p style="margin-top: 10px; color: #ccc;">Jika Anda memiliki pertanyaan, hubungi tim support kami</p>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: to,
      subject: `✅ Laporan Anda Telah Diterima - ${laporanJudul}`,
      html: htmlTemplate
    }

    console.log('Sending laporan confirmation email to:', to)
    
    const info = await transporter.sendMail(mailOptions)
    
    console.log('Email sent successfully:', info.messageId)

    return res.status(200).json({
      message: 'Email konfirmasi berhasil dikirim',
      messageId: info.messageId
    })

  } catch (error) {
    console.error('Email sending error:', error)
    
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message
      })
    }

    return res.status(500).json({
      message: 'Gagal mengirim email konfirmasi',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}