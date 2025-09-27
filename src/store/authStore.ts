import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
// @ts-ignore - Module resolution issue, works at runtime
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '@/lib/database.types'

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  loadProfile: () => Promise<void>
  initialize: () => void
  clearError: () => void
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  subscribeWithSelector((set, get) => ({
    // State
    user: null,
    profile: null,
    session: null,
    loading: true,
    error: null,
    isAuthenticated: false,

    // Actions
    signIn: async (email: string, password: string) => {
      set({ loading: true, error: null })
      
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (error) throw error
        
        // Profile will be loaded by the auth state change listener
        set({ 
          user: data.user,
          session: data.session,
          isAuthenticated: true,
          loading: false 
        })
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Sign in failed',
          loading: false 
        })
        throw error
      }
    },

    signUp: async (email: string, password: string, metadata = {}) => {
      set({ loading: true, error: null })
      
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: metadata
          }
        })
        
        if (error) throw error
        
        // Create profile entry
        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email!,
              full_name: metadata.full_name || null,
              role: 'citizen'
            })
          
          if (profileError) {
            console.error('Profile creation error:', profileError)
          }
        }
        
        set({ 
          user: data.user,
          session: data.session,
          isAuthenticated: !!data.session,
          loading: false 
        })
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Sign up failed',
          loading: false 
        })
        throw error
      }
    },

    signOut: async () => {
      set({ loading: true, error: null })
      
      try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        
        set({
          user: null,
          profile: null,
          session: null,
          isAuthenticated: false,
          loading: false
        })
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Sign out failed',
          loading: false 
        })
        throw error
      }
    },

    updateProfile: async (updates: Partial<Profile>) => {
      const { user } = get()
      if (!user) throw new Error('User not authenticated')
      
      set({ loading: true, error: null })
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id)
          .select()
          .single()
        
        if (error) throw error
        
        set({ 
          profile: data,
          loading: false 
        })
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Profile update failed',
          loading: false 
        })
        throw error
      }
    },

    loadProfile: async () => {
      const { user } = get()
      if (!user) return
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (error && error.code !== 'PGRST116') {
          throw error
        }
        
        set({ profile: data || null })
      } catch (error) {
        console.error('Failed to load profile:', error)
        set({ 
          error: error instanceof Error ? error.message : 'Failed to load profile'
        })
      }
    },

    initialize: () => {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }: any) => {
        set({
          session,
          user: session?.user || null,
          isAuthenticated: !!session,
          loading: false
        })
        
        if (session?.user) {
          get().loadProfile()
        }
      })
      
      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
        set({
          session,
          user: session?.user || null,
          isAuthenticated: !!session,
          loading: false
        })
        
        if (session?.user) {
          get().loadProfile()
        } else {
          set({ profile: null })
        }
      })
    },

    clearError: () => set({ error: null })
  }))
)

// Initialize auth store on import
useAuthStore.getState().initialize()
