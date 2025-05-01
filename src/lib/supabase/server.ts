// src/lib/supabase/server.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// For server components, we'll use a simpler client without cookies
// This avoids all the cookie handling issues in server components
export const createClient = () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}