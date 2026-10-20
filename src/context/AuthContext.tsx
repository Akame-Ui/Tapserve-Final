import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js'
import { requireSupabase, supabase } from '@/lib/supabase'

export type UserRole = 'guest' | 'admin'

export type User = {
  id: string
  name: string
  email: string
  avatarUrl?: string
  role: UserRole
}

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapUser(user: SupabaseUser | null | undefined): User | null {
  if (!user) return null

  const metadata = user.user_metadata ?? {}
  const email = user.email ?? ''
  const fallbackName = email.split('@')[0]?.replace(/[._]/g, ' ') || 'Guest'

  return {
    id: user.id,
    email,
    name: (metadata.full_name as string | undefined) || (metadata.name as string | undefined) || fallbackName,
    avatarUrl: (metadata.avatar_url as string | undefined) || undefined,
    role: 'guest',
  }
}

async function hydrateUser(
  client: SupabaseClient,
  supabaseUser: SupabaseUser | null | undefined
): Promise<User | null> {
  const base = mapUser(supabaseUser)
  if (!base) return null

  let role: UserRole = 'guest'
  let profileName = base.name

  try {
    const { data } = await client
      .from('profiles')
      .select('role, full_name')
      .eq('id', base.id)
      .maybeSingle()

    if (data?.role === 'admin') role = 'admin'
    if (typeof data?.full_name === 'string' && data.full_name.trim()) {
      profileName = data.full_name.trim()
    }
  } catch {
    // Profiles may not be migrated yet; keep guest access.
  }

  return { ...base, name: profileName, role }
}

function friendlyAuthError(message: string): string {
  if (message.toLowerCase().includes('invalid login credentials')) {
    return 'Incorrect email or password.'
  }
  if (message.toLowerCase().includes('email not confirmed')) {
    return 'Please confirm your email address before signing in.'
  }
  if (message.toLowerCase().includes('already registered')) {
    return 'An account with this email already exists. Try signing in instead.'
  }
  return message
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(Boolean(supabase))

  useEffect(() => {
    const client = supabase
    if (!client) return

    let mounted = true

    async function hydrate(supabaseUser: SupabaseUser | null | undefined) {
      if (!client) return

      const nextUser = await hydrateUser(client, supabaseUser)

      if (!mounted) return
      setUser(nextUser)
      setLoading(false)
    }

    client.auth
      .getSession()
      .then(({ data }) => {
        void hydrate(data.session?.user)
      })
      .catch(() => {
        if (mounted) setLoading(false)
      })

    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      void hydrate(session?.user)
    })

    return () => {
      mounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const client = requireSupabase()
    const { error } = await client.auth.signInWithPassword({ email, password })
    if (error) throw new Error(friendlyAuthError(error.message))
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const client = requireSupabase()
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })

    if (error) throw new Error(friendlyAuthError(error.message))

    // With email confirmation enabled Supabase returns a user but no session.
    if (!data.session) {
      throw new Error('Account created. Check your email to confirm it, then sign in.')
    }
  }, [])

  const logout = useCallback(async () => {
    if (!supabase) {
      setUser(null)
      return
    }

    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const client = supabase
    if (!client) return

    const { data } = await client.auth.getUser()
    const nextUser = await hydrateUser(client, data.user)
    setUser(nextUser)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
