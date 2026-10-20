import { useEffect, useMemo, useState } from 'react'
import { ArrowRightLeft, Check, Mail, Search, ShieldCheck, UserCog, Users } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import type { AdminUser } from '@/admin/types'
import { formatDate, initials } from '@/admin/utils'
import { Input } from '@/components/ui/input'

export function UsersTab({ currentUserId }: { currentUserId: string }) {
  const { refreshUser } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(Boolean(supabase))
  const [error, setError] = useState<string | null>(
    supabase ? null : 'Supabase is not configured.'
  )
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return

    let cancelled = false

    supabase.rpc('admin_list_users').then(({ data, error: rpcError }) => {
      if (cancelled) return

      if (rpcError) {
        setError(rpcError.message)
      } else {
        setUsers((data ?? []) as AdminUser[])
        setError(null)
      }

      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return users

    return users.filter((user) =>
      [user.email, user.full_name, user.role, user.tier]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    )
  }, [search, users])

  const adminCount = users.filter((user) => user.role === 'admin').length

  async function updateRole(user: AdminUser, role: 'guest' | 'admin') {
    if (!supabase || busyId) return

    if (role === 'admin' && adminCount >= 1) {
      setError('Only one administrator is allowed. Use Transfer admin to hand over the role.')
      return
    }

    setBusyId(user.id)
    setError(null)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', user.id)

    setBusyId(null)

    if (updateError) {
      setError(
        updateError.code === '23505' || updateError.message.includes('Only one administrator')
          ? 'Only one administrator is allowed. Use Transfer admin to hand over the role.'
          : updateError.message
      )
      return
    }

    setUsers((previous) =>
      previous.map((item) => (item.id === user.id ? { ...item, role } : item))
    )
  }

  async function transferAdmin(user: AdminUser) {
    if (!supabase || busyId) return

    const label = user.full_name || user.email
    const confirmed = window.confirm(
      `Transfer administrator access to ${label}?\n\nYou will lose admin access immediately.`
    )

    if (!confirmed) return

    setBusyId(user.id)
    setError(null)

    const { data, error: transferError } = await supabase.rpc('transfer_admin', {
      target_user_id: user.id,
    })

    if (transferError) {
      setBusyId(null)
      setError(
        transferError.message.includes('transfer_admin')
          ? 'Run supabase/0004_single_admin.sql in the Supabase SQL editor to enable administrator transfer.'
          : transferError.message
      )
      return
    }

    if (!data) {
      setBusyId(null)
      setError('Administrator transfer was not completed.')
      return
    }

    setBusyId(null)
    window.alert(`Administrator access transferred to ${label}. You are no longer an administrator.`)

    try {
      await refreshUser()
    } catch {
      setError('Administrator role transferred, but the page could not refresh. Reload to continue.')
    }
  }

  async function handleCheckIn(user: AdminUser) {
    if (!supabase || busyId) return

    setBusyId(user.id)
    setError(null)

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ check_in: new Date().toISOString().split('T')[0] })
      .eq('user_id', user.id)
      .select()
      .single()

    setBusyId(null)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setUsers((previous) =>
      previous.map((item) =>
        item.id === user.id
          ? { ...item, check_in: new Date().toISOString().split('T')[0] }
          : item
      )
    )
  }

  async function handleCheckOut(user: AdminUser) {
    if (!supabase || busyId) return

    setBusyId(user.id)
    setError(null)

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ check_out: new Date().toISOString().split('T')[0] })
      .eq('user_id', user.id)
      .select()
      .single()

    setBusyId(null)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setUsers((previous) =>
      previous.map((item) =>
        item.id === user.id
          ? { ...item, check_out: new Date().toISOString().split('T')[0] }
          : item
      )
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="heading-font text-2xl font-bold text-slate-dark">Users</h1>
          <p className="text-sm text-slate-muted mt-1">
            {users.length} registered {users.length === 1 ? 'account' : 'accounts'} ·{' '}
            {adminCount} administrator{adminCount === 1 ? '' : 's'}
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, role…"
            aria-label="Search users"
            className="h-10 rounded-xl border-border pl-9"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
          <p>{error}</p>
          {error.toLowerCase().includes('admin_list_users') && (
            <p className="text-xs mt-1">
              Run <code className="font-mono">supabase/0002_admin.sql</code> in the Supabase SQL
              editor to install the admin directory function.
            </p>
          )}
        </div>
      )}

      {adminCount > 1 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <p>
            Multiple administrators are currently configured. Run{' '}
            <code className="font-mono">supabase/0004_single_admin.sql</code> in the Supabase SQL
            editor to keep only the earliest administrator.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-white overflow-hidden">
        <div className="hidden md:grid grid-cols-[minmax(0,2fr)_100px_110px_130px_140px] gap-4 px-5 py-3 bg-slate-bg border-b border-border text-[10px] font-bold uppercase tracking-widest text-slate-muted">
          <span>User</span>
          <span>Role</span>
          <span>Tier / points</span>
          <span>Joined</span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
          <div className="py-14 text-center">
            <div className="w-7 h-7 border-2 border-indigo/20 border-t-indigo rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-muted">Loading users…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center">
            <Users className="w-8 h-8 text-slate-muted/30 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-muted">No users found</p>
            <p className="text-xs text-slate-muted/70 mt-1">
              {search ? 'Try a different search term.' : 'New signups will appear here.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((user) => {
              const isSelf = user.id === currentUserId
              const isAdmin = user.role === 'admin'
              const canTransfer = !isSelf && !isAdmin && adminCount === 1
              const adminLimitBlocked = !isSelf && !isAdmin && adminCount > 1
              const actionLabel =
                busyId === user.id
                  ? 'Saving…'
                  : isSelf
                    ? 'You'
                    : isAdmin
                      ? 'Make guest'
                      : canTransfer
                        ? 'Transfer admin'
                        : adminLimitBlocked
                          ? 'Admin limit'
                          : 'Make admin'

              return (
                <div
                  key={user.id}
                  className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_100px_110px_130px_140px] gap-3 md:gap-4 px-5 py-4 items-center transition-colors hover:bg-slate-bg/60"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-indigo-pale text-indigo flex items-center justify-center text-xs font-bold shrink-0">
                      {initials(user.full_name ?? user.email)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-dark truncate">
                        {user.full_name || 'Unnamed guest'}
                        {isSelf && (
                          <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-indigo">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-muted flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 shrink-0" />
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="md:hidden text-[10px] font-bold uppercase tracking-widest text-slate-muted mb-1">
                      Role
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        isAdmin
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {isAdmin && <ShieldCheck className="w-3 h-3" />}
                      {user.role}
                    </span>
                  </div>

                  <div className="text-xs text-slate-muted">
                    <p className="md:hidden text-[10px] font-bold uppercase tracking-widest text-slate-muted mb-1">
                      Tier / points
                    </p>
                    <p className="font-medium text-slate-dark">{user.tier ?? 'Bronze'}</p>
                    <p>{user.points ?? 0} pts</p>
                  </div>

                  <div className="text-xs text-slate-muted">
                    <p className="md:hidden text-[10px] font-bold uppercase tracking-widest text-slate-muted mb-1">
                      Joined
                    </p>
                    <p>{formatDate(user.created_at)}</p>
                    <p className="mt-0.5">
                      Last: {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'never'}
                    </p>
                  </div>

                  <div className="flex md:justify-end">
                    <button
                      type="button"
                      disabled={busyId === user.id || isSelf}
                      onClick={() => {
                        if (isSelf) return
                        if (isAdmin) void updateRole(user, 'guest')
                        else if (canTransfer) void transferAdmin(user)
                        else void updateRole(user, 'admin')
                      }}
                      title={
                        isSelf
                          ? 'You cannot change your own role'
                          : isAdmin
                            ? 'Demote to guest'
                            : canTransfer
                              ? 'Transfer the administrator role to this user'
                              : adminLimitBlocked
                                ? 'Demote extra administrators before transferring'
                                : 'Promote to administrator'
                      }
                      className={`inline-flex w-full md:w-auto items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        isAdmin
                          ? 'border-red-200 text-red-600 hover:bg-red-50'
                          : canTransfer || adminCount === 0
                            ? 'border-indigo/30 text-indigo hover:bg-indigo-pale'
                            : 'border-border text-slate-muted'
                      }`}
                    >
                      {canTransfer ? (
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                      ) : (
                        <UserCog className="w-3.5 h-3.5" />
                      )}
                      {actionLabel}
                    </button>

                    {/* Check-in / Check-out buttons for guests */}
                    {user.role !== 'admin' && !isSelf && busyId !== user.id && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCheckIn(user)}
                          title="Check in this guest"
                          className={`inline-flex w-full md:w-auto items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                            busyId === user.id ? 'border-indigo/30 text-indigo hover:bg-indigo-pale' : 'border-green-200 text-green-600 hover:bg-green-50'
                          }`}
                          disabled={busyId === user.id}
                        >
                          <Check className="w-3.5 h-3.5" />
                          Check-in
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCheckOut(user)}
                          title="Check out this guest"
                          className={`inline-flex w-full md:w-auto items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                            busyId === user.id ? 'border-indigo/30 text-indigo hover:bg-indigo-pale' : 'border-green-200 text-green-600 hover:bg-green-50'
                          }`}
                          disabled={busyId === user.id}
                        >
                          <Check className="w-3.5 h-3.5" />
                          Check-out
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-muted">
        TapServe allows exactly one administrator. Use <span className="font-semibold">Transfer admin</span>{' '}
        to hand the role to another account; the current administrator is demoted automatically.
        Deleting an auth account requires the Supabase Admin API with a service role key, so account
        deletion is intentionally handled from the Supabase dashboard.
      </p>
    </div>
  )
}
