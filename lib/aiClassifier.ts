// lib/aiClassifier.ts

// --- 1. DEFINISI TIPE DATA (INTERFACES) ---
export interface DinasProfile {
  id: string; 
  nama: string;
  email: string;
  tipe: string;
  kata_kunci: string[];
  priority_keywords: string[];
  weight: number;
}

interface ClassificationResult {
  primary_dinas: { id: string; name: string; confidence: number } | null;
  related_dinas: { id: string; name: string; confidence: number }[];
  all_dinas_ids: string[];
  reasoning: string[];
  keywords_matched: string[];
}

interface LaporanInput {
  judul: string;
  deskripsi: string;
  kategori: string;
  lokasi: string;
  urgensi: string;
}

// --- 2. DATABASE DINAS (SUDAH DISINKRONKAN DENGAN SQL INSERT KAMU) ---
export const DINAS_DATABASE: Record<string, DinasProfile> = {
  
  // Dinas Kesehatan
  '057bb7ff-91d2-4c7a-a975-438fd7f7ae90': {
    id: '057bb7ff-91d2-4c7a-a975-438fd7f7ae90',
    nama: 'Dinas Kesehatan',
    email: 'dinkes@bandung.go.id',
    tipe: 'Kesehatan',
    kata_kunci: ["puskesmas","rumah sakit","dokter","perawat","bidan","obat","pasien","kesehatan","vaksin","imunisasi","posyandu","gizi","stunting","sanitasi","wabah","pandemi","covid","virus","penyakit","ambulans","IGD","UGD","rawat inap","rawat jalan","balita","ibu hamil","KB","kontrasepsi","hipertensi","diabetes","demam berdarah","DBD","malaria","TBC","ispa","diare","gizi buruk","BPJS","jamkesmas","obat gratis","layanan kesehatan"],
    priority_keywords: ['wabah', 'pandemi', 'virus', 'penyakit menular', 'gizi buruk', 'stunting', 'demam berdarah', 'DBD'],
    weight: 1.5
  },

  // Dinas Pendidikan
  '059273ec-a261-4a87-8016-5fc3e3d1883c': {
    id: '059273ec-a261-4a87-8016-5fc3e3d1883c',
    nama: 'Dinas Pendidikan',
    email: 'disdik@bandung.go.id',
    tipe: 'Pendidikan',
    kata_kunci: ["sekolah","pendidikan","guru","siswa","murid","belajar","mengajar","ujian","kurikulum","SD","SMP","SMA","SMK","PAUD","TK","gedung sekolah","ruang kelas","fasilitas sekolah","beasiswa","pembelajaran","pendaftaran sekolah","PPDB","rapor","ijazah","kepala sekolah","tenaga pendidik","ekstrakurikuler","perpustakaan sekolah","laboratorium","les","bimbingan belajar"],
    priority_keywords: ['gedung sekolah rusak', 'pungli sekolah', 'kekerasan di sekolah', 'tawuran pelajar', 'ijazah ditahan'],
    weight: 1.2
  },

  // Dinas Pekerjaan Umum (Infrastruktur)
  '15c6f5c5-9acf-4226-b1b1-2b9d5845d396': {
    id: '15c6f5c5-9acf-4226-b1b1-2b9d5845d396',
    nama: 'Dinas Pekerjaan Umum',
    email: 'dinaspu@bandung.go.id',
    tipe: 'Infrastruktur',
    kata_kunci: ["jalan","jembatan","infrastruktur","jalan rusak","lubang","berlubang","aspal","trotoar","drainase","got","selokan","banjir","genangan","jalan berlubang","perbaikan jalan","pengaspalan","pembangunan jalan","konstruksi","gorong-gorong","saluran air","pemeliharaan jalan","jalan provinsi","jalan kota","gang","jalan sempit","akses jalan","paving","konblok","fly over","underpass","turap","penahan tanah"],
    priority_keywords: ['jalan rusak parah', 'jembatan putus', 'longsor jalan', 'banjir besar', 'tanggul jebol'],
    weight: 1.5
  },

  // Satpol PP (Ketertiban)
  '1ffb7f65-e2ea-4cb0-a2c2-c1ef36774b9b': {
    id: '1ffb7f65-e2ea-4cb0-a2c2-c1ef36774b9b',
    nama: 'Satuan Polisi Pamong Praja',
    email: 'satpolpp@bandung.go.id',
    tipe: 'Ketentraman & Ketertiban',
    kata_kunci: ["satpol PP","pamong praja","ketertiban","ketentraman","keamanan","ketentraman dan ketertiban","trantib","razia","penertiban","pembongkaran","bongkar","segel","penyegelan","perda","peraturan daerah","pelanggaran perda","PKL liar","pedagang kaki lima","pedagang liar","gerobak liar","lapak liar","bangunan liar","lahan ilegal","okupansi","penggusuran","gusur","premanisme","preman","pungli","pungutan liar","balap liar","balapan liar","knalpot brong","suara bising","kebisingan","kericuhan","tawuran","geng motor","demonstrasi","demo","unjuk rasa","ormas","organisasi masyarakat","konser","keramaian","crowd control","pengamanan","patroli","ronda","operasi","tertib","disiplin","linmas","hansip","satpam","security"],
    priority_keywords: ['tawuran', 'geng motor', 'kerusuhan', 'premanisme', 'bangunan liar', 'miras oplosan'],
    weight: 1.3
  },

  // Disbudpar (Pariwisata)
  '217a1d54-d515-4d97-97e9-5f43e53fc45c': {
    id: '217a1d54-d515-4d97-97e9-5f43e53fc45c',
    nama: 'Dinas Kebudayaan dan Pariwisata',
    email: 'disbudpar@bandung.go.id',
    tipe: 'Kebudayaan & Pariwisata',
    kata_kunci: ["pariwisata","wisata","tourist","turis","destinasi wisata","tempat wisata","objek wisata","hotel","penginapan","restoran","cafe","kuliner","makanan khas","oleh-oleh","souvenir","guide","tour guide","pemandu wisata","travel","agency","kebudayaan","budaya","seni","seniman","seni budaya","tradisi","adat","upacara adat","tari","tarian","musik","teater","drama","wayang","angklung","saung angklung","museum","galeri","gedung kesenian","pameran seni","festival","event budaya","perayaan","hari jadi","anniversary","cagar budaya","bangunan bersejarah","heritage","warisan budaya","pelestarian","sanggar","sanggar seni","komunitas seni","Braga","Asia Afrika","Gedung Sate","landmark","ikon kota"],
    priority_keywords: ['cagar budaya rusak', 'tempat wisata ilegal', 'pungli wisata'],
    weight: 1.0
  },

  // Distanpangan (Pertanian)
  '255e4b72-936f-4bec-8487-53e7bd2f4bc0': {
    id: '255e4b72-936f-4bec-8487-53e7bd2f4bc0',
    nama: 'Dinas Pangan dan Pertanian',
    email: 'distanpangan@bandung.go.id',
    tipe: 'Pertanian & Pangan',
    kata_kunci: ["pangan","pertanian","petani","sawah","kebun","tanaman","panen","bibit","pupuk","pestisida","irigasi","pengairan","padi","jagung","sayuran","buah","hortikultura","hidroponik","urban farming","peternakan","ternak","sapi","kambing","ayam","unggas","perikanan","ikan","kolam","tambak","pakan ternak","hewan ternak","ketahanan pangan","keamanan pangan","harga pangan","distribusi pangan","pasar","sembako","beras","subsidi pangan","lumbung pangan","gudang"],
    priority_keywords: ['gagal panen', 'hama', 'wabah penyakit hewan', 'kelangkaan pupuk', 'harga pangan melambung'],
    weight: 1.1
  },

  // Dishub (Transportasi)
  '2f509e37-4e6d-40e9-b759-78580560d275': {
    id: '2f509e37-4e6d-40e9-b759-78580560d275',
    nama: 'Dinas Perhubungan',
    email: 'dishub@bandung.go.id',
    tipe: 'Transportasi',
    kata_kunci: ["lalu lintas","lalin","macet","kemacetan","parkir","rambu","marka jalan","traffic light","lampu lalu lintas","lampu merah","angkot","angkutan kota","bus","Trans Metro Bandung","TMB","transportasi","transportasi umum","terminal","halte","shelter","zebra cross","penyeberangan","JPO","jembatan penyeberangan","tilang","pelanggaran lalu lintas","one way","satu arah","ganjil genap","batas kecepatan","putar balik","u-turn","jalur khusus","busway","sepeda motor","mobil","truk","kendaraan","LLAJ","rawan kecelakaan","kecelakaan lalu lintas","tabrakan","kongesti","volume kendaraan","rekayasa lalu lintas","dishub","polantas","polisi lalu lintas","ramp","tanjakan","turunan"],
    priority_keywords: ['macet total', 'lampu merah mati', 'kecelakaan beruntun', 'parkir liar', 'angkot ngetem sembarangan'],
    weight: 1.4
  },

  // DLHK (Lingkungan & Kebersihan)
  '33318c1a-fcaf-4be3-8cb1-b67a317df20f': {
    id: '33318c1a-fcaf-4be3-8cb1-b67a317df20f',
    nama: 'Dinas Lingkungan Hidup dan Kebersihan',
    email: 'dlhk@bandung.go.id',
    tipe: 'Lingkungan & Kebersihan',
    kata_kunci: ["sampah","kebersihan","TPA","TPS","tempat pembuangan sampah","tempat sampah","lingkungan","pencemaran","polusi","limbah","pengangkutan sampah","truk sampah","sampah menumpuk","kotor","bau","pembuangan sampah","daur ulang","recycle","bank sampah","sampah organik","sampah anorganik","sampah plastik","kompos","B3","limbah B3","limbah berbahaya","air limbah","saluran pembuangan","IPAL","pengolahan limbah","Citarum","sungai","kali","pencemaran air","pencemaran udara","asap","debu","kebisingan","emisi","petugas kebersihan","cleaning service","pasukan orange","bersih-bersih","kerja bakti"],
    priority_keywords: ['sampah menumpuk', 'tps penuh', 'limbah beracun', 'pencemaran sungai', 'bau busuk menyengat'],
    weight: 1.4
  },

  // Diskominfo (IT)
  '4aa90abd-b117-4594-bc14-143065586ee1': {
    id: '4aa90abd-b117-4594-bc14-143065586ee1',
    nama: 'Dinas Komunikasi dan Informatika',
    email: 'diskominfo@bandung.go.id',
    tipe: 'Komunikasi & Teknologi Informasi',
    kata_kunci: ["komunikasi","informatika","internet","wifi","website","aplikasi","sistem informasi","IT","teknologi informasi","digital","online","e-government","smart city","data","statistik","informasi publik","transparansi","publikasi","media","sosial media","humas","public relations","press release","siaran pers","berita","pengaduan online","layanan online","cyber","keamanan siber","hack","hacker","data breach","kebocoran data","privasi","CCTV","command center","monitoring","dashboard","server","jaringan","bandwidth","koneksi","telekomunikasi","tower telekomunikasi","BTS"],
    priority_keywords: ['internet mati', 'aplikasi error', 'kebocoran data', 'hacker', 'hoax', 'penipuan online'],
    weight: 1.0
  },

  // Damkar (Bencana)
  '4b6dc8e8-22b7-4eb6-8037-0782e0976290': {
    id: '4b6dc8e8-22b7-4eb6-8037-0782e0976290',
    nama: 'Dinas Kebakaran dan Penanggulangan Bencana',
    email: 'damkar@bandung.go.id',
    tipe: 'Kebakaran & Kebencanaan',
    kata_kunci: ["kebakaran","terbakar","api","pemadam kebakaran","damkar","fire","mobil pemadam","fire truck","selang","hydrant","APAR","alat pemadam api ringan","tabung pemadam","sprinkler","smoke detector","alarm kebakaran","asap","korsleting","hubungan arus pendek","gas meledak","ledakan","explosion","evakuasi","korban kebakaran","luka bakar","bencana","disaster","gempa","gempa bumi","earthquake","banjir","flood","genangan","rob","tanah longsor","longsor","landslide","angin puting beliung","tornado","puting beliung","pohon tumbang","bangunan roboh","reruntuhan","SAR","search and rescue","penyelamatan","pertolongan","darurat","emergency","siaga","posko","pengungsian","pengungsi","shelter","logistik","bantuan","BPBD","tanggap darurat","mitigasi","penanggulangan bencana"],
    priority_keywords: ['kebakaran besar', 'rumah terbakar', 'pohon tumbang menimpa', 'banjir bandang', 'longsor', 'gas meledak'],
    weight: 2.0
  },

  // Dispusip (Perpus)
  '50beadce-7c97-497e-8a9a-bafe4315c798': {
    id: '50beadce-7c97-497e-8a9a-bafe4315c798',
    nama: 'Dinas Perpustakaan dan Kearsipan',
    email: 'dispusip@bandung.go.id',
    tipe: 'Perpustakaan & Kearsipan',
    kata_kunci: ["perpustakaan","library","buku","membaca","baca","literasi","bacaan","novel","komik","majalah","koran","surat kabar","koleksi buku","peminjaman buku","kartu perpustakaan","kartu anggota","member","ruang baca","reading room","e-book","digital library","perpustakaan digital","katalog","pustakawan","librarian","taman baca","taman bacaan","TBM","mobil perpustakaan","perpustakaan keliling","kearsipan","arsip","dokumen","file","penyimpanan dokumen","management dokumen","records","berkas","dokumentasi","administrasi","surat","surat menyurat","naskah","penataan arsip","digitalisasi arsip","arsip digital","preservasi","pelestarian dokumen","informasi"],
    priority_keywords: ['buku rusak', 'arsip hilang', 'perpustakaan tutup'],
    weight: 0.8
  },

  // Dinsos (Sosial)
  '51552fd4-a2eb-4062-a35c-175a8ef4bddb': {
    id: '51552fd4-a2eb-4062-a35c-175a8ef4bddb',
    nama: 'Dinas Sosial dan Penanggulangan Kemiskinan',
    email: 'dinsos@bandung.go.id',
    tipe: 'Sosial',
    kata_kunci: ["sosial","bantuan sosial","bansos","PKH","BPNT","rastra","sembako","miskin","kemiskinan","gelandangan","pengemis","tunawisma","gepeng","anak jalanan","lansia","disabilitas","penyandang disabilitas","difabel","panti","panti asuhan","panti jompo","yatim piatu","anak terlantar","PMKS","penyandang masalah kesejahteraan sosial","kartu keluarga","KK","surat keterangan tidak mampu","SKTM","bantuan","donasi","kemanusiaan","korban bencana","trauma","rehabilitasi sosial"],
    priority_keywords: ['kelaparan', 'orang terlantar', 'bencana alam', 'bantuan tidak cair'],
    weight: 1.2
  },

  // DP3APM (Perempuan & Anak)
  '5b7bce80-0fbb-41e2-9106-a1c40df2d91c': {
    id: '5b7bce80-0fbb-41e2-9106-a1c40df2d91c',
    nama: 'Dinas Pemberdayaan Perempuan dan Perlindungan Anak',
    email: 'dp3apm@bandung.go.id',
    tipe: 'Pemberdayaan Masyarakat',
    kata_kunci: ["perempuan","wanita","ibu","anak","balita","remaja","kekerasan dalam rumah tangga","KDRT","kekerasan seksual","pelecehan","pemerkosaan","trafficking","perdagangan manusia","prostitusi","eksploitasi anak","child abuse","bullying","perundungan","perlindungan anak","hak anak","PKK","dharma wanita","posyandu","kader","pemberdayaan","UMKM perempuan","ibu rumah tangga","gender","kesetaraan gender","RT","RW","kelurahan","kecamatan","musyawarah","gotong royong","karang taruna","pemuda","komunitas","lembaga masyarakat"],
    priority_keywords: ['kdrt', 'kekerasan seksual', 'pelecehan', 'pemerkosaan', 'penculikan anak', 'bullying'],
    weight: 1.6
  },

  // Disperkimtan (Perumahan & Taman)
  '672c7946-d377-4764-9c52-e705bf8725e1': {
    id: '672c7946-d377-4764-9c52-e705bf8725e1',
    nama: 'Dinas Perumahan dan Kawasan Pemukiman',
    email: 'disperkimtan@bandung.go.id',
    tipe: 'Perumahan & Pertamanan',
    kata_kunci: ["perumahan","rumah","hunian","pemukiman","rusunawa","rusun","rumah susun","rumah dinas","tanah","lahan","sertifikat","taman","taman kota","pertamanan","ruang hijau","RTH","pohon","tanaman","bunga","penghijauan","pemangkasan pohon","pohon tumbang","rindang","landscape","taman bermain","playground","tempat duduk taman","fasilitas taman","penataan taman","kawasan kumuh","slum area","renovasi rumah","bantuan perumahan"],
    priority_keywords: ['pohon tumbang', 'taman rusak', 'lampu taman mati', 'bangunan liar di taman'],
    weight: 1.3
  },

  // Diskop UKM
  '8a046921-4cbe-4518-99e2-2fdf90f7c220': {
    id: '8a046921-4cbe-4518-99e2-2fdf90f7c220',
    nama: 'Dinas Koperasi dan UMKM',
    email: 'diskop@bandung.go.id',
    tipe: 'Koperasi & UMKM',
    kata_kunci: ["koperasi","koperasi simpan pinjam","UMKM","UKM","usaha mikro","usaha kecil","usaha menengah","wirausaha","entrepreneur","pengusaha","pedagang","penjual","usaha","bisnis","modal usaha","kredit usaha","KUR","pinjaman","bantuan modal","startup","pelatihan usaha","pembinaan UMKM","pasar","toko","warung","kios","lapak","PKL","pedagang kaki lima","gerobak","kuliner","makanan","craft","kerajinan","home industry","industri rumahan","produk lokal","UMKM binaan","sentra UMKM","expo","pameran","bazar","e-commerce","marketplace","digital marketing"],
    priority_keywords: ['pinjol ilegal', 'koperasi bodong', 'bantuan umkm'],
    weight: 1.0
  },

  // DPMPTSP (Perizinan)
  'a4d406da-ab01-4018-b83f-97b351dde709': {
    id: 'a4d406da-ab01-4018-b83f-97b351dde709',
    nama: 'DPMPTSP',
    email: 'dpmptsp@bandung.go.id',
    tipe: 'Perizinan & Investasi',
    kata_kunci: ["perizinan","izin","PTSP","pelayanan terpadu satu pintu","OSS","online single submission","penanaman modal","investasi","investor","modal","SIUP","TDP","NIB","nomor induk berusaha","izin usaha","izin gangguan","HO","IMB","izin mendirikan bangunan","PBG","persetujuan bangunan gedung","izin lokasi","izin lingkungan","AMDAL","UKL UPL","TDI","tanda daftar industri","sertifikat","legalisasi","rekomendasi","permohonan izin","perpanjangan izin","pengurusan izin","kemudahan berusaha","EODB","promosi investasi","fasilitasi investasi","one day service","pelayanan cepat","antrian","loket"],
    priority_keywords: ['izin dipersulit', 'pungli perizinan', 'calo izin'],
    weight: 1.2
  },

  // Dispora (Pemuda & Olahraga)
  'bc90ea96-7bcd-41b0-b530-15eb8b5293ff': {
    id: 'bc90ea96-7bcd-41b0-b530-15eb8b5293ff',
    nama: 'Dinas Pemuda dan Olahraga',
    email: 'dispora@bandung.go.id',
    tipe: 'Kepemudaan & Olahraga',
    kata_kunci: ["pemuda","karang taruna","generasi muda","youth","organisasi pemuda","kepemudaan","prestasi pemuda","olahraga","sport","atlet","pelatih","coach","sepak bola","futsal","basket","voli","badminton","bulutangkis","renang","atletik","lari","marathon","senam","fitness","gym","beladiri","pencak silat","karate","taekwondo","judo","tinju","gulat","catur","tenis","tenis meja","ping pong","GOR","gedung olahraga","lapangan","stadion","arena","kolam renang","hall","fasilitas olahraga","pertandingan","turnamen","kompetisi","liga","perlombaan","event olahraga","KONI","PORDA","PON","pembinaan atlet","pemusatan latihan","pelatnas"],
    priority_keywords: ['tawuran pemuda', 'fasilitas olahraga rusak', 'stadion rusak'],
    weight: 1.0
  },

  // Disperindag (Perdagangan)
  'c1cb5a85-0223-45ee-a747-266eb3584c30': {
    id: 'c1cb5a85-0223-45ee-a747-266eb3584c30',
    nama: 'Dinas Perdagangan dan Perindustrian',
    email: 'disperindag@bandung.go.id',
    tipe: 'Perdagangan & Industri',
    kata_kunci: ["perdagangan","dagang","pasar","pasar tradisional","pasar modern","mall","supermarket","minimarket","toko","pedagang","penjual","pembeli","harga","inflasi","sembako","kebutuhan pokok","distribusi","supply","stok","kelangkaan","langka","industri","pabrik","manufaktur","produksi","produsen","IKM","industri kecil menengah","tekstil","garmen","konveksi","fashion","makanan olahan","minuman","ekspor","impor","ekspor impor","bea cukai","sertifikasi","standar industri","SNI","halal","label","merek dagang","HAKI","SIUP","izin usaha","operasi pasar","sidak pasar","tera","timbangan","meteran","takaran","perlindungan konsumen"],
    priority_keywords: ['harga sembako naik', 'minyak goreng langka', 'gas langka', 'penimbunan barang'],
    weight: 1.3
  },

  // Disnaker (Tenaga Kerja)
  'd1ff9f02-581e-446e-8eae-5cea49ca1f9e': {
    id: 'd1ff9f02-581e-446e-8eae-5cea49ca1f9e',
    nama: 'Dinas Tenaga Kerja',
    email: 'disnaker@bandung.go.id',
    tipe: 'Ketenagakerjaan',
    kata_kunci: ["tenaga kerja","pekerja","buruh","karyawan","kerja","pekerjaan","lowongan kerja","job fair","bursa kerja","pengangguran","PHK","upah","gaji","UMK","UMR","upah minimum","mogok kerja","demo buruh","serikat pekerja","outsourcing","kontrak kerja","kartu kuning","AK1","pencari kerja","pelatihan kerja","BLK","balai latihan kerja","magang","PKL","industrial","pabrik","perusahaan","HRD","keselamatan kerja","K3","BPJS ketenagakerjaan","jamsostek","pesangon","TKI","transmigrasi"],
    priority_keywords: ['phk massal', 'gaji tidak dibayar', 'thr tidak cair', 'kecelakaan kerja'],
    weight: 1.4
  },

  // DPPKB (Keluarga Berencana)
  'd602db45-3793-48e9-a1a6-91f16b78557d': {
    id: 'd602db45-3793-48e9-a1a6-91f16b78557d',
    nama: 'Dinas Pengendalian Penduduk dan KB',
    email: 'dppkb@bandung.go.id',
    tipe: 'Kependudukan & KB',
    kata_kunci: ["KB","keluarga berencana","kontrasepsi","alat kontrasepsi","pil KB","suntik KB","IUD","spiral","implan","kondom","vasektomi","tubektomi","steril","kependudukan","jumlah penduduk","pertumbuhan penduduk","ledakan penduduk","kepadatan penduduk","demografi","sensus","data kependudukan","BKB","bina keluarga balita","PIK","pusat informasi konseling","kesehatan reproduksi","remaja","program KB","BKKBN","keluarga sejahtera","pasangan usia subur","PUS"],
    priority_keywords: [],
    weight: 0.8
  },

  // Distaru (Tata Ruang)
  'd6f55615-dcbc-408a-acd9-11d63747859f': {
    id: 'd6f55615-dcbc-408a-acd9-11d63747859f',
    nama: 'Dinas Penataan Ruang',
    email: 'distaru@bandung.go.id',
    tipe: 'Perencanaan & Tata Ruang',
    kata_kunci: ["tata ruang","RTRW","zonasi","IMB","izin mendirikan bangunan","perencanaan kota","wilayah","bangunan liar","bangunan ilegal","sempadan","garis sempadan","RTH","ruang terbuka hijau","kawasan","peruntukan lahan","zoning","PBG","persetujuan bangunan gedung","reklame","papan reklame","billboard","tower","menara","pelanggaran bangunan","pembongkaran","lahan","kavling"],
    priority_keywords: ['bangunan roboh', 'sengketa lahan', 'reklame roboh'],
    weight: 1.1
  },

  // Disdukcapil
  'e71383ef-0daf-4ccf-b506-1c80e1354628': {
    id: 'e71383ef-0daf-4ccf-b506-1c80e1354628',
    nama: 'Dinas Kependudukan dan Pencatatan Sipil',
    email: 'disdukcapil@bandung.go.id',
    tipe: 'Kependudukan & Adminduk',
    kata_kunci: ["KTP","e-KTP","kartu tanda penduduk","KK","kartu keluarga","akta lahir","akta kelahiran","akta kematian","akta nikah","akta cerai","surat pindah","surat datang","domisili","surat keterangan domisili","administrasi kependudukan","adminduk","NIK","nomor induk kependudukan","dukcapil","pencatatan sipil","identitas","data penduduk","pindah alamat","mutasi","ganti alamat","perpanjangan KTP","pembuatan KTP","cetak KTP","hilang KTP","rusak KTP","perekaman","foto","sidik jari","pengurusan dokumen","berkas kependudukan","legalisir","autentikasi","surat pengantar RT RW"],
    priority_keywords: ['ktp habis', 'blangko kosong', 'pungli ktp', 'data ganda'],
    weight: 1.5
  }
};

// --- 3. LOGIC CLASSIFIER (SAMA SEPERTI SEBELUMNYA) ---
export function classifyLaporan(input: LaporanInput): ClassificationResult {
  const text = `${input.judul} ${input.deskripsi} ${input.kategori}`.toLowerCase();
  
  const scores: Record<string, number> = {};
  const matchedKeywords: Record<string, string[]> = {};
  const reasoning: string[] = [];

  // --- STEP 1: SCORING ---
  Object.values(DINAS_DATABASE).forEach((dinas) => {
    let score = 0;
    const matched: string[] = [];

    // Cek Keyword Biasa
    dinas.kata_kunci.forEach(keyword => {
      const kw = keyword.toLowerCase();
      if (text.includes(kw)) {
        const occurrences = (text.match(new RegExp(kw, 'g')) || []).length;
        score += 10 + (Math.min(occurrences - 1, 3) * 5); 
        matched.push(keyword);
      }
    });

    // Cek Keyword Prioritas (Menggunakan priority_keywords yang baru)
    if (dinas.priority_keywords) {
      dinas.priority_keywords.forEach(keyword => {
        const kw = keyword.toLowerCase();
        if (text.includes(kw)) {
          score += 30;
          matched.push(`[PRIORITAS] ${keyword}`);
          reasoning.push(`⚠️ Kata kunci darurat untuk ${dinas.nama}: "${keyword}"`);
        }
      });
    }

    if (score > 0) {
      score *= dinas.weight; 
      if (input.urgensi === 'tinggi') score *= 1.2;
      
      scores[dinas.id] = score; 
      matchedKeywords[dinas.id] = matched; 
    }
  });

  // --- STEP 2: SORTING ---
  const sortedDinas = Object.entries(scores).sort(([, scoreA], [, scoreB]) => scoreB - scoreA);

  if (sortedDinas.length === 0) {
    return {
      primary_dinas: null,
      related_dinas: [],
      all_dinas_ids: [],
      reasoning: ["❌ Tidak ditemukan kecocokan otomatis. Butuh tinjauan manual."],
      keywords_matched: []
    };
  }

  // --- STEP 3: RESULT ---
  const [topId, topScore] = sortedDinas[0];
  const topDinasProfile = DINAS_DATABASE[topId]; 
  
  if (!topDinasProfile) {
     return {
       primary_dinas: null,
       related_dinas: [],
       all_dinas_ids: [],
       reasoning: ["❌ Error internal: Profil dinas tidak ditemukan."],
       keywords_matched: []
     }
  }

  const confidence = Math.min(Math.round((topScore / 60) * 100), 99);
  reasoning.push(`🎯 Analisis Utama: ${topDinasProfile.nama} (Skor: ${topScore.toFixed(0)})`);
  
  const allDinasIds: string[] = [topId];
  const relatedDinas: { id: string; name: string; confidence: number }[] = [];

  // --- STEP 4: RELATED DINAS ---
  for (let i = 1; i < sortedDinas.length; i++) {
    const [relId, relScore] = sortedDinas[i];
    const relProfile = DINAS_DATABASE[relId];

    if (relProfile && relScore > topScore * 0.4) {
      const relConf = Math.min(Math.round((relScore / 60) * 100), 90);
      relatedDinas.push({
        id: relId,
        name: relProfile.nama,
        confidence: relConf
      });
      allDinasIds.push(relId);
      reasoning.push(`🔗 Terkait: ${relProfile.nama} (${relConf}% confidence).`);
    }
  }

  // Logic Hardcoded Tambahan (Contoh Pohon Tumbang)
  // Karena sekarang data dinas sudah lengkap, kita bisa cari ID Dishub & Disperkimtan secara dinamis
  if (text.includes('pohon') && (text.includes('tumbang') || text.includes('roboh'))) {
    // Cari Disperkimtan (Taman)
    const disperkimtan = Object.values(DINAS_DATABASE).find(d => d.nama.toLowerCase().includes('perumahan'));
    // Cari Dishub (Lalin)
    const dishub = Object.values(DINAS_DATABASE).find(d => d.nama.toLowerCase().includes('perhubungan'));
    
    // Kalau yang terpilih bukan salah satu dari mereka, tambahkan sebagai related
    if (disperkimtan && !allDinasIds.includes(disperkimtan.id)) {
        relatedDinas.push({ id: disperkimtan.id, name: disperkimtan.nama, confidence: 80 });
        allDinasIds.push(disperkimtan.id);
        reasoning.push("🌳 Skenario Pohon Tumbang: +Disperkimtan (Evakuasi Pohon).");
    }
    if (dishub && !allDinasIds.includes(dishub.id)) {
        relatedDinas.push({ id: dishub.id, name: dishub.nama, confidence: 75 });
        allDinasIds.push(dishub.id);
        reasoning.push("🚦 Skenario Pohon Tumbang: +Dishub (Pengamanan Lalin).");
    }
  }

  return {
    primary_dinas: { 
      id: topId, 
      name: topDinasProfile.nama, 
      confidence: confidence 
    },
    related_dinas: relatedDinas.slice(0, 3), 
    all_dinas_ids: [...new Set(allDinasIds)],
    reasoning,
    keywords_matched: matchedKeywords[topId] || []
  };
}