// src/lib/hooks/useAuth.ts
import { useEffect, useState } from 'react'
import { createClient } from '../supabase/client'
import { useRouter } from 'next/navigation'
import { Profile, AuthFormData } from '@/lib/types'
import { User, Session } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const initialize = async () => {
    setLoading(true)
    try {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setUser(session.user)
        
        // Fetch user profile
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          
        setProfile(data)
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUser(session.user)
          // Fetch user profile
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          setProfile(data)
        } else {
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
        router.refresh()
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  const signIn = async ({ email, password }: AuthFormData) => {
    return supabase.auth.signInWithPassword({ email, password })
  }

  const signUp = async ({ email, password, username }: AuthFormData) => {
    return supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          preferred_username: username
        }
      }
    })
  }

  const signOut = async () => {
    return supabase.auth.signOut()
  }

  return {
    user,
    profile,
    loading,
    initialize,
    signIn,
    signUp,
    signOut,
  }
}