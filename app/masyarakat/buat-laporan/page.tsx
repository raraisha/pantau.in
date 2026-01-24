'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import { classifyLaporan } from '@/lib/aiClassifier'
import { Loader2, CheckCircle, AlertCircle, Upload, MapPin, FileText, XCircle, Send, ImageIcon, Tag, AlertTriangle, Search, Navigation } from 'lucide-react'

// --- Helper Functions ---

const isInsideBandung = (lat: number, lng: number): boolean => {
  const bandungBounds = {
    north: -6.8,
    south: -7.1,
    east: 107.75,
    west: 107.45
  }
  
  return (
    lat <= bandungBounds.north &&
    lat >= bandungBounds.south &&
    lng <= bandungBounds.east &&
    lng >= bandungBounds.west
  )
}

const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'LaporanMasyarakat/1.0'
        }
      }
    )
    
    if (!response.ok) throw new Error('Gagal mendapatkan alamat')
    
    const data = await response.json()
    return data.display_name || 'Alamat tidak ditemukan'
  } catch (error) {
    console.error('Error getting address:', error)
    return 'Gagal mendapatkan alamat'
  }
}

// Search Location Component
const LocationSearch = ({ onSelectLocation }: { onSelectLocation: (lat: number, lng: number) => void }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Bandung')}&limit=5`,
        {
          headers: {
            'User-Agent': 'LaporanMasyarakat/1.0'
          }
        }
      )
      
      const data = await response.json()
      setSearchResults(data)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Cari alamat di Bandung..."
          className="text-black flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#3E1C96] focus:border-[#3E1C96]"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          className="px-4 py-2.5 bg-[#3E1C96] text-white rounded-xl hover:bg-[#5429CC] transition-colors flex items-center gap-2"
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </button>
      </div>
      
      {searchResults.length > 0 && (
        <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
          {searchResults.map((result, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onSelectLocation(parseFloat(result.lat), parseFloat(result.lon))
                setSearchResults([])
                setSearchQuery('')
              }}
              className="w-full px-4 py-3 text-left hover:bg-purple-50 border-b border-gray-100 last:border-0 transition-colors"
            >
              <p className="text-sm font-medium text-gray-900">{result.display_name}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Mock Map Component
const MapContainer = ({ setLokasi, currentLocation }: { setLokasi: (loc: { lat: number; lng: number }) => void, currentLocation: { lat: number; lng: number } | null }) => {
  const handleMapClick = () => {
    setLokasi({ lat: -6.9175, lng: 107.6191 })
  }

  return (
    <div 
      onClick={handleMapClick}
      className="w-full h-full bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity relative"
    >
      {currentLocation ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
              <MapPin className="w-10 h-10 text-white" />
            </div>
            <p className="text-sm font-bold text-gray-700">Lokasi Dipilih</p>
            <p className="text-xs text-gray-500 mt-1">Lat: {currentLocation.lat.toFixed(4)}, Lng: {currentLocation.lng.toFixed(4)}</p>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <MapPin className="w-12 h-12 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600 font-medium">Klik untuk pilih lokasi</p>
          <p className="text-xs text-gray-500 mt-1">(Demo: akan set lokasi Bandung)</p>
        </div>
      )}
    </div>
  )
}

export default function BuatLaporanPage() {
  const [judul, setJudul] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [kategori, setKategori] = useState('Umum')
  const [urgensi, setUrgensi] = useState('sedang')
  const [foto, setFoto] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [lokasi, setLokasi] = useState<{ lat: number; lng: number } | null>(null)
  const [alamat, setAlamat] = useState<string>('')
  const [loadingAlamat, setLoadingAlamat] = useState(false)
  const [lokasiValid, setLokasiValid] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [masyarakatId, setMasyarakatId] = useState<string>('')
  const [gettingLocation, setGettingLocation] = useState(false)

  const addDebugLog = (message: string) => {
    console.log('🔍 DEBUG:', message)
  }

  // Auth Check
  useEffect(() => {
    const checkAuth = async () => {
      addDebugLog('Checking authentication...')
      
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) {
        addDebugLog('No auth user found')
        setError('⚠️ Anda harus login terlebih dahulu')
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
        return
      }

      const { data: masyarakatData, error: dbError } = await supabase
        .from('masyarakat')
        .select('id_masyarakat')
        .eq('email', authUser.email)
        .single()

      if (dbError || !masyarakatData) {
         addDebugLog(`❌ Failed to fetch profile: ${dbError?.message}`)
         setError('Profil masyarakat tidak ditemukan. Silakan login ulang.')
         return
      }

      setMasyarakatId(masyarakatData.id_masyarakat)
      addDebugLog(`✅ User ID set: ${masyarakatData.id_masyarakat}`)
    }

    checkAuth()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file maksimal 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        setError('File harus berupa gambar')
        return
      }

      setFoto(file)
      const reader = new FileReader()
      reader.onloadend = () => setFotoPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setFoto(null)
      setFotoPreview(null)
    }
  }

  const handleLokasiChange = async (newLokasi: { lat: number; lng: number }) => {
    setLokasi(newLokasi)
    setLoadingAlamat(true)
    setAlamat('')
    
    const isValid = isInsideBandung(newLokasi.lat, newLokasi.lng)
    setLokasiValid(isValid)
    
    if (isValid) {
      setError('')
      const address = await getAddressFromCoordinates(newLokasi.lat, newLokasi.lng)
      setAlamat(address)
    } else {
      setError('⚠️ Lokasi luar Bandung. Silakan pilih lokasi di dalam Kota Bandung.')
    }
    setLoadingAlamat(false)
  }

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation tidak didukung di browser Anda')
      return
    }

    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        handleLokasiChange({ lat: latitude, lng: longitude })
        setGettingLocation(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        setError('Gagal mendapatkan lokasi. Pastikan izin lokasi diaktifkan.')
        setGettingLocation(false)
      }
    )
  }

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    let createdLaporanId: string | null = null

    try {
      if (!masyarakatId) throw new Error('Sesi tidak valid. Silakan refresh halaman.')
      if (!lokasi || !lokasiValid) throw new Error('Lokasi harus dipilih dan valid.')

      addDebugLog('=== SUBMIT STARTED ===')

      // --- 1. Upload Foto ---
      let fotoUrls: string[] = []
      if (foto) {
        addDebugLog('📸 Uploading photo...')
        const fileExt = foto.name.split('.').pop()
        const fileName = `${masyarakatId}-${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('laporan_foto')
          .upload(fileName, foto)

        if (uploadError) throw new Error(`Gagal upload foto: ${uploadError.message}`)

        const { data: publicUrlData } = supabase.storage
          .from('laporan_foto')
          .getPublicUrl(fileName)
          
        fotoUrls.push(publicUrlData.publicUrl)
      }

      // --- 2. AI Classification ---
      addDebugLog('🤖 Running AI Classification...')
      
      // Gabungkan judul + deskripsi biar AI lebih pintar
      const aiResult = classifyLaporan({
        judul: judul.trim(),
        deskripsi: deskripsi.trim(),
        kategori: kategori,
        lokasi: alamat,
        urgensi: urgensi
      })

      // Cek Confidence
      const isHighConfidence = aiResult.primary_dinas && aiResult.primary_dinas.confidence >= 60 // Saya turunkan dikit ke 60 biar lebih gampang masuk
      const laporanStatus = isHighConfidence ? 'diproses' : 'menunggu' 

      // --- 3. Insert Laporan Induk ---
      const parentLaporanPayload = {
        id_masyarakat: masyarakatId,
        judul: judul.trim(),
        deskripsi: deskripsi.trim(),
        kategori_laporan: kategori,
        urgensi_laporan: urgensi,
        lokasi: alamat,
        latitude: lokasi.lat,
        longitude: lokasi.lng,
        laporan_foto: fotoUrls,
        status: laporanStatus,
        confidence: aiResult.primary_dinas?.confidence || 0,
        ai_reasoning: aiResult.reasoning.join('\n'), // Gabungkan alasan jadi string
        sumber_keputusan: 'ai',
        ai_recommendation: aiResult.primary_dinas?.name
      }

      const { data: insertedParent, error: parentError } = await supabase
        .from('laporan')
        .insert(parentLaporanPayload)
        .select()
        .single()

      if (parentError) throw new Error(`Database Error (Laporan): ${parentError.message}`)
      
      createdLaporanId = insertedParent.id_laporan
      addDebugLog(`✅ Laporan Induk Created: ID ${insertedParent.id_laporan}`)

      // --- 4. Insert Laporan Dinas (Jembatan) ---
      let assignedDinasNames: string[] = [] // Buat nampung nama dinas untuk pesan sukses

      if (isHighConfidence && aiResult.primary_dinas) {
        addDebugLog('⚡ Executing Auto-Assign to Dinas...')
        
        const dinasInserts = []

        // A. Masukkan PRIMARY Dinas
        dinasInserts.push({
          id_laporan: insertedParent.id_laporan,
          id_dinas: aiResult.primary_dinas.id,
          status_dinas: 'menunggu_assign', 
          catatan_dinas: `[AUTO AI - UTAMA] Skor: ${aiResult.primary_dinas.confidence}%`
        })
        assignedDinasNames.push(`🎯 ${aiResult.primary_dinas.name}`)

        // B. Masukkan RELATED Dinas (Looping Array)
        if (aiResult.related_dinas && aiResult.related_dinas.length > 0) {
           aiResult.related_dinas.forEach(d => {
             dinasInserts.push({
               id_laporan: insertedParent.id_laporan,
               id_dinas: d.id,
               status_dinas: 'menunggu_assign',
               catatan_dinas: `[AUTO AI - TERKAIT] Skor: ${d.confidence}%`
             })
             assignedDinasNames.push(`🔗 ${d.name}`)
           })
        }

        // C. Eksekusi Insert ke Supabase
        const { error: childError } = await supabase
          .from('laporan_dinas')
          .insert(dinasInserts)

        if (childError) {
           console.error("❌ Gagal Insert Dinas:", childError)
           // Opsional: Hapus laporan induk kalau gagal insert dinas
           if (createdLaporanId) await supabase.from('laporan').delete().eq('id_laporan', createdLaporanId)
           throw new Error(`Gagal meneruskan ke Dinas: ${childError.message}`)
        } else {
           addDebugLog(`✅ Assigned to ${dinasInserts.length} agencies.`)
        }
      } 

      // --- 5. Pesan Sukses ---
      // Update pesan ini supaya menampilkan SEMUA dinas
      const successMsg = isHighConfidence
        ? `✅ Laporan Berhasil & Diteruskan ke ${assignedDinasNames.length} Instansi!\n\n${assignedDinasNames.join('\n')}`
        : `✅ Laporan Berhasil Disimpan!\n\n⚠️ Menunggu verifikasi admin (Confidence AI rendah).`

      setSuccess(successMsg)
      
      // Reset Form
      setTimeout(() => {
        setJudul('')
        setDeskripsi('')
        setFoto(null)
        setFotoPreview(null)
        setLokasi(null)
        setAlamat('')
        setLokasiValid(null)
      }, 5000)

    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-[#FDF7EE] via-[#f8f4ff] to-[#FDF7EE] pt-20">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-[#3E1C96] via-[#5429CC] to-[#6B35E8] text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl backdrop-blur-sm mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Buat Laporan Baru</h1>
            <p className="text-purple-100 text-base max-w-2xl mx-auto">Sampaikan keluhan atau laporan Anda. Kami akan segera menindaklanjuti.</p>
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <MapPin className="w-4 h-4 text-red-300" />
              <span className="text-sm font-medium">Khusus wilayah Kota Bandung</span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Feedback Messages */}
          {success && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-green-50 border-2 border-green-200 shadow-sm animate-pulse">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <p className="text-sm text-green-800 font-semibold whitespace-pre-line">{success}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border-2 border-red-200 shadow-sm">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-800 font-semibold">{error}</p>
            </div>
          )}

          {/* Form */}
          <div onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100">
              
              {/* Judul */}
              <div className="p-6">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
                  <FileText className="w-4 h-4 text-[#3E1C96]" /> Judul Laporan <span className="text-red-500">*</span>
                </label>
                <input type="text" value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Contoh: Jalan berlubang di depan sekolah" className="w-full px-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-[#3E1C96] focus:border-[#3E1C96] text-black text-sm" required />
              </div>

              {/* Kategori & Urgensi */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3"><Tag className="w-4 h-4 text-[#3E1C96]" /> Kategori</label>
                  <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="w-full px-4 py-3.5 border-2 rounded-xl bg-white text-black text-sm">
                    {['Umum', 'Infrastruktur', 'Kebersihan', 'Keamanan', 'Lingkungan', 'Kesehatan', 'Transportasi', 'Sosial', 'Pendidikan', 'Lainnya'].map(k => (
                       <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3"><AlertTriangle className="w-4 h-4 text-[#3E1C96]" /> Urgensi</label>
                  <select value={urgensi} onChange={(e) => setUrgensi(e.target.value)} className="w-full px-4 py-3.5 border-2 rounded-xl bg-white text-black text-sm">
                    <option value="rendah">🟢 Rendah</option>
                    <option value="sedang">🟡 Sedang</option>
                    <option value="tinggi">🔴 Tinggi</option>
                  </select>
                </div>
              </div>

              {/* Deskripsi */}
              <div className="p-6">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3"><FileText className="w-4 h-4 text-[#3E1C96]" /> Deskripsi Lengkap <span className="text-red-500">*</span></label>
                <textarea value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} rows={5} placeholder="Jelaskan masalah secara detail..." className="w-full px-4 py-3.5 border-2 rounded-xl text-black text-sm" required minLength={20} />
                <div className="flex justify-between mt-2">
                   <p className="text-xs text-gray-500">Min 20 karakter.</p>
                   <p className={`text-xs font-semibold ${deskripsi.length >= 20 ? 'text-green-600' : 'text-gray-400'}`}>{deskripsi.length}/20</p>
                </div>
              </div>

              {/* Foto */}
              <div className="p-6">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3"><ImageIcon className="w-4 h-4 text-[#3E1C96]" /> Upload Foto <span className="text-gray-400 font-normal">(Opsional)</span></label>
                {!fotoPreview ? (
                  <>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="file-upload" />
                    <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#3E1C96] hover:bg-purple-50/30 transition-all">
                      <Upload className="w-6 h-6 text-gray-400 mb-2" />
                      <p className="text-sm font-semibold text-gray-700">Klik untuk upload gambar</p>
                    </label>
                  </>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border-2 shadow-lg">
                    <img src={fotoPreview} alt="Preview" className="w-full h-64 object-cover" />
                    <button type="button" onClick={() => { setFoto(null); setFotoPreview(null); }} className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"><XCircle className="w-5 h-5" /></button>
                  </div>
                )}
              </div>

              {/* Lokasi */}
              <div className="p-6">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4"><MapPin className="w-4 h-4 text-[#3E1C96]" /> Pilih Lokasi <span className="text-red-500">*</span></label>
                
                {/* Location Options */}
                <div className="mb-4 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={gettingLocation}
                    className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 font-semibold"
                  >
                    {gettingLocation ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Mendapatkan Lokasi...</>
                    ) : (
                      <><Navigation className="w-4 h-4" /> Gunakan Lokasi Saat Ini</>
                    )}
                  </button>
                </div>

                {/* Search Location */}
                <LocationSearch onSelectLocation={(lat, lng) => handleLokasiChange({ lat, lng })} />

                {/* Map */}
                <div className="rounded-xl overflow-hidden border-2 h-80 my-4 shadow-lg">
                   <MapContainer setLokasi={handleLokasiChange} currentLocation={lokasi} />
                </div>
                
                {loadingAlamat && <div className="p-3 bg-blue-50 text-blue-700 rounded-lg flex items-center gap-2"><Loader2 className="animate-spin w-4 h-4"/> Mencari alamat...</div>}
                
                {lokasi && lokasiValid && !loadingAlamat && (
                   <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                      <p className="text-sm font-bold text-green-800 mb-1">✅ Lokasi Valid</p>
                      <p className="text-xs text-gray-600">{alamat}</p>
                   </div>
                )}
                
                {lokasi && lokasiValid === false && (
                   <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-sm font-bold text-red-800">❌ Lokasi di luar Bandung</p>
                   </div>
                )}
              </div>

              {/* Submit */}
              <div className="p-6 bg-gray-50">
                <button 
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading || !lokasiValid || !masyarakatId} 
                  className="w-full py-4 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-[#3E1C96] to-[#5429CC] hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                >
                  {loading ? <><Loader2 className="animate-spin" /> Mengirim...</> : <><Send className="w-5 h-5" /> Kirim Laporan</>}
                </button>
                <p className="text-xs text-center text-gray-500 mt-4">🔒 Laporan diproses otomatis oleh sistem AI & diteruskan ke dinas terkait.</p>
              </div>

            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}