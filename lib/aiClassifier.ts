// lib/aiClassifier.ts

// --- 1. DEFINISI TIPE DATA (INTERFACES) ---
export interface DinasProfile {
  id: string; // Wajib ada biar logic loop jalan
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

// --- 2. DATABASE DINAS ---
// Perbaikan: Menambahkan property 'id' di dalam objek agar sesuai Interface

export const DINAS_DATABASE: Record<string, DinasProfile> = {
  '15c6f5c5-9acf-4226-b1b1-2b9d5845d396': {
    id: '15c6f5c5-9acf-4226-b1b1-2b9d5845d396', // ✅ ID DITAMBAHKAN
    nama: 'Dinas Pekerjaan Umum / Bina Marga',
    email: 'dinaspu@bandung.go.id',
    tipe: 'Infrastruktur',
    kata_kunci: ["jalan","jembatan","drainase","trotoar","aspal","lubang","berlubang","rusak","putus","ambruk","bailey","pondasi","oprit","fly over","underpass","turap","dinding penahan","gorong-gorong","saluran air","paving","konstruksi","perbaikan"],
    priority_keywords: ['jembatan', 'jalan rusak', 'lubang', 'drainase', 'putus', 'ambruk'],
    weight: 1.5
  },
  '4b6dc8e8-22b7-4eb6-8037-0782e0976290': {
    id: '4b6dc8e8-22b7-4eb6-8037-0782e0976290', // ✅ ID DITAMBAHKAN
    nama: 'Dinas Kebakaran dan Penanggulangan Bencana (BPBD)',
    email: 'damkar@bandung.go.id',
    tipe: 'Kebakaran & Kebencanaan',
    kata_kunci: ["kebakaran","api","damkar","darurat","emergency","bencana","gempa","banjir","longsor","tanah longsor","pohon tumbang","evakuasi","SAR","penyelamatan","logistik","pengungsian","tanggap darurat","roboh"],
    priority_keywords: ['kebakaran', 'bencana', 'banjir', 'longsor', 'darurat', 'evakuasi'],
    weight: 2.0
  },
  '2f509e37-4e6d-40e9-b759-78580560d275': {
    id: '2f509e37-4e6d-40e9-b759-78580560d275', // ✅ ID DITAMBAHKAN
    nama: 'Dinas Perhubungan',
    email: 'dishub@bandung.go.id',
    tipe: 'Transportasi',
    kata_kunci: ["lalu lintas","lalin","macet","rekayasa","pengalihan","penutupan","jalur alternatif","rambu","marka","traffic light","lampu merah","terminal","parkir","zebra cross","penyeberangan"],
    priority_keywords: ['macet', 'rekayasa', 'pengalihan', 'penutupan', 'traffic light'],
    weight: 1.2
  },
  'diskominfosantik-uuid-001': {
    id: 'diskominfosantik-uuid-001', // ✅ ID DITAMBAHKAN
    nama: 'Dinas Komunikasi dan Informatika (Diskominfosantik)',
    email: 'diskominfo@bandung.go.id',
    tipe: 'Informasi Publik',
    kata_kunci: ["informasi","pengumuman","sosialisasi","berita","publikasi","media sosial","siaran pers","akses darurat","edukasi","pengumuman publik"],
    priority_keywords: ['pengumuman', 'akses darurat', 'publikasi', 'informasi'],
    weight: 1.0
  },
  '33318c1a-fcaf-4be3-8cb1-b67a317df20f': {
    id: '33318c1a-fcaf-4be3-8cb1-b67a317df20f', // ✅ ID DITAMBAHKAN
    nama: 'Dinas Lingkungan Hidup dan Kebersihan',
    email: 'dlhk@bandung.go.id',
    tipe: 'Lingkungan',
    kata_kunci: ["sampah","tpa","tps","kebersihan","pencemaran","limbah","polusi","bau","kotor","sungai","kali","truk sampah","pengangkutan"],
    priority_keywords: ['sampah', 'pencemaran', 'limbah', 'bau'],
    weight: 1.2
  },
  '057bb7ff-91d2-4c7a-a975-438fd7f7ae90': {
    id: '057bb7ff-91d2-4c7a-a975-438fd7f7ae90', // ✅ ID DITAMBAHKAN
    nama: 'Dinas Kesehatan',
    email: 'dinkes@bandung.go.id',
    tipe: 'Kesehatan',
    kata_kunci: ["puskesmas","rumah sakit","obat","pasien","vaksin","stunting","wabah","penyakit","ambulans","igd","dbd","virus","kesehatan","medis"],
    priority_keywords: ['wabah', 'penyakit', 'ambulans', 'igd', 'medis'],
    weight: 1.4
  },
  '1ffb7f65-e2ea-4cb0-a2c2-c1ef36774b9b': {
    id: '1ffb7f65-e2ea-4cb0-a2c2-c1ef36774b9b', // ✅ ID DITAMBAHKAN
    nama: 'Satuan Polisi Pamong Praja (Satpol PP)',
    email: 'satpolpp@bandung.go.id',
    tipe: 'Ketertiban',
    kata_kunci: ["tertib","razia","pkl","pedagang","liar","segel","bongkar","preman","tawuran","demo","unjuk rasa","keamanan","patroli"],
    priority_keywords: ['pkl', 'liar', 'tawuran', 'segel'],
    weight: 1.2
  }
};

// --- 3. LOGIC CLASSIFIER ---
export function classifyLaporan(input: LaporanInput): ClassificationResult {
  const text = `${input.judul} ${input.deskripsi} ${input.kategori}`.toLowerCase();
  
  const scores: Record<string, number> = {};
  const matchedKeywords: Record<string, string[]> = {};
  const reasoning: string[] = [];

  // --- STEP 1: SCORING ---
  // Sekarang aman looping pakai Object.values karena 'dinas' sudah punya properti 'id'
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

    // Cek Keyword Prioritas
    dinas.priority_keywords.forEach(keyword => {
      const kw = keyword.toLowerCase();
      if (text.includes(kw)) {
        score += 30;
        matched.push(`[PRIORITAS] ${keyword}`);
        reasoning.push(`⚠️ Kata kunci darurat untuk ${dinas.nama}: "${keyword}"`);
      }
    });

    if (score > 0) {
      score *= dinas.weight; 
      if (input.urgensi === 'tinggi') score *= 1.2;
      
      scores[dinas.id] = score; // ✅ Tidak error lagi
      matchedKeywords[dinas.id] = matched; // ✅ Tidak error lagi
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
  if (text.includes('pohon') && (text.includes('tumbang') || text.includes('roboh'))) {
    const dishubObj = Object.values(DINAS_DATABASE).find(d => d.nama.includes('Perhubungan'));
    // ✅ dishubObj.id sekarang aman diakses karena properti ID sudah ditambahkan di data
    if (dishubObj && !allDinasIds.includes(dishubObj.id)) {
        relatedDinas.push({ id: dishubObj.id, name: dishubObj.nama, confidence: 75 });
        allDinasIds.push(dishubObj.id);
        reasoning.push("🌳 Skenario Pohon Tumbang: +Dishub (Lalin).");
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