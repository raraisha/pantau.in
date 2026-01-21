-- ============================================================================
-- INSERT DATA PETUGAS DINAS KESEHATAN (DINKES)
-- ============================================================================
-- Pastikan Anda sudah memiliki data dinas dengan kode 'DINKES' di tabel dinas
-- ============================================================================

-- Step 1: Cek ID Dinas Kesehatan terlebih dahulu
SELECT id_dinas, nama_dinas, kode_dinas 
FROM dinas 
WHERE kode_dinas = 'DINKES' OR nama_dinas ILIKE '%kesehatan%';

-- ============================================================================
-- Step 2: Insert Data Petugas
-- Ganti 'YOUR_DINKES_ID_HERE' dengan ID yang didapat dari query di atas
-- ============================================================================

DO $$
DECLARE
  v_id_dinkes uuid;
BEGIN
  -- Ambil ID Dinas Kesehatan otomatis
  SELECT id_dinas INTO v_id_dinkes 
  FROM dinas 
  WHERE kode_dinas = 'DINKES' 
  LIMIT 1;

  -- Jika tidak ditemukan, tampilkan error
  IF v_id_dinkes IS NULL THEN
    RAISE EXCEPTION 'Dinas Kesehatan tidak ditemukan! Pastikan ada data dengan kode_dinas = DINKES';
  END IF;

  -- Insert data petugas
  INSERT INTO petugas (
    id_petugas,
    id_dinas,
    nama,
    email,
    telp,
    alamat,
    jabatan,
    beban_kerja,
    status_aktif,
    created_at,
    updated_at
  ) VALUES

  -- DINKES-001: Koordinator Senior
  (
    gen_random_uuid(),
    v_id_dinkes,
    'Dr. Ahmad Fauzi, S.Kes',
    'ahmad.fauzi@dinkes.bandung.go.id',
    '081234567001',
    'Jl. Gatot Subroto No. 45, RT 03/RW 05, Menteng, Jakarta Pusat',
    'Koordinator Surveilans dan Pengendalian Penyakit',
    5,
    true,
    '2023-06-15 08:00:00+07',
    '2025-01-02 14:30:00+07'
  ),

  -- DINKES-002: Petugas Kesling
  (
    gen_random_uuid(),
    v_id_dinkes,
    'Siti Nurhaliza, SKM, M.Kes',
    'siti.nurhaliza@dinkes.bandung.go.id',
    '081234567002',
    'Jl. Sudirman Kav. 88, RT 05/RW 02, Tanah Abang, Jakarta Pusat',
    'Petugas Kesehatan Lingkungan dan Sanitasi',
    8,
    true,
    '2023-08-20 09:15:00+07',
    '2025-01-03 10:45:00+07'
  ),

  -- DINKES-003: Petugas Promkes
  (
    gen_random_uuid(),
    v_id_dinkes,
    'Budi Santoso, S.KM',
    'budi.santoso@dinkes.jakarta.go.id',
    '081234567003',
    'Jl. Proklamasi No. 123, RT 02/RW 04, Menteng, Jakarta Pusat',
    'Petugas Promosi dan Pemberdayaan Kesehatan Masyarakat',
    3,
    true,
    '2024-01-10 08:30:00+07',
    '2024-12-28 16:20:00+07'
  ),

  -- DINKES-004: Petugas Gizi
  (
    gen_random_uuid(),
    v_id_dinkes,
    'Dewi Lestari, S.Gz, RD',
    'dewi.lestari@dinkes.jakarta.go.id',
    '081234567004',
    'Jl. Thamrin No. 90, RT 07/RW 03, Gondangdia, Jakarta Pusat',
    'Petugas Gizi dan Kesehatan Keluarga',
    2,
    true,
    '2024-02-01 07:45:00+07',
    '2024-12-30 11:15:00+07'
  ),

  -- DINKES-005: Supervisor Imunisasi
  (
    gen_random_uuid(),
    v_id_dinkes,
    'Eko Prasetyo, AMd.Kep',
    'eko.prasetyo@dinkes.jakarta.go.id',
    '081234567005',
    'Jl. Asia Afrika No. 12, RT 01/RW 06, Gelora, Jakarta Pusat',
    'Supervisor Imunisasi dan Vaksinasi',
    6,
    true,
    '2023-11-15 08:00:00+07',
    '2025-01-01 09:30:00+07'
  ),

  -- DINKES-006: Petugas P2M
  (
    gen_random_uuid(),
    v_id_dinkes,
    'Fitriani Rahmawati, S.K.M',
    'fitriani.rahmawati@dinkes.jakarta.go.id',
    '081234567006',
    'Jl. Merdeka Barat No. 67, RT 04/RW 02, Gambir, Jakarta Pusat',
    'Petugas Pencegahan dan Pengendalian Penyakit Menular',
    4,
    true,
    '2024-03-05 09:00:00+07',
    '2024-12-27 15:00:00+07'
  ),

  -- DINKES-007: Koordinator PTM
  (
    gen_random_uuid(),
    v_id_dinkes,
    'Hendra Wijaya, S.Ked',
    'hendra.wijaya@dinkes.jakarta.go.id',
    '081234567007',
    'Jl. Cikini Raya No. 34, RT 06/RW 01, Cikini, Jakarta Pusat',
    'Koordinator Penyakit Tidak Menular dan Kesehatan Jiwa',
    7,
    true,
    '2023-09-10 08:15:00+07',
    '2025-01-04 08:45:00+07'
  ),

  -- DINKES-008: Petugas Kesehatan Kerja
  (
    gen_random_uuid(),
    v_id_dinkes,
    'Ika Permata Sari, S.KM',
    'ika.permata@dinkes.jakarta.go.id',
    '081234567008',
    'Jl. Kebon Sirih No. 89, RT 03/RW 08, Menteng, Jakarta Pusat',
    'Petugas Kesehatan Kerja dan Olahraga',
    1,
    true,
    '2024-04-20 10:00:00+07',
    '2024-12-15 14:30:00+07'
  ),

  -- DINKES-009: Petugas Yankes Primer
  (
    gen_random_uuid(),
    v_id_dinkes,
    'Joko Susilo, S.Kep, Ners',
    'joko.susilo@dinkes.jakarta.go.id',
    '081234567009',
    'Jl. Menteng Raya No. 56, RT 02/RW 07, Menteng, Jakarta Pusat',
    'Petugas Pelayanan Kesehatan Primer',
    0,
    true,
    '2024-05-15 07:30:00+07',
    NULL
  ),

  -- DINKES-010: Koordinator KIA
  (
    gen_random_uuid(),
    v_id_dinkes,
    'Kartika Dewi, S.ST, Bd',
    'kartika.dewi@dinkes.jakarta.go.id',
    '081234567010',
    'Jl. Cikini No. 78, RT 05/RW 04, Cikini, Jakarta Pusat',
    'Koordinator Kesehatan Ibu dan Anak',
    9,
    true,
    '2023-07-25 08:45:00+07',
    '2025-01-03 16:00:00+07'
  ),

  -- DINKES-011: Petugas Non-Aktif (Cuti Panjang)
  (
    gen_random_uuid(),
    v_id_dinkes,
    'Lina Marlina, AMd.Gz',
    'lina.marlina@dinkes.jakarta.go.id',
    '081234567011',
    'Jl. Diponegoro No. 23, RT 08/RW 03, Menteng, Jakarta Pusat',
    'Petugas Gizi Masyarakat',
    0,
    false,
    '2023-05-10 09:00:00+07',
    '2024-11-20 10:00:00+07'
  ),

  -- DINKES-012: Petugas Farmasi
  (
    gen_random_uuid(),
    v_id_dinkes,
    'Muhammad Rizki, S.Farm, Apt',
    'muhammad.rizki@dinkes.jakarta.go.id',
    '081234567012',
    'Jl. Salemba Raya No. 45, RT 01/RW 05, Senen, Jakarta Pusat',
    'Petugas Kefarmasian dan Alat Kesehatan',
    3,
    true,
    '2024-01-25 08:00:00+07',
    '2024-12-20 13:45:00+07'
  );

  RAISE NOTICE 'Berhasil menambahkan 12 petugas untuk Dinas Kesehatan (ID: %)', v_id_dinkes;

END $$;