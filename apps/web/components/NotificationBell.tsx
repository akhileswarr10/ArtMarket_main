'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useNotificationStore } from '@/lib/stores/notificationStore'
import { getNotifications, getNotificationUnreadCount, markAllNotificationsRead, markNotificationRead } from '@/lib/api/client'
import { Bell, Circle } from 'lucide-react'

export default function NotificationBell({ userId }: { userId: string }) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, setInitialUnreadCount, setNotifications, addNotification, markRead, markAllRead } = useNotificationStore()

  useEffect(() => {
    if (!userId) return

    getNotificationUnreadCount().then(data => {
        setInitialUnreadCount(data.count)
    })

    getNotifications(0, 10).then(data => {
        setNotifications(data.notifications)
    })

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${userId}` 
      }, (payload) => {
        addNotification(payload.new as any)
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [userId])

  const handleMarkRead = async (id: string, e: any) => {
      e.stopPropagation()
      await markNotificationRead(id)
      markRead(id)
  }

  const handleMarkAllRead = async () => {
      await markAllNotificationsRead()
      markAllRead()
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="p-2 text-slate-400 hover:text-white transition-colors relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-slate-950" />
        )}
      </button>

      {open && (
        <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 mt-3 w-80 max-h-96 overflow-y-auto bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-2 z-20 backdrop-blur-xl">
                <div className="flex justify-between items-center p-3 border-b border-white/10">
                    <h3 className="font-bold text-white text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="text-xs text-indigo-400 hover:text-indigo-300">
                            Mark all read
                        </button>
                    )}
                </div>
                <div className="py-2">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500">No recent notifications</div>
                    ) : (
                        notifications.map(n => (
                            <div key={n.id} className={`p-3 rounded-xl flex gap-3 ${!n.is_read ? 'bg-white/5' : 'hover:bg-white/5'} transition-colors cursor-pointer mb-1`}>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-200">{n.title}</p>
                                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{n.body}</p>
                                    <p className="text-[10px] text-slate-500 mt-2">
                                        {new Date(n.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                {!n.is_read && (
                                    <button onClick={(e) => handleMarkRead(n.id, e)} className="shrink-0 text-slate-500 hover:text-indigo-400 transition-colors">
                                        <Circle className="w-4 h-4 fill-indigo-500 text-indigo-500" />
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
      )}
    </div>
  )
}
