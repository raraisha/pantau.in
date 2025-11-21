import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

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

export async function POST(request: NextRequest) {
  // Check if SMTP configuration is missing
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD || !process.env.SMTP_FROM) {
    console.error('SMTP Configuration Missing')
    return NextResponse.json(
      { message: 'Konfigurasi SMTP server tidak lengkap.' },
      { status: 500 }
    )
  }
  
  try {
    const {
      to,
      userName,
      laporanJudul,
      laporanDeskripsi,
      petugasNama,
      catatanPetugas
    } = await request.json()

    // Validation
    if (!to || !userName || !laporanJudul) {
      return NextResponse.json(
        { message: 'Data email (to, userName, laporanJudul) tidak lengkap' },
        { status: 400 }
      )
    }

    // HTML Email Template (sama seperti sebelumnya)
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
            .header { background: linear-gradient(135deg, #3E1C96 0%, #5B2CB8 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border-top: 1px solid #e0e0e0; }
            .section { margin-bottom: 25px; }
            .section-title { color: #3E1C96; font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #3E1C96; padding-bottom: 8px; }
            .info-box { background: white; padding: 15px; border-left: 4px solid #3E1C96; border-radius: 4px; margin-bottom: 15px; }
            .label { color: #666; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 5px; }
            .value { color: #333; font-size: 14px; word-break: break-word; white-space: pre-wrap; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px; }
            .status-badge { display: inline-block; background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-top: 10px; }
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
                  <p>© 2024 Sistem Manajemen Laporan. Semua hak dilindungi.</p>
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

    await transporter.sendMail(mailOptions)

    return NextResponse.json(
      { message: 'Email berhasil dikirim' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Email sending error:', error)
    return NextResponse.json(
      { message: 'Gagal mengirim email', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}