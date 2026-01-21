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
    console.error('SMTP Configuration Missing:', {
      host: !!process.env.SMTP_HOST,
      user: !!process.env.SMTP_USER,
      pass: !!process.env.SMTP_PASSWORD,
      from: !!process.env.SMTP_FROM
    })
    return res.status(500).json({
      message: 'Konfigurasi SMTP server tidak lengkap. Pastikan variabel environment sudah diset.'
    })
  }

  try {
    const {
      to,
      userName,
      laporanJudul,
      laporanDeskripsi,
      petugasNama,
      catatanPetugas,
      laporan_foto,
      laporan_bukti
    } = req.body

    // Validation
    if (!to || !userName || !laporanJudul) {
      return res.status(400).json({
        message: 'Data email tidak lengkap. Diperlukan: to, userName, laporanJudul'
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
              background: linear-gradient(135deg, #3E1C96 0%, #5B2CB8 100%); 
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
              background: #10b981; 
              color: white; 
              padding: 8px 16px; 
              border-radius: 20px; 
              font-size: 12px; 
              font-weight: bold; 
              margin-top: 10px; 
            }
            .photo-section {
              margin-bottom: 25px;
            }
            .photo-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-top: 15px;
            }
            .photo-card {
              background: white;
              border-radius: 8px;
              overflow: hidden;
              border: 2px solid #E5E7EB;
            }
            .photo-label {
              background: #F0F9FF;
              padding: 10px;
              font-weight: bold;
              color: #3E1C96;
              font-size: 13px;
              text-align: center;
              border-bottom: 1px solid #E5E7EB;
            }
            .photo-image {
              width: 100%;
              height: 200px;
              object-fit: cover;
              display: block;
            }
            .no-photo {
              width: 100%;
              height: 200px;
              background: #F3F4F6;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #999;
              font-size: 13px;
              font-style: italic;
            }
            .comparison-note {
              background: #DBEAFE;
              border-left: 4px solid #0284C7;
              padding: 12px;
              border-radius: 4px;
              margin-top: 12px;
              font-size: 13px;
              color: #0C4A6E;
            }
          </style>
        </head>
        <body>
          <div style="background: #f0f0f0; padding: 20px;">
            <div class="container">
              <div class="header">
                <h1>✅ Laporan Anda Sudah Ditangani</h1>
                <p>Hasil penanganan laporan telah siap untuk Anda</p>
              </div>

              <div class="content">
                <p>Halo <strong>${userName}</strong>,</p>
                <p>
                  Terima kasih telah melaporkan masalah kepada kami. Tim kami telah menyelesaikan penanganan laporan Anda. 
                  Berikut adalah detail dan hasil penanganannya:
                </p>

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

                  <div class="info-box">
                    <div class="label">Petugas Penangani</div>
                    <div class="value">${petugasNama || 'Tim Support'}</div>
                  </div>
                </div>

                ${(laporan_foto || laporan_bukti) ? `
                <div class="photo-section">
                  <div class="section-title">📸 Dokumentasi Hasil Pekerjaan</div>
                  <div class="photo-grid">
                    <div class="photo-card">
                      <div class="photo-label">📷 Foto Sebelum</div>
                      ${laporan_foto 
                        ? `<img src="${laporan_foto}" alt="Foto Sebelum" class="photo-image">` 
                        : `<div class="no-photo">Tidak ada foto</div>`
                      }
                    </div>
                    <div class="photo-card">
                      <div class="photo-label">✅ Foto Sesudah</div>
                      ${laporan_bukti 
                        ? `<img src="${laporan_bukti}" alt="Foto Sesudah" class="photo-image">` 
                        : `<div class="no-photo">Belum ada foto</div>`
                      }
                    </div>
                  </div>
                  <div class="comparison-note">
                    📌 Kedua foto di atas menunjukkan kondisi sebelum dan sesudah penanganan masalah Anda
                  </div>
                </div>
                ` : ''}

                <div class="section">
                  <div class="section-title">💬 Hasil Penanganan & Catatan</div>
                  <div class="info-box" style="border-left-color: #10b981;">
                    <div class="value">${catatanPetugas || 'Laporan Anda telah ditangani dengan baik. Terima kasih atas laporan Anda.'}</div>
                  </div>
                </div>

                <div style="text-align: center;">
                  <div class="status-badge">✓ SELESAI</div>
                </div>

                <div class="section" style="margin-top: 30px;">
                  <p style="color: #666; font-size: 13px;">
                    Jika Anda memiliki pertanyaan lebih lanjut, silakan hubungi tim support kami.
                  </p>
                </div>

                <div class="footer">
                  <p><strong>© 2025 PantauIn Bandung</strong></p>
                  <p>Email ini dikirim secara otomatis. Mohon jangan membalas email ini.</p>
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
      subject: `📋 Laporan Anda Telah Ditangani: ${laporanJudul}`,
      html: htmlTemplate
    }

    console.log('Attempting to send email to:', to)
    
    // Send email with timeout
    const info = await transporter.sendMail(mailOptions)
    
    console.log('Email sent successfully:', info.messageId)

    return res.status(200).json({
      message: 'Email berhasil dikirim',
      messageId: info.messageId
    })

  } catch (error) {
    console.error('Email sending error:', error)
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }

    return res.status(500).json({
      message: 'Gagal mengirim email',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    })
  }
}