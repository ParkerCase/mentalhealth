// src/lib/stores/authStore.ts
import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Profile } from '../types'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
  initialize: () => Promise<void>
  signIn: (credentials: { email: string; password: string }) => Promise<{data: any, error: any}>
  signUp: (credentials: { email: string; password: string; username: string }) => Promise<{data: any, error: any}>
  signOut: () => Promise<{error: any}>
  refreshProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,
  
  initialize: async () => {
    if (get().initialized) return
    
    set({ loading: true })
    
    try {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        set({ user: session.user })
        
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        set({ profile })
      }
      
      // Setup auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          set({ user: session?.user || null })
          
          if (session?.user) {
            // Fetch profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            
            set({ profile })
          } else {
            set({ profile: null })
          }
        }
      )
      
      // We don't need to return the cleanup function
      subscription // Just reference to avoid unused variable warning
    } catch (error) {
      console.error('Error initializing auth:', error)
    } finally {
      set({ loading: false, initialized: true })
    }
  },
  
  refreshProfile: async () => {
    const { user } = get()
    
    if (!user) return
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (data) {
        set({ profile: data })
      }
    } catch (error) {
      console.error('Error refreshing profile:', error)
    }
  },
  
  signIn: async ({ email, password }) => {
    return supabase.auth.signInWithPassword({ email, password })
  },
  
  signUp: async ({ email, password, username }) => {
    return supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          preferred_username: username
        }
      }
    })
  },
  
  signOut: async () => {
    set({ user: null, profile: null })
    return supabase.auth.signOut()
  }
}))