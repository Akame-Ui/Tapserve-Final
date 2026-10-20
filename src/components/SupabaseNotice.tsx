import { isSupabaseConfigured, SUPABASE_SETUP_MESSAGE } from '@/lib/supabase'

/**
 * Shows a development-only hint while the Supabase environment variables are
 * missing. It disappears automatically once `.env.local` is configured.
 */
export function SupabaseNotice() {
  if (!import.meta.env.DEV || isSupabaseConfigured) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:right-auto z-[100] sm:max-w-md rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 shadow-xl">
      <p className="text-xs font-bold uppercase tracking-widest">Supabase not connected</p>
      <p className="text-xs leading-relaxed mt-1">{SUPABASE_SETUP_MESSAGE}</p>
    </div>
  )
}
