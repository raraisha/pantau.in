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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD || !process.env.SMTP_FROM) {
    console.error('SMTP Configuration Missing')
    return res.status(500).json({ message: 'Konfigurasi SMTP tidak lengkap.' })
  }

  try {
    const {
      petugasEmail,
      petugasNama,
      userEmail,
      userName,
      laporanJudul,
      laporanDeskripsi,
      laporanId
    } = req.body

    // Validation
    if (!petugasEmail || !petugasNama || !userEmail || !userName || !laporanJudul || !laporanId) {
      return res.status(400).json({
        message: 'Data email tidak lengkap'
      })
    }

    // ============ EMAIL KE PETUGAS ============
    const htmlPetugas = `
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
              background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%); 
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
              color: #0284C7; 
              font-size: 16px; 
              font-weight: bold; 
              margin-bottom: 10px; 
              border-bottom: 2px solid #0284C7; 
              padding-bottom: 8px; 
            }
            .info-box { 
              background: white; 
              padding: 15px; 
              border-left: 4px solid #0284C7; 
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
              background: #0284C7; 
              color: white; 
              padding: 8px 16px; 
              border-radius: 20px; 
              font-size: 12px; 
              font-weight: bold; 
              margin-top: 10px; 
            }
            .highlight-box {
              background: linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%);
              border: 2px solid #0284C7;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
            }
            .laporan-id {
              font-size: 24px;
              font-weight: bold;
              color: #0284C7;
              font-family: 'Courier New', monospace;
            }
            .action-button {
              display: inline-block;
              background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%);
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: bold;
              margin-top: 15px;
            }
          </style>
        </head>
        <body>
          <div style="background: #f0f0f0; padding: 20px;">
            <div class="container">
              <div class="header">
                <h1>🎯 Tugas Baru Untukmu!</h1>
                <p>Kamu mendapat penugasan laporan baru</p>
              </div>

              <div class="content">
                <p>Halo <strong>${petugasNama}</strong>,</p>
                <p>
                  Admin telah menugaskan kamu untuk menangani laporan baru dari masyarakat. 
                  Silakan segera tinjau dan tangani laporan ini dengan baik.
                </p>

                <div class="highlight-box">
                  <div class="label">ID Laporan</div>
                  <div class="laporan-id">#${laporanId.substring(0, 8).toUpperCase()}</div>
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

                  <div class="info-box">
                    <div class="label">Pelapor</div>
                    <div class="value">${userName}</div>
                  </div>

                  <div class="info-box" style="border-left-color: #0284C7;">
                    <div class="label">Status</div>
                    <div class="value" style="color: #0284C7; font-weight: bold;">⚙️ DIPROSES</div>
                  </div>
                </div>

                <div class="section">
                  <div class="section-title">✅ Yang Perlu Kamu Lakukan</div>
                  <div style="background: white; padding: 15px; border-radius: 8px;">
                    <ol style="margin: 0; padding-left: 20px; color: #555;">
                      <li style="margin-bottom: 10px;">Login ke dashboard petugas</li>
                      <li style="margin-bottom: 10px;">Tinjau detail laporan secara lengkap</li>
                      <li style="margin-bottom: 10px;">Lakukan tindakan penanganan sesuai prosedur</li>
                      <li style="margin-bottom: 10px;">Upload foto hasil pekerjaan</li>
                      <li>Ubah status menjadi "Selesai" dan tambahkan catatan</li>
                    </ol>
                  </div>
                </div>

                <div style="text-align: center;">
                  <div class="status-badge">🚀 SEGERA TANGANI</div>
                </div>

                <div class="section" style="margin-top: 30px; background: #FEF3C7; padding: 15px; border-radius: 8px; border-left: 4px solid #F59E0B;">
                  <p style="margin: 0; color: #92400E; font-size: 13px;">
                    ⚡ <strong>Prioritas:</strong> Harap segera menangani laporan ini untuk kepuasan masyarakat.
                  </p>
                </div>

                <div class="footer">
                  <p><strong>© 2024 Sistem Manajemen Laporan</strong></p>
                  <p>Email ini dikirim secara otomatis. Mohon jangan membalas email ini.</p>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    // ============ EMAIL KE USER ============
    const htmlUser = `
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
              background: #3E1C96; 
              color: white; 
              padding: 8px 16px; 
              border-radius: 20px; 
              font-size: 12px; 
              font-weight: bold; 
              margin-top: 10px; 
            }
            .highlight-box {
              background: linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%);
              border: 2px solid #7C3AED;
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
                <h1>⚙️ Laporanmu Sedang Diproses!</h1>
                <p>Petugas sudah ditugaskan untuk menangani laporan kamu</p>
              </div>

              <div class="content">
                <p>Halo <strong>${userName}</strong>,</p>
                <p>
                  Kabar baik! Laporan kamu telah ditinjau oleh admin dan sekarang sedang ditangani oleh petugas kami. 
                  Kami akan bekerja dengan cepat untuk menyelesaikan masalah yang kamu laporkan.
                </p>

                <div class="highlight-box">
                  <div class="label">ID Laporan Kamu</div>
                  <div class="laporan-id">#${laporanId.substring(0, 8).toUpperCase()}</div>
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

                  <div class="info-box">
                    <div class="label">Petugas Penangani</div>
                    <div class="value">${petugasNama}</div>
                  </div>

                  <div class="info-box" style="border-left-color: #3E1C96;">
                    <div class="label">Status Terkini</div>
                    <div class="value" style="color: #3E1C96; font-weight: bold;">⚙️ SEDANG DIPROSES</div>
                  </div>
                </div>

                <div class="section">
                  <div class="section-title">⏱️ Apa Yang Terjadi Selanjutnya?</div>
                  <div style="background: white; padding: 15px; border-radius: 8px;">
                    <ol style="margin: 0; padding-left: 20px; color: #555;">
                      <li style="margin-bottom: 10px;">Petugas akan meninjau lokasi dan detail laporan</li>
                      <li style="margin-bottom: 10px;">Tindakan penanganan akan dilakukan sesuai prosedur</li>
                      <li style="margin-bottom: 10px;">Petugas akan mendokumentasikan hasil pekerjaan</li>
                      <li>Kamu akan menerima notifikasi email saat laporan selesai ditangani</li>
                    </ol>
                  </div>
                </div>

                <div style="text-align: center;">
                  <div class="status-badge">⚙️ DALAM PENANGANAN</div>
                </div>

                <div class="section" style="margin-top: 30px; background: #DBEAFE; padding: 15px; border-radius: 8px; border-left: 4px solid #0284C7;">
                  <p style="margin: 0; color: #0C4A6E; font-size: 13px;">
                    💡 <strong>Info:</strong> Kamu bisa memantau status laporan kapan saja melalui dashboard kamu.
                  </p>
                </div>

                <div class="footer">
                  <p><strong>© 2025 PantauIn Bandung</strong></p>
                  <p>Terima kasih atas partisipasi kamu dalam menciptakan lingkungan yang lebih baik!</p>
                  <p style="margin-top: 10px;">Email ini dikirim secara otomatis. Mohon jangan membalas email ini.</p>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    // Send email ke petugas
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: petugasEmail,
      subject: `🎯 Tugas Baru: ${laporanJudul}`,
      html: htmlPetugas
    })

    // Send email ke user
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: userEmail,
      subject: `⚙️ Laporanmu Sedang Diproses - ${laporanJudul}`,
      html: htmlUser
    })

    console.log('Emails sent successfully to petugas and user')

    return res.status(200).json({
      message: 'Email notifikasi berhasil dikirim ke petugas dan user'
    })

  } catch (error) {
    console.error('Email sending error:', error)
    
    return res.status(500).json({
      message: 'Gagal mengirim email notifikasi',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}