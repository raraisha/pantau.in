'use client'

import { useState, useEffect } from 'react'
import { Phone, MapPin, Copy, Siren, Ambulance, Flame, ShieldAlert, X } from 'lucide-react'

// Konfigurasi Nomor Darurat
const emergencyContacts = [
  { 
    name: 'Layanan Darurat Utama', 
    number: '+6287782446000', 
    desc: 'Semua Kedaruratan', 
    icon: <Siren className="w-8 h-8 text-white" />,
    bg: 'bg-red-600',
    primary: true 
  },
  { 
    name: 'Polisi', 
    number: '110', 
    desc: 'Kriminal & Kecelakaan', 
    icon: <ShieldAlert className="w-6 h-6 text-blue-700" />,
    bg: 'bg-blue-100' 
  },
  { 
    name: 'Ambulans', 
    number: '119', 
    desc: 'Medis & Gawat Darurat', 
    icon: <Ambulance className="w-6 h-6 text-green-700" />,
    bg: 'bg-green-100' 
  },
  { 
    name: 'Pemadam Kebakaran', 
    number: '113', 
    desc: 'Kebakaran & Penyelamatan', 
    icon: <Flame className="w-6 h-6 text-orange-700" />,
    bg: 'bg-orange-100' 
  }
]

export default function EmergencyButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [address, setAddress] = useState<string>('Mencari lokasi...')
  
  // Ambil lokasi saat modal dibuka
  useEffect(() => {
    if (isOpen && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords
        try {
          // Cari nama jalan dari koordinat (Gratis via OpenStreetMap)
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
          const data = await res.json()
          setAddress(data.display_name || 'Lokasi terdeteksi (Koordinat GPS)')
        } catch (e) {
          setAddress(`Lat: ${latitude}, Long: ${longitude}`)
        }
      }, () => setAddress('Gagal mendeteksi lokasi. Pastikan GPS aktif.'))
    }
  }, [isOpen])

  const copyAddress = () => {
    navigator.clipboard.writeText(address)
    alert('Alamat tersalin!')
  }

  return (
    <>
      {/* --- TOMBOL MENGAMBANG (POSISI KIRI BAWAH) --- */}
      <div className="fixed bottom-6 left-6 z-[9999] group">
        
        {/* Tooltip Hover */}
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1 bg-gray-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Panggilan Darurat
          {/* Panah tooltip */}
          <div className="absolute top-1/2 right-full -translate-y-1/2 -mr-1 border-4 border-transparent border-r-gray-900"></div>
        </div>

        {/* Tombol Utama */}
        <button
          onClick={() => setIsOpen(true)}
          className="relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-red-600 rounded-full shadow-[0_4px_20px_rgba(220,38,38,0.6)] hover:scale-110 active:scale-95 transition-all duration-300 border-4 border-white/20"
        >
          {/* Efek Ping (Radar) */}
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
          
          <Phone className="w-7 h-7 md:w-8 md:h-8 text-white fill-white relative z-10" />
          
          {/* Badge SOS */}
          <span className="absolute -top-1 -right-1 bg-yellow-400 text-red-700 text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-white z-20 shadow-sm">
            SOS
          </span>
        </button>
      </div>

      {/* --- MODAL POPUP --- */}
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center p-4 sm:p-6">
          
          {/* Backdrop Gelap */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsOpen(false)}
          />

          {/* Konten Modal */}
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
            
            {/* Header Merah */}
            <div className="bg-gradient-to-br from-red-600 to-red-700 p-5 text-center relative">
               <button 
                  onClick={() => setIsOpen(false)}
                  className="absolute top-3 right-3 p-2 bg-black/10 text-white rounded-full hover:bg-black/20 transition-colors"
               >
                 <X className="w-5 h-5" />
               </button>
               <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 backdrop-blur-md">
                 <Siren className="w-6 h-6 text-white animate-pulse" />
               </div>
               <h2 className="text-xl font-black text-white uppercase tracking-wider">Emergency Call</h2>
               <p className="text-red-100 text-xs">Bantuan langsung terhubung ke operator</p>
            </div>

            {/* Lokasi User */}
            <div className="px-5 -mt-4 relative z-10">
              <div className="bg-white p-3 rounded-xl shadow-md border border-gray-100 flex gap-3 items-start">
                 <MapPin className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                 <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Lokasi Anda Sekarang</p>
                    <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-relaxed my-0.5">{address}</p>
                    <button onClick={copyAddress} className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1">
                       <Copy className="w-3 h-3" /> Salin Alamat
                    </button>
                 </div>
              </div>
            </div>

            {/* List Nomor */}
            <div className="p-5 space-y-2.5">
               {emergencyContacts.map((contact, idx) => (
                 <a
                   key={idx}
                   href={`tel:${contact.number}`}
                   className={`flex items-center gap-3 p-3 rounded-xl border transition-all active:scale-95 ${
                     contact.primary 
                       ? 'bg-red-50 border-red-200 hover:bg-red-100' 
                       : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm'
                   }`}
                 >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${contact.bg}`}>
                       {contact.icon}
                    </div>
                    <div className="flex-1">
                       <p className="font-bold text-gray-900 text-sm">{contact.name}</p>
                       <p className="text-[10px] text-gray-500">{contact.desc}</p>
                    </div>
                    <div className="text-lg font-black text-gray-800 tracking-wider">
                       {contact.number}
                    </div>
                 </a>
               ))}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-3 text-center">
              <p className="text-[10px] text-gray-400">
                ⚠️ Gunakan hanya untuk keadaan darurat.
              </p>
            </div>
            
          </div>
        </div>
      )}
    </>
  )
}