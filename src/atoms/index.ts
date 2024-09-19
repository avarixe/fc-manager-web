import { createClient, Session, SupabaseClient } from "@supabase/supabase-js";
import { atom } from "jotai";
import { Database } from '@/database-generated.types'

export const supabaseAtom = atom<SupabaseClient<Database>>(
  createClient<Database>(
    import.meta.env.VITE_APP_SUPABASE_URL,
    import.meta.env.VITE_APP_SUPABASE_KEY,
    {
      db: {
        schema: 'public',
      },
      auth: {
        autoRefreshToken: true,
      }
    }
  )
)

export const sessionAtom = atom<Session | null>(null)
