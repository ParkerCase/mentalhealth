// src/lib/stores/authStore.ts
import { create } from 'zustand'
import { createClient } from '../supabase/client'

interface AuthState {
  user: any | null
  profile: any | null
  loading: boolean
  initialized: boolean
  signIn: (credentials: { email: string; password: string }) => Promise<{data: any, error: any}>
  signUp: (credentials: { email: string; password: string; username: string }) => Promise<{data: any, error: any}>
  signOut: () => Promise<{error: any}>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,
  
  signIn: async ({ email, password }) => {
    const supabase = createClient()
    const result = await supabase.auth.signInWithPassword({ email, password })
    if (result.data.user) {
      set({ user: result.data.user })
      // Fetch profile
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', result.data.user.id)
        .single()
      set({ profile: data })
    }
    return result
  },
  
  signUp: async ({ email, password, username }) => {
    const supabase = createClient()
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
    const supabase = createClient()
    const result = await supabase.auth.signOut()
    set({ user: null, profile: null })
    return result
  },
  
  initialize: async () => {
    if (get().initialized) return
    
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.user) {
      set({ user: session.user })
      
      // Fetch profile
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      set({ profile: data })
    }
    
    set({ loading: false, initialized: true })
    
    // Setup auth state change listener
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        set({ user: session.user })
        
        // Fetch profile
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        set({ profile: data })
      } else {
        set({ user: null, profile: null })
      }
    })
  }
}))