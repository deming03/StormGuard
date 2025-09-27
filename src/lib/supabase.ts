// @ts-ignore - Module resolution issue, works at runtime
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key'

// Only throw error in production
if (import.meta.env.PROD && (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY)) {
  throw new Error('Missing Supabase environment variables')
}

// Create a mock client for demo mode
const createMockClient = () => ({
  auth: {
    signInWithPassword: ({ email, password }: { email: string; password: string }) => {
      // Demo mode: simulate successful authentication
      const mockUser = {
        id: 'demo-user-' + Date.now(),
        email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        email_confirmed_at: new Date().toISOString(),
        user_metadata: { full_name: 'Demo User' },
        app_metadata: {},
        aud: 'authenticated',
        role: 'authenticated'
      }
      const mockSession = {
        access_token: 'demo-token',
        refresh_token: 'demo-refresh',
        expires_in: 3600,
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer',
        user: mockUser
      }
      return Promise.resolve({ 
        data: { user: mockUser, session: mockSession }, 
        error: null 
      })
    },
    signUp: ({ email, password, options }: { email: string; password: string; options?: any }) => {
      // Demo mode: simulate successful registration
      const mockUser = {
        id: 'demo-user-' + Date.now(),
        email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        email_confirmed_at: new Date().toISOString(),
        user_metadata: options?.data || {},
        app_metadata: {},
        aud: 'authenticated',
        role: 'authenticated'
      }
      const mockSession = {
        access_token: 'demo-token',
        refresh_token: 'demo-refresh',
        expires_in: 3600,
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer',
        user: mockUser
      }
      return Promise.resolve({ 
        data: { user: mockUser, session: mockSession }, 
        error: null 
      })
    },
    signOut: () => Promise.resolve({ error: null }),
    getUser: () => Promise.resolve({ 
      data: { 
        user: {
          id: 'demo-user',
          email: 'demo@example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_metadata: { full_name: 'Demo User' }
        }
      }, 
      error: null 
    }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: (callback: Function) => {
      // Return a subscription object
      return { 
        data: { 
          subscription: { 
            unsubscribe: () => {} 
          } 
        } 
      }
    }
  },
  from: (table: string) => ({
    select: () => ({ data: [], error: null }),
    insert: (data: any) => {
      // Simulate successful profile creation
      if (table === 'profiles') {
        return Promise.resolve({ 
          data: { 
            id: data.id,
            email: data.email,
            full_name: data.full_name,
            role: data.role || 'citizen',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, 
          error: null 
        })
      }
      return Promise.resolve({ data: data, error: null })
    },
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
    eq: function(column: string, value: any) { return this },
    single: function() { return Promise.resolve({ data: null, error: null }) }
  }),
  channel: () => ({
    on: () => ({ subscribe: () => {} })
  }),
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: null, error: { message: 'Demo mode: Storage not available' } }),
      getPublicUrl: () => ({ data: { publicUrl: '' } })
    })
  }
})

export const supabase = (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder_key') 
  ? createMockClient() as any
  : createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })

// Helper functions for common operations
export const auth = {
  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),
  
  signUp: (email: string, password: string, metadata?: Record<string, any>) =>
    supabase.auth.signUp({ email, password, options: { data: metadata } }),
  
  signOut: () => supabase.auth.signOut(),
  
  getUser: () => supabase.auth.getUser(),
  
  getSession: () => supabase.auth.getSession(),
  
  onAuthStateChange: (callback: (event: string, session: any) => void) =>
    supabase.auth.onAuthStateChange(callback)
}

// Location utilities for PostGIS
export const location = {
  // Convert [longitude, latitude] to PostGIS point string
  toPostGIS: (coordinates: [number, number]): string => {
    return `POINT(${coordinates[0]} ${coordinates[1]})`
  },
  
  // Parse PostGIS point string to coordinates
  fromPostGIS: (postgisPoint: string): [number, number] => {
    const match = postgisPoint.match(/POINT\(([+-]?\d*\.?\d+)\s+([+-]?\d*\.?\d+)\)/)
    if (!match) throw new Error('Invalid PostGIS point format')
    return [parseFloat(match[1]), parseFloat(match[2])]
  },
  
  // Create GeoJSON Point
  createPoint: (longitude: number, latitude: number) => ({
    type: 'Point' as const,
    coordinates: [longitude, latitude] as [number, number]
  }),
  
  // Calculate distance between two points (Haversine formula)
  calculateDistance: (
    point1: [number, number], 
    point2: [number, number]
  ): number => {
    const R = 6371000 // Earth's radius in meters
    const dLat = toRad(point2[1] - point1[1])
    const dLon = toRad(point2[0] - point1[0])
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(point1[1])) * Math.cos(toRad(point2[1])) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }
}

function toRad(value: number): number {
  return value * Math.PI / 180
}

// Real-time subscriptions
export const subscriptions = {
  // Subscribe to disasters in a specific area
  disasters: (_bounds?: { north: number; south: number; east: number; west: number }) => {
    let query = supabase
      .channel('disasters')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'disasters' },
        (payload: any) => payload
      )
    
    return query
  },
  
  // Subscribe to medical resources
  medicalResources: () => {
    return supabase
      .channel('medical_resources')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'medical_resources' },
        (payload: any) => payload
      )
  },
  
  // Subscribe to user notifications
  notifications: (userId: string) => {
    return supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload: any) => payload
      )
  },
  
  // Subscribe to incident reports
  incidentReports: () => {
    return supabase
      .channel('incident_reports')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'incident_reports' },
        (payload: any) => payload
      )
  }
}

// File upload utilities
export const storage = {
  // Upload incident report images/videos
  uploadIncidentMedia: async (file: File, reportId: string) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${reportId}/${Date.now()}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('incident-media')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) throw error
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('incident-media')
      .getPublicUrl(fileName)
    
    return { path: data.path, url: publicUrl }
  },
  
  // Upload medical resource verification documents
  uploadVerificationDoc: async (file: File, resourceId: string) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${resourceId}/${Date.now()}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('verification-docs')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) throw error
    
    const { data: { publicUrl } } = supabase.storage
      .from('verification-docs')
      .getPublicUrl(fileName)
    
    return { path: data.path, url: publicUrl }
  }
}

export default supabase
