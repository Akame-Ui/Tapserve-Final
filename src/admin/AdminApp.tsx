import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  BarChart3,
  Bell,
  CalendarDays,
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Search,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { AdminLogin } from '@/admin/AdminLogin'
import { AdminLogo } from '@/admin/AdminLogo'
import { OverviewTab } from '@/admin/OverviewTab'
import { UsersTab } from '@/admin/UsersTab'
import { EventsTab } from '@/admin/EventsTab'
import { PurchasesTab } from '@/admin/PurchasesTab'
import { ReportsTab } from '@/admin/ReportsTab'
import { initials } from '@/admin/utils'

type AdminTab = 'overview' | 'users' | 'events' | 'purchases' | 'reports'

const tabs: Array<{ id: AdminTab; label: string; icon: React.ElementType }> = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Guests', icon: Users },
  { id: 'events', label: 'Events', icon: CalendarDays },
  { id: 'purchases', label: 'Bookings', icon: CreditCard },
  { id: 'reports', label: 'Revenue', icon: BarChart3 },
]

export function AdminApp() {
  const { user: authUser, loading, logout, refreshUser } = useAuth()
  const preview = window.location.hash.includes('preview')
  const user = preview
    ? { id: 'preview-admin', name: 'Jaylon Dorwart', email: 'admin@tapserve.ph', role: 'admin' as const }
    : authUser
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [search, setSearch] = useState('')
  const [purchaseSearch, setPurchaseSearch] = useState('')

  function submitSearch(event: React.FormEvent) {
    event.preventDefault()
    setPurchaseSearch(search.trim())
    setActiveTab('purchases')
  }

  if (loading && !preview) {
    return (
      <div className="admin-shell flex min-h-screen items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <AdminLogo />
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#CBD5E1] border-t-[#4F46E5]" />
            <p className="text-sm text-slate-muted">Checking administrator access…</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) return <AdminLogin />

  if (user.role !== 'admin') {
    return (
      <AdminAccessDenied
        email={user.email}
        onLogout={logout}
        onRefresh={refreshUser}
      />
    )
  }

  return (
    <div className="admin-shell min-h-screen p-3 sm:p-5 lg:p-7">
      <a href="#/admin-main" className="skip-link">
        Skip to admin content
      </a>

      <div className="mx-auto flex w-full max-w-[1580px] flex-col overflow-hidden rounded-[28px] border border-[#E2E8F0] bg-[#F8FAFC] shadow-[0_45px_120px_-70px_rgba(15,23,42,0.55)] lg:min-h-[calc(100vh-3.5rem)] lg:flex-row">
        {/* ── Sidebar ─────────────────────────────────────── */}
        <aside className="hidden w-[248px] shrink-0 flex-col border-r border-[#E2E8F0] bg-white px-4 py-5 lg:flex">
          <div className="px-2">
            <AdminLogo />
          </div>

          <p className="px-3 pb-2 pt-8 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
            Menu
          </p>
          <nav aria-label="Administrator sections" className="flex flex-col gap-1">
            {tabs.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#E0E7FF] text-[#1E293B] shadow-[0_10px_24px_-18px_rgba(79,70,229,0.75)]'
                      : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]'
                  }`}
                >
                  <Icon className={`h-[18px] w-[18px] ${active ? 'text-[#4338CA]' : 'text-[#64748B]'}`} />
                  {label}
                  {id === 'purchases' && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#ed7667]" />
                  )}
                </button>
              )
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-3 pt-6">
            <a
              href="#/home"
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#1E293B]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to website
            </a>

            <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E0E7FF] text-[11px] font-bold text-[#4338CA]">
                  {initials(user.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[#1E293B]">{user.name}</p>
                  <p className="truncate text-[10px] text-[#64748B]">{user.email}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#4F46E5]">
                  <ShieldCheck className="h-3 w-3" />
                  Admin
                </span>
                <button
                  type="button"
                  onClick={() => void logout()}
                  aria-label="Sign out"
                  title="Sign out"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#64748B] transition-colors hover:bg-white hover:text-[#4338CA]"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main column ─────────────────────────────────── */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b border-[#E2E8F0] bg-white/85 px-4 py-3 backdrop-blur sm:px-6">
            <div className="lg:hidden">
              <AdminLogo compact />
            </div>

            <form onSubmit={submitSearch} className="relative hidden max-w-xl flex-1 sm:block">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search room, guest, booking…"
                aria-label="Search bookings"
                className="h-10 w-full rounded-full border border-[#E2E8F0] bg-[#F8FAFC] pl-10 pr-20 text-sm text-[#1E293B] outline-none transition focus:border-[#818CF8] focus:ring-2 focus:ring-[#C7D2FE]/60"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 rounded-full bg-[#E0E7FF] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#4338CA] transition-colors hover:bg-[#C7D2FE]"
              >
                Search
              </button>
            </form>

            <div className="ml-auto flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#4F46E5] md:inline-flex">
                <ShieldCheck className="h-3 w-3" />
                Administrator
              </span>

              <button
                type="button"
                onClick={() => setActiveTab('purchases')}
                title="Review bookings"
                aria-label="Review bookings"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#475569] transition-colors hover:border-[#C7D2FE] hover:text-[#4338CA]"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#ed7667] ring-2 ring-white" />
              </button>

              <details className="group relative">
                <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-[#F1F5F9] [&::-webkit-details-marker]:hidden">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E0E7FF] text-[11px] font-bold text-[#4338CA]">
                    {initials(user.name)}
                  </span>
                  <span className="hidden text-left md:block">
                    <span className="block max-w-[150px] truncate text-xs font-semibold text-[#1E293B]">
                      {user.name}
                    </span>
                    <span className="block text-[10px] text-[#64748B]">Administrator</span>
                  </span>
                  <ChevronDown className="hidden h-3.5 w-3.5 text-[#64748B] transition-transform group-open:rotate-180 md:block" />
                </summary>

                <div className="absolute right-0 z-40 mt-2 w-64 rounded-2xl border border-[#E2E8F0] bg-white p-2 shadow-[0_28px_60px_-30px_rgba(15,23,42,0.45)]">
                  <div className="border-b border-[#EEF2FF] px-3 py-2.5">
                    <p className="truncate text-sm font-semibold text-[#1E293B]">{user.name}</p>
                    <p className="mt-0.5 truncate text-[11px] text-[#64748B]">{user.email}</p>
                  </div>
                  <a
                    href="#home"
                    className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#475569] transition-colors hover:bg-[#F1F5F9] hover:text-[#1E293B]"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to website
                  </a>
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#475569] transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                </div>
              </details>
            </div>
          </header>

          <div className="admin-scroll flex gap-1.5 overflow-x-auto border-b border-[#E2E8F0] bg-white px-4 py-2 lg:hidden">
            {tabs.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-[#E0E7FF] text-[#1E293B]'
                      : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              )
            })}
          </div>

          <main
            id="admin-main"
            tabIndex={-1}
            className="admin-scroll flex-1 overflow-x-hidden px-4 py-5 sm:px-6 sm:py-6 lg:px-7"
          >
            {activeTab === 'overview' && <OverviewTab onNavigate={setActiveTab} />}
            {activeTab === 'users' && <UsersTab currentUserId={user.id} />}
            {activeTab === 'events' && <EventsTab />}
            {activeTab === 'purchases' && <PurchasesTab initialSearch={purchaseSearch} />}
            {activeTab === 'reports' && <ReportsTab />}
          </main>
        </div>
      </div>
    </div>
  )
}

type AdminAccessDeniedProps = {
  email: string
  onLogout: () => Promise<void>
  onRefresh: () => Promise<void>
}

function AdminAccessDenied({ email, onLogout, onRefresh }: AdminAccessDeniedProps) {
  const [checking, setChecking] = useState(Boolean(supabase))
  const [canClaim, setCanClaim] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [setupUnavailable, setSetupUnavailable] = useState(false)

  useEffect(() => {
    if (!supabase) return

    let cancelled = false

    supabase.rpc('admin_exists').then(({ data, error: rpcError }) => {
      if (cancelled) return

      if (rpcError) {
        setSetupUnavailable(true)
      } else {
        setCanClaim(data === false)
      }

      setChecking(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  async function handleClaim() {
    if (!supabase || claiming) return

    setClaiming(true)
    setError(null)

    const { data, error: claimError } = await supabase.rpc('claim_first_admin')

    if (claimError) {
      setError(claimError.message)
      setClaiming(false)
      return
    }

    if (!data) {
      setCanClaim(false)
      setError(
        'An administrator already exists. Ask the current administrator to transfer access to this account.'
      )
      setClaiming(false)
      return
    }

    await onRefresh()
    setClaiming(false)
  }

  if (checking) {
    return (
      <div className="admin-shell flex min-h-screen items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <AdminLogo />
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#CBD5E1] border-t-[#4F46E5]" />
            <p className="text-sm text-slate-muted">Checking setup status…</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-shell flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <AdminLogo />
        </div>
        <div className="w-full rounded-[32px] border border-[#E2E8F0] bg-white p-8 text-center shadow-[0_45px_100px_-60px_rgba(15,23,42,0.55)]">
          <div
            className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
              canClaim ? 'bg-[#EEF2FF]' : 'bg-red-50'
            }`}
          >
            {canClaim ? (
              <ShieldCheck className="h-7 w-7 text-[#4F46E5]" />
            ) : (
              <ShieldAlert className="h-7 w-7 text-red-500" />
            )}
          </div>

          <h1 className="heading-font text-2xl font-bold text-slate-dark">
            {canClaim ? 'Finish administrator setup' : 'Access denied'}
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-slate-muted">
            {canClaim ? (
              <>
                No administrator exists yet. Claim administrator access for{' '}
                <span className="font-medium text-slate-dark">{email}</span>.
              </>
            ) : (
              <>
                You are signed in as <span className="font-medium text-slate-dark">{email}</span>, but
                this account is not an administrator.
              </>
            )}
          </p>

          {error && <p role="alert" className="mt-4 text-sm font-medium text-destructive">{error}</p>}

          {import.meta.env.DEV && setupUnavailable && (
            <p className="mt-4 text-xs leading-relaxed text-amber-600">
              First-administrator setup is not available yet. Run{' '}
              <code className="font-mono">supabase/0003_admin_signup.sql</code> in the Supabase SQL
              editor.
            </p>
          )}

          <div className="mt-6 flex flex-col gap-2">
            {canClaim && (
              <button
                type="button"
                disabled={claiming}
                onClick={() => void handleClaim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E0E7FF] px-4 py-3 text-sm font-semibold text-[#312E81] transition-colors hover:bg-[#C7D2FE] disabled:opacity-60"
              >
                <ShieldCheck className="h-4 w-4" />
                {claiming ? 'Claiming access…' : 'Claim administrator access'}
              </button>
            )}

            <a
              href="#home"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-slate-dark transition-colors hover:border-[#818CF8] hover:text-[#4338CA]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to TapServe
            </a>

            <button
              type="button"
              onClick={() => void onLogout()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-slate-muted transition-colors hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
