import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

const isConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project-ref') &&
    !supabaseAnonKey.includes('your-anon-key')
)

/**
 * `null` when the environment variables are missing or still contain the
 * example placeholders. The UI keeps working in that state and shows a
 * setup message when an auth or booking action is attempted.
 */
export const supabase: SupabaseClient | null = isConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export const isSupabaseConfigured = isConfigured

export const SUPABASE_SETUP_MESSAGE =
  'Supabase is not configured. Copy .env.example to .env.local, add your project URL and anon key, then restart the dev server.'

export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new Error(SUPABASE_SETUP_MESSAGE)
  return supabase
}
