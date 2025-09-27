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

// Generate dummy danger notifications
const generateDummyNotifications = (): Notification[] => {
  const now = new Date()
  const dummyUserId = 'demo-user-' + Date.now()
  
  const notifications: Notification[] = [
    {
      id: 'notif-1',
      user_id: dummyUserId,
      title: '🚨 CRITICAL: Flash Flood Warning',
      message: 'Heavy rainfall detected in Cyberjaya area. Flash flood warning issued for the next 3 hours. Avoid low-lying areas and seek higher ground immediately.',
      notification_type: 'emergency_alert',
      severity: 'critical',
      data: {
        location: 'Cyberjaya, Selangor',
        alert_type: 'flood',
        duration: '3 hours',
        affected_areas: ['Persiaran APEC', 'Shaftsbury Square', 'Cyberjaya University']
      },
      is_read: false,
      is_sent: true,
      scheduled_for: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      sent_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString()
    },
    {
      id: 'notif-2',
      user_id: dummyUserId,
      title: '⚠️ HIGH: Severe Thunderstorm Alert',
      message: 'Severe thunderstorm approaching Putrajaya-Cyberjaya corridor. Strong winds up to 80 km/h expected. Secure loose objects and avoid outdoor activities.',
      notification_type: 'weather_alert',
      severity: 'high',
      data: {
        location: 'Putrajaya-Cyberjaya',
        alert_type: 'thunderstorm',
        wind_speed: '80 km/h',
        duration: '2 hours'
      },
      is_read: false,
      is_sent: true,
      scheduled_for: new Date(now.getTime() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      sent_at: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 15 * 60 * 1000).toISOString()
    },
    {
      id: 'notif-3',
      user_id: dummyUserId,
      title: '🔥 MEDIUM: Haze Alert',
      message: 'Air Pollution Index (API) in Klang Valley has reached unhealthy levels (API: 150). Limit outdoor activities and wear N95 masks when going outside.',
      notification_type: 'health_alert',
      severity: 'medium',
      data: {
        location: 'Klang Valley',
        alert_type: 'air_pollution',
        api_reading: 150,
        health_advice: 'Limit outdoor activities, wear N95 masks'
      },
      is_read: true,
      is_sent: true,
      scheduled_for: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      sent_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'notif-4',
      user_id: dummyUserId,
      title: '🚧 MEDIUM: Road Closure Alert',
      message: 'Emergency road closure on Persiaran Multimedia due to fallen tree. Traffic diverted via Persiaran APEC. Estimated clearance time: 1 hour.',
      notification_type: 'traffic_alert',
      severity: 'medium',
      data: {
        location: 'Persiaran Multimedia, Cyberjaya',
        alert_type: 'road_closure',
        cause: 'fallen_tree',
        alternate_route: 'Persiaran APEC',
        estimated_clearance: '1 hour'
      },
      is_read: false,
      is_sent: true,
      scheduled_for: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      sent_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString()
    },
    {
      id: 'notif-5',
      user_id: dummyUserId,
      title: '🏥 LOW: Medical Facility Update',
      message: 'Cyberjaya Medical Centre emergency department is currently at 85% capacity. Consider nearby alternatives for non-urgent cases.',
      notification_type: 'resource_alert',
      severity: 'low',
      data: {
        facility: 'Cyberjaya Medical Centre',
        alert_type: 'capacity_update',
        capacity_level: '85%',
        alternatives: ['Putrajaya Hospital', 'Klinik Kesihatan Cyberjaya']
      },
      is_read: true,
      is_sent: true,
      scheduled_for: new Date(now.getTime() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
      sent_at: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 45 * 60 * 1000).toISOString()
    },
    {
      id: 'notif-6',
      user_id: dummyUserId,
      title: '🌊 CRITICAL: Tsunami Watch',
      message: 'Tsunami watch issued for West Coast Peninsular Malaysia following 7.2 magnitude earthquake in Sumatra. Monitor official channels for updates.',
      notification_type: 'emergency_alert',
      severity: 'critical',
      data: {
        location: 'West Coast Peninsular Malaysia',
        alert_type: 'tsunami',
        trigger_event: '7.2 magnitude earthquake in Sumatra',
        status: 'watch'
      },
      is_read: false,
      is_sent: true,
      scheduled_for: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      sent_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'notif-7',
      user_id: dummyUserId,
      title: '⚡ HIGH: Power Outage Alert',
      message: 'Scheduled power maintenance in Cyberjaya Sector 7 from 2:00 AM to 6:00 AM tomorrow. Backup generators activated for critical facilities.',
      notification_type: 'infrastructure_alert',
      severity: 'high',
      data: {
        location: 'Cyberjaya Sector 7',
        alert_type: 'power_outage',
        type: 'scheduled_maintenance',
        start_time: '2:00 AM',
        end_time: '6:00 AM',
        date: 'tomorrow'
      },
      is_read: true,
      is_sent: true,
      scheduled_for: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      sent_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'notif-8',
      user_id: dummyUserId,
      title: '🔥 CRITICAL: Building Fire Emergency',
      message: 'Fire reported at Shaftsbury Square, Level 3. Building evacuation in progress. Emergency services on site. Avoid the area.',
      notification_type: 'emergency_alert',
      severity: 'critical',
      data: {
        location: 'Shaftsbury Square, Level 3, Cyberjaya',
        alert_type: 'building_fire',
        status: 'evacuation_in_progress',
        emergency_services: 'on_site'
      },
      is_read: false,
      is_sent: true,
      scheduled_for: new Date(now.getTime() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
      sent_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString()
    }
  ]
  
  return notifications
}

export const useNotificationStore = create<NotificationStore>()(
  subscribeWithSelector((set, get) => ({
    // State
    notifications: generateDummyNotifications(),
    unreadCount: generateDummyNotifications().filter(n => !n.is_read).length,
    loading: false,
    error: null,
    isSubscribed: false,

    // Actions
    fetchNotifications: async () => {
      set({ loading: true, error: null })
      
      try {
        // In demo mode, use dummy notifications
        const dummyNotifications = generateDummyNotifications()
        const unreadCount = dummyNotifications.filter(n => !n.is_read).length
        
        set({ 
          notifications: dummyNotifications,
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
        // In demo mode, just update the local state
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
        // In demo mode, just update the local state
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
