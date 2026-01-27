// lib/aiClassifier.ts
import { supabase } from '@/lib/supabase'

// --- 1. DEFINISI TIPE DATA ---
export interface DinasProfile {
  id_dinas: string; 
  nama_dinas: string;
  email: string;
  tipe_dinas: string;
  kata_kunci: string[];
  priority_keywords: string[];
  bobot: number;
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
  urgensi?: string;
  lokasi?: string;
}

// --- 2. CACHING DATA (Supaya Cepat) ---
let DINAS_CACHE: DinasProfile[] | null = null;
let LAST_FETCH = 0;
const CACHE_DURATION = 1000 * 60 * 5; // Cache valid 5 menit

async function getDinasData(): Promise<DinasProfile[]> {
  const now = Date.now();
  
  // Cek cache dulu
  if (DINAS_CACHE && (now - LAST_FETCH < CACHE_DURATION)) {
    return DINAS_CACHE;
  }

  // Fetch dari Supabase
  const { data, error } = await supabase
    .from('dinas')
    .select('id_dinas, nama_dinas, email, tipe_dinas, kata_kunci, priority_keywords, bobot');

  if (error || !data) {
    console.error("❌ Gagal ambil data dinas:", error);
    return [];
  }

  DINAS_CACHE = data as DinasProfile[];
  LAST_FETCH = now;
  return DINAS_CACHE;
}

// --- 3. LOGIC UTAMA (CLASSIFIER) ---
export async function classifyLaporan(input: LaporanInput): Promise<ClassificationResult> {
  const text = `${input.judul} ${input.deskripsi} ${input.kategori}`.toLowerCase();
  
  // Ambil data dinas (dari cache/db)
  const listDinas = await getDinasData();

  const scores: Record<string, number> = {};
  const matchedKeywords: Record<string, string[]> = {};
  const reasoning: string[] = [];

  // --- STEP 1: SCORING ---
  listDinas.forEach((dinas) => {
    let score = 0;
    const matched: string[] = [];
    const keywords = dinas.kata_kunci || [];
    const priorities = dinas.priority_keywords || [];

    // Cek Keyword Biasa
    keywords.forEach(keyword => {
      const kw = keyword.toLowerCase();
      if (text.includes(kw)) {
        // Hitung berapa kali kata muncul
        const occurrences = (text.match(new RegExp(kw, 'g')) || []).length;
        score += 10 + (Math.min(occurrences - 1, 3) * 5); 
        matched.push(keyword);
      }
    });

    // Cek Keyword Prioritas (Bobot Besar)
    priorities.forEach(keyword => {
      const kw = keyword.toLowerCase();
      if (text.includes(kw)) {
        score += 40; // Bobot lebih besar untuk prioritas
        matched.push(`[PRIORITAS] ${keyword}`);
        reasoning.push(`⚠️ Deteksi Darurat (${dinas.nama_dinas}): "${keyword}"`);
      }
    });

    // Finalisasi Skor per Dinas
    if (score > 0) {
      score *= (dinas.bobot || 1.0); 
      if (input.urgensi === 'tinggi') score *= 1.2;
      
      scores[dinas.id_dinas] = score; 
      matchedKeywords[dinas.id_dinas] = matched; 
    }
  });

  // --- STEP 2: SORTING (Urutkan skor tertinggi) ---
  const sortedDinas = Object.entries(scores).sort(([, scoreA], [, scoreB]) => scoreB - scoreA);

  // Jika tidak ada satupun keyword yang cocok
  if (sortedDinas.length === 0) {
    return {
      primary_dinas: null,
      related_dinas: [],
      all_dinas_ids: [],
      reasoning: ["❌ Tidak ditemukan kata kunci yang relevan dengan dinas manapun."],
      keywords_matched: []
    };
  }

  // --- STEP 3: RESULT & THRESHOLD CHECK (Batas Minimal) ---
  const [topId, topScore] = sortedDinas[0];
  const topDinasProfile = listDinas.find(d => d.id_dinas === topId);
  
  if (!topDinasProfile) return { primary_dinas: null, related_dinas: [], all_dinas_ids: [], reasoning: ["Error Data"], keywords_matched: [] };

  // Hitung Confidence (Skor 60 dianggap 100% yakin)
  const confidence = Math.min(Math.round((topScore / 60) * 100), 99);

  // 🔥 LOGIC BARU: TOLAK JIKA DI BAWAH 50% 🔥
  // Ini mencegah kasus seperti "Semut berjalan" masuk ke Dinas PU hanya karena ada kata "jalan"
  if (confidence < 50) {
    return {
      primary_dinas: null, // Return NULL agar masuk ke manual assign
      related_dinas: [],
      all_dinas_ids: [],
      reasoning: [
        `⚠️ Skor tertinggi: ${confidence}% (${topDinasProfile.nama_dinas}).`,
        `❌ AI tidak cukup yakin (Threshold < 50%). Disarankan assign manual.`,
        `📝 Keyword terdeteksi: ${matchedKeywords[topId]?.join(', ') || '-'}`
      ],
      keywords_matched: matchedKeywords[topId] || []
    };
  }

  // --- STEP 4: FINAL SUCCESS RESULT ---
  // Jika lolos threshold, susun hasil sukses
  
  reasoning.push(`🎯 Analisis Utama: ${topDinasProfile.nama_dinas} (Skor: ${topScore.toFixed(0)})`);
  
  const allDinasIds: string[] = [topId];
  const relatedResults: { id: string; name: string; confidence: number }[] = [];

  // Cari Dinas Terkait (Related)
  // Hanya masukkan jika skornya minimal 40% dari juara 1
  for (let i = 1; i < sortedDinas.length; i++) {
    const [relId, relScore] = sortedDinas[i];
    const relProfile = listDinas.find(d => d.id_dinas === relId);

    if (relProfile && relScore > topScore * 0.4) {
      const relConf = Math.min(Math.round((relScore / 60) * 100), 90);
      relatedResults.push({
        id: relId,
        name: relProfile.nama_dinas,
        confidence: relConf
      });
      allDinasIds.push(relId);
      reasoning.push(`🔗 Terkait: ${relProfile.nama_dinas} (${relConf}% confidence).`);
    }
  }

  // Hardcoded Case: Pohon Tumbang (Contoh Skenario Kompleks)
  if (text.includes('pohon') && (text.includes('tumbang') || text.includes('roboh'))) {
    const dinasTaman = listDinas.find(d => d.nama_dinas.toLowerCase().includes('perumahan') || d.nama_dinas.toLowerCase().includes('taman'));
    const dinasLalin = listDinas.find(d => d.nama_dinas.toLowerCase().includes('perhubungan'));

    if (dinasTaman && !allDinasIds.includes(dinasTaman.id_dinas)) {
        relatedResults.push({ id: dinasTaman.id_dinas, name: dinasTaman.nama_dinas, confidence: 80 });
        allDinasIds.push(dinasTaman.id_dinas);
        reasoning.push("🌳 Skenario Pohon Tumbang: +Disperkimtan (Evakuasi).");
    }
    if (dinasLalin && !allDinasIds.includes(dinasLalin.id_dinas)) {
        relatedResults.push({ id: dinasLalin.id_dinas, name: dinasLalin.nama_dinas, confidence: 75 });
        allDinasIds.push(dinasLalin.id_dinas);
        reasoning.push("🚦 Skenario Pohon Tumbang: +Dishub (Lalin).");
    }
  }

  return {
    primary_dinas: { 
      id: topId, 
      name: topDinasProfile.nama_dinas, 
      confidence: confidence 
    },
    related_dinas: relatedResults.slice(0, 3), 
    all_dinas_ids: [...new Set(allDinasIds)], // Hapus duplikat ID
    reasoning,
    keywords_matched: matchedKeywords[topId] || []
  };
}