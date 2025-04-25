// src/lib/hooks/useAuth.ts
import { useEffect, useState } from 'react'
import { createClient } from '../supabase/client'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

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

  const signIn = async ({ email, password }) => {
    return supabase.auth.signInWithPassword({ email, password })
  }

  const signUp = async ({ email, password, username }) => {
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
    signIn,
    signUp,
    signOut,
  }
}