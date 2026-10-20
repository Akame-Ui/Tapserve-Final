import { useEffect, useState } from 'react'
import { ArrowLeft, Lock, ShieldCheck, UserPlus } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { AdminLogo } from '@/admin/AdminLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Mode = 'signin' | 'register'

export function AdminLogin() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [adminExists, setAdminExists] = useState<boolean | null>(null)
  const [checkingSetup, setCheckingSetup] = useState(Boolean(supabase))
  const [setupError, setSetupError] = useState<string | null>(null)
  const [name, setName] = useState('Administrator')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!supabase) return

    let cancelled = false

    supabase.rpc('admin_exists').then(({ data, error: rpcError }) => {
      if (cancelled) return

      if (rpcError) {
        setSetupError(rpcError.message)
      } else {
        const exists = data === true
        setAdminExists(exists)
        setMode(exists ? 'signin' : 'register')
      }

      setCheckingSetup(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  function switchMode(next: Mode) {
    setMode(next)
    setError('')
    setNotice('')
  }

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setNotice('')

    if (!email || !password) {
      setError('Enter your administrator email and password.')
      return
    }

    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setNotice('')

    if (!name.trim()) {
      setError('Enter the administrator name.')
      return
    }
    if (!email) {
      setError('Enter the administrator email.')
      return
    }
    if (password.length < 6) {
      setError('Use a password with at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await register(name.trim(), email, password)
      setNotice('Account created. Finish setup by claiming administrator access.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the account.')
    } finally {
      setLoading(false)
    }
  }

  const showRegister = mode === 'register' && adminExists === false

  return (
    <div className="admin-shell flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <a
          href="#home"
          className="mb-8 inline-flex items-center gap-2 text-sm text-[#64748B] transition-colors hover:text-[#1E293B]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to TapServe
        </a>

        <div className="rounded-[32px] border border-[#E2E8F0] bg-white p-6 shadow-[0_45px_100px_-60px_rgba(15,23,42,0.55)] sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <AdminLogo />
            <span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#4F46E5]">
              Console
            </span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-pale text-indigo px-3 py-1 text-[10px] font-bold uppercase tracking-widest mb-4">
            <ShieldCheck className="w-3 h-3" />
            {showRegister ? 'First-time setup' : 'Restricted access'}
          </div>

          {adminExists === false && (
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-bg p-1 mb-5">
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  mode === 'signin'
                    ? 'bg-white text-slate-dark shadow-sm'
                    : 'text-slate-muted hover:text-slate-dark'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  mode === 'register'
                    ? 'bg-white text-slate-dark shadow-sm'
                    : 'text-slate-muted hover:text-slate-dark'
                }`}
              >
                Create administrator
              </button>
            </div>
          )}

          <h1 className="heading-font text-2xl font-bold text-slate-dark mb-1">
            {showRegister ? 'Create the first administrator' : 'Admin sign in'}
          </h1>
          <p className="text-sm text-slate-muted mb-6">
            {showRegister
              ? 'No administrator exists yet. Create the account that will manage TapServe.'
              : 'Use the account that currently holds administrator access. Only one administrator is allowed.'}
          </p>

          {checkingSetup && (
            <p className="text-xs text-slate-muted mb-4">Checking setup status…</p>
          )}

          {showRegister ? (
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="admin-name" className="text-sm font-medium text-slate-dark">
                  Full name
                </Label>
                <Input
                  id="admin-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Administrator"
                  autoComplete="name"
                  className="h-11 rounded-xl border-border focus-visible:ring-indigo/40 focus-visible:border-indigo"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="admin-register-email" className="text-sm font-medium text-slate-dark">
                  Email
                </Label>
                <Input
                  id="admin-register-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@tapserve.ph"
                  autoComplete="email"
                  className="h-11 rounded-xl border-border focus-visible:ring-indigo/40 focus-visible:border-indigo"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="admin-register-password"
                    className="text-sm font-medium text-slate-dark"
                  >
                    Password
                  </Label>
                  <Input
                    id="admin-register-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="h-11 rounded-xl border-border focus-visible:ring-indigo/40 focus-visible:border-indigo"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="admin-register-confirm"
                    className="text-sm font-medium text-slate-dark"
                  >
                    Confirm
                  </Label>
                  <Input
                    id="admin-register-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="h-11 rounded-xl border-border focus-visible:ring-indigo/40 focus-visible:border-indigo"
                  />
                </div>
              </div>

              {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
              {notice && <p role="status" className="text-sm font-medium text-emerald-600">{notice}</p>}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-indigo hover:bg-indigo-dark text-white font-semibold shadow-lg shadow-indigo/30 gap-2"
              >
                <UserPlus className="w-4 h-4" />
                {loading ? 'Creating account…' : 'Create administrator account'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignIn} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="admin-email" className="text-sm font-medium text-slate-dark">
                  Email
                </Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@tapserve.ph"
                  autoComplete="email"
                  className="h-11 rounded-xl border-border focus-visible:ring-indigo/40 focus-visible:border-indigo"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="admin-password" className="text-sm font-medium text-slate-dark">
                  Password
                </Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-11 rounded-xl border-border focus-visible:ring-indigo/40 focus-visible:border-indigo"
                />
              </div>

              {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-indigo hover:bg-indigo-dark text-white font-semibold shadow-lg shadow-indigo/30 gap-2"
              >
                <Lock className="w-4 h-4" />
                {loading ? 'Signing in…' : 'Sign in to console'}
              </Button>
            </form>
          )}

          {import.meta.env.DEV && setupError?.toLowerCase().includes('admin_exists') && (
            <p className="text-xs text-amber-600 mt-4 leading-relaxed">
              Administrator signup is not available yet. Run{' '}
              <code className="font-mono">supabase/0003_admin_signup.sql</code> in the Supabase SQL
              editor, then reload this page.
            </p>
          )}

          <p className="text-xs text-slate-muted mt-5 leading-relaxed">
            Administrator accounts are provisioned in Supabase. Once the first administrator exists,
            the role can only be transferred from the console.
          </p>
        </div>
      </div>
    </div>
  )
}
