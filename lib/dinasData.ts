// lib/dinasData.ts

export interface DinasInfo {
  nama: string;
  email: string;
  tipe: string;
  kata_kunci: string[];
  priority_keywords: string[];
  weight: number;
}

export const DINAS_DATABASE: Record<string, DinasInfo> = {
  '15c6f5c5-9acf-4226-b1b1-2b9d5845d396': {
    nama: 'Dinas Pekerjaan Umum / Bina Marga',
    email: 'dinaspu@bandung.go.id',
    tipe: 'Infrastruktur',
    kata_kunci: ["jalan","jembatan","drainase","trotoar","aspal","lubang","berlubang","rusak","putus","ambruk","bailey","pondasi","oprit","fly over","underpass","turap","dinding penahan","gorong-gorong","saluran air","paving","konstruksi","perbaikan"],
    priority_keywords: ['jembatan', 'jalan rusak', 'lubang', 'drainase', 'putus', 'ambruk'],
    weight: 1.5
  },
  '4b6dc8e8-22b7-4eb6-8037-0782e0976290': {
    nama: 'Dinas Kebakaran dan Penanggulangan Bencana (BPBD)',
    email: 'damkar@bandung.go.id',
    tipe: 'Kebakaran & Kebencanaan',
    kata_kunci: ["kebakaran","api","damkar","darurat","emergency","bencana","gempa","banjir","longsor","tanah longsor","pohon tumbang","evakuasi","SAR","penyelamatan","logistik","pengungsian","tanggap darurat","roboh"],
    priority_keywords: ['kebakaran', 'bencana', 'banjir', 'longsor', 'darurat', 'evakuasi'],
    weight: 2.0
  },
  '2f509e37-4e6d-40e9-b759-78580560d275': {
    nama: 'Dinas Perhubungan',
    email: 'dishub@bandung.go.id',
    tipe: 'Transportasi',
    kata_kunci: ["lalu lintas","lalin","macet","rekayasa","pengalihan","penutupan","jalur alternatif","rambu","marka","traffic light","lampu merah","terminal","parkir","zebra cross","penyeberangan"],
    priority_keywords: ['macet', 'rekayasa', 'pengalihan', 'penutupan', 'traffic light'],
    weight: 1.2
  },
  'diskominfosantik-uuid-001': {
    nama: 'Dinas Komunikasi dan Informatika (Diskominfosantik)',
    email: 'diskominfo@bandung.go.id',
    tipe: 'Informasi Publik',
    kata_kunci: ["informasi","pengumuman","sosialisasi","berita","publikasi","media sosial","siaran pers","akses darurat","edukasi","pengumuman publik"],
    priority_keywords: ['pengumuman', 'akses darurat', 'publikasi', 'informasi'],
    weight: 1.0
  },
  '33318c1a-fcaf-4be3-8cb1-b67a317df20f': {
    nama: 'Dinas Lingkungan Hidup dan Kebersihan',
    email: 'dlhk@bandung.go.id',
    tipe: 'Lingkungan',
    kata_kunci: ["sampah","tpa","tps","kebersihan","pencemaran","limbah","polusi","bau","kotor","sungai","kali","truk sampah","pengangkutan"],
    priority_keywords: ['sampah', 'pencemaran', 'limbah', 'bau'],
    weight: 1.2
  },
  '057bb7ff-91d2-4c7a-a975-438fd7f7ae90': {
    nama: 'Dinas Kesehatan',
    email: 'dinkes@bandung.go.id',
    tipe: 'Kesehatan',
    kata_kunci: ["puskesmas","rumah sakit","obat","pasien","vaksin","stunting","wabah","penyakit","ambulans","igd","dbd","virus","kesehatan","medis"],
    priority_keywords: ['wabah', 'penyakit', 'ambulans', 'igd', 'medis'],
    weight: 1.4
  },
  '1ffb7f65-e2ea-4cb0-a2c2-c1ef36774b9b': {
    nama: 'Satuan Polisi Pamong Praja (Satpol PP)',
    email: 'satpolpp@bandung.go.id',
    tipe: 'Ketertiban',
    kata_kunci: ["tertib","razia","pkl","pedagang","liar","segel","bongkar","preman","tawuran","demo","unjuk rasa","keamanan","patroli"],
    priority_keywords: ['pkl', 'liar', 'tawuran', 'segel'],
    weight: 1.2
  }
};