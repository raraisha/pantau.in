// pages/api/send-email/laporan-selesai.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import * as nodemailer from 'nodemailer';

type Data = {
  success: boolean;
  message?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // 1. Validasi Method (Hanya terima POST)
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { 
      email, 
      nama, 
      judul, 
      lokasi, 
      tanggalLapor, 
      tanggalSelesai, 
      dinasList, 
      catatanGabungan,
      linkLaporan 
    } = req.body;

    // 2. Hitung Durasi Pengerjaan
    const start = new Date(tanggalLapor).getTime();
    const end = new Date(tanggalSelesai).getTime();
    const diffTime = Math.abs(end - start);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Logic tampilan durasi
    let durasiText = '';
    if (diffDays > 0) {
        durasiText = `${diffDays} Hari`;
    } else {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        durasiText = diffHours > 0 ? `${diffHours} Jam` : 'Kurang dari 1 Jam';
    }

    // 3. Konfigurasi Transporter SMTP (Gmail)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, // true untuk port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 4. Template HTML Email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
        <div style="background: linear-gradient(to right, #3E1C96, #5429CC); padding: 25px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">Laporan Selesai! ✅</h1>
          <p style="margin: 5px 0 0; opacity: 0.9; font-size: 14px;">Terima kasih telah peduli dengan kota kita</p>
        </div>

        <div style="padding: 30px;">
          <p style="font-size: 16px;">Halo <strong>${nama}</strong>,</p>
          <p style="line-height: 1.5;">Kabar baik! Laporan aspirasi yang Anda ajukan telah <strong>selesai ditindaklanjuti</strong>. Berikut adalah ringkasan pengerjaannya:</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #e9ecef;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-size: 14px; width: 40%;">Judul Laporan</td>
                <td style="padding: 8px 0; font-weight: bold; color: #333;">${judul}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-size: 14px;">Lokasi</td>
                <td style="padding: 8px 0; font-weight: bold; color: #333;">${lokasi}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-size: 14px;">Waktu Penanganan</td>
                <td style="padding: 8px 0; font-weight: bold; color: #3E1C96;">⏱️ ${durasiText}</td>
              </tr>
            </table>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 15px; border-bottom: 2px solid #eee; padding-bottom: 8px; margin-bottom: 10px; color: #444;">👷 Unit Dinas Terkait</h3>
            <ul style="color: #555; padding-left: 20px; margin: 0;">
              ${dinasList.map((d: string) => `<li style="margin-bottom: 5px;">${d}</li>`).join('')}
            </ul>
          </div>

          <div style="margin-bottom: 30px;">
            <h3 style="font-size: 15px; border-bottom: 2px solid #eee; padding-bottom: 8px; margin-bottom: 10px; color: #444;">📝 Feedback Petugas</h3>
            <div style="font-style: italic; background: #fff8e1; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; color: #555; line-height: 1.5;">
              "${catatanGabungan || 'Tindakan telah diselesaikan sesuai prosedur standar operasional.'}"
            </div>
          </div>

          <div style="text-align: center; margin-top: 35px;">
            <a href="${linkLaporan}" style="background-color: #3E1C96; color: white; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px rgba(62, 28, 150, 0.2);">Lihat Detail & Beri Rating</a>
          </div>

          <div style="margin-top: 40px; padding: 15px; background-color: #f0fdf4; border: 1px dashed #22c55e; border-radius: 8px; text-align: center;">
            <p style="margin: 0; font-size: 13px; color: #166534;">
              <strong>🎁 Segera Hadir: Poin Warga!</strong><br/>
              Setiap laporan yang selesai akan mendapatkan poin yang bisa ditukar dengan voucher UMKM.
            </p>
          </div>
        </div>

        <div style="background-color: #f1f1f1; padding: 20px; text-align: center; font-size: 11px; color: #888; border-top: 1px solid #ddd;">
          &copy; ${new Date().getFullYear()} Pantau.in Team.<br>
          Email ini dikirim secara otomatis. Mohon tidak membalas email ini.
        </div>
      </div>
    `;

    // 5. Eksekusi Kirim
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: `✅ Laporan Selesai: ${judul}`,
      html: htmlContent,
    });

    // 6. Response Sukses
    res.status(200).json({ success: true, message: 'Email sent successfully' });

  } catch (error: any) {
    console.error('SMTP Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}