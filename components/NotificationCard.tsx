'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Bell } from 'lucide-react'

type Notif = {
  id: string
  judul: string
  created_at: string
}

export default function NotificationCard() {
  const [notifs, setNotifs] = useState<Notif[]>([])

  useEffect(() => {
    fetchNotifs()

    // subscribe realtime Supabase
    const channel = supabase
      .channel('laporan-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'laporan' },
        (payload) => {
          const newNotif = {
            id: payload.new.id,
            judul: payload.new.judul,
            created_at: payload.new.created_at,
          }
          setNotifs((prev) => [newNotif, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchNotifs = async () => {
    const { data, error } = await supabase
      .from('laporan')
      .select('id, judul, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (!error && data) setNotifs(data)
  }

  return (
    <div className="fixed top-20 right-6 w-80">
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-5 h-5 text-[#3E1C96]" />
          <h3 className="text-lg font-bold text-[#3E1C96]">Notifikasi</h3>
        </div>
        {notifs.length > 0 ? (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {notifs.map((n) => (
              <li
                key={n.id}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                onClick={() => (window.location.href = `/admin/laporan/${n.id}`)}
              >
                <p className="text-sm font-medium text-black">{n.judul}</p>
                <span className="text-xs text-gray-500">
                  {new Date(n.created_at).toLocaleString('id-ID')}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">Belum ada notifikasi baru.</p>
        )}
      </div>
    </div>
  )
}
