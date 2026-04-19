import { create } from 'zustand'

export interface Notification {
  id: string
  type: string
  title: string
  body: string
  is_read: boolean
  metadata_data?: any
  created_at: string
}

interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  setInitialUnreadCount: (count: number) => void
  setNotifications: (notifications: Notification[]) => void
  addNotification: (n: Notification) => void
  markRead: (id: string) => void
  markAllRead: () => void
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  setInitialUnreadCount: (count) => set({ unreadCount: count }),
  setNotifications: (n) => set({ notifications: n }),
  addNotification: (n) => set((state) => ({
    notifications: [n, ...state.notifications],
    unreadCount: state.unreadCount + 1
  })),
  markRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) => 
      n.id === id ? { ...n, is_read: true } : n
    ),
    unreadCount: Math.max(0, state.unreadCount - 1)
  })),
  markAllRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, is_read: true })),
    unreadCount: 0
  }))
}))
