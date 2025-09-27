import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { Notification, NotificationInsert, NotificationUpdate } from '@/lib/database.types'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  isSubscribed: boolean
}

interface NotificationActions {
  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  clearAllNotifications: () => Promise<void>
  createNotification: (notification: NotificationInsert) => Promise<void>
  subscribeToNotifications: () => () => void
  clearError: () => void
}

type NotificationStore = NotificationState & NotificationActions

export const useNotificationStore = create<NotificationStore>()(
  subscribeWithSelector((set, get) => ({
    // State
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
    isSubscribed: false,

    // Actions
    fetchNotifications: async () => {
      set({ loading: true, error: null })
      
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          set({ loading: false })
          return
        }
        
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50) // Limit to recent 50 notifications
        
        if (error) throw error
        
        const unreadCount = data.filter(n => !n.is_read).length
        
        set({ 
          notifications: data,
          unreadCount,
          loading: false 
        })
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch notifications',
          loading: false 
        })
      }
    },

    markAsRead: async (id: string) => {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', id)
        
        if (error) throw error
        
        set(state => ({
          notifications: state.notifications.map(n => 
            n.id === id ? { ...n, is_read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1)
        }))
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to mark notification as read'
        })
      }
    },

    markAllAsRead: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', user.id)
          .eq('is_read', false)
        
        if (error) throw error
        
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, is_read: true })),
          unreadCount: 0
        }))
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to mark all notifications as read'
        })
      }
    },

    deleteNotification: async (id: string) => {
      try {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', id)
        
        if (error) throw error
        
        set(state => {
          const notification = state.notifications.find(n => n.id === id)
          const unreadCountDecrease = notification && !notification.is_read ? 1 : 0
          
          return {
            notifications: state.notifications.filter(n => n.id !== id),
            unreadCount: Math.max(0, state.unreadCount - unreadCountDecrease)
          }
        })
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to delete notification'
        })
      }
    },

    clearAllNotifications: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('user_id', user.id)
        
        if (error) throw error
        
        set({
          notifications: [],
          unreadCount: 0
        })
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to clear notifications'
        })
      }
    },

    createNotification: async (notification: NotificationInsert) => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .insert(notification)
          .select()
          .single()
        
        if (error) throw error
        
        set(state => ({
          notifications: [data, ...state.notifications],
          unreadCount: !data.is_read ? state.unreadCount + 1 : state.unreadCount
        }))
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to create notification'
        })
        throw error
      }
    },

    subscribeToNotifications: () => {
      const { isSubscribed } = get()
      if (isSubscribed) {
        return () => {} // Already subscribed
      }
      
      set({ isSubscribed: true })
      
      const subscription = supabase
        .channel('user-notifications')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${supabase.auth.getUser().then(({ data: { user } }) => user?.id)}`
        }, (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload
          
          set(state => {
            switch (eventType) {
              case 'INSERT':
                if (newRecord) {
                  const notification = newRecord as Notification
                  return {
                    ...state,
                    notifications: [notification, ...state.notifications],
                    unreadCount: !notification.is_read ? state.unreadCount + 1 : state.unreadCount
                  }
                }
                break
              case 'UPDATE':
                if (newRecord && oldRecord) {
                  const updatedNotification = newRecord as Notification
                  const oldNotification = oldRecord as Notification
                  
                  let unreadCountChange = 0
                  if (oldNotification.is_read !== updatedNotification.is_read) {
                    unreadCountChange = updatedNotification.is_read ? -1 : 1
                  }
                  
                  return {
                    ...state,
                    notifications: state.notifications.map(n => 
                      n.id === updatedNotification.id ? updatedNotification : n
                    ),
                    unreadCount: Math.max(0, state.unreadCount + unreadCountChange)
                  }
                }
                break
              case 'DELETE':
                if (oldRecord) {
                  const deletedNotification = oldRecord as Notification
                  const unreadCountDecrease = !deletedNotification.is_read ? 1 : 0
                  
                  return {
                    ...state,
                    notifications: state.notifications.filter(n => n.id !== deletedNotification.id),
                    unreadCount: Math.max(0, state.unreadCount - unreadCountDecrease)
                  }
                }
                break
            }
            return state
          })
        })
        .subscribe()
      
      return () => {
        subscription.unsubscribe()
        set({ isSubscribed: false })
      }
    },

    clearError: () => set({ error: null })
  }))
)

// Auto-subscribe to notifications when user is authenticated
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    useNotificationStore.getState().fetchNotifications()
    useNotificationStore.getState().subscribeToNotifications()
  } else if (event === 'SIGNED_OUT') {
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
      isSubscribed: false
    })
  }
})
