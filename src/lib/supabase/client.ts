// src/lib/supabase/client.ts
import { createClient as createBrowserClient } from '@supabase/supabase-js'
import { Database } from '../types/database.types'

export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}