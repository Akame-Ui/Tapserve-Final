import { useEffect, useMemo, useState } from 'react'
import { CreditCard, Download, Search, Trash2, TrendingUp, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { AdminBooking, BookingStatus, PaymentStatus } from '@/admin/types'
import { DeleteBookingDialog } from '@/admin/DeleteBookingDialog'
import { downloadCsv, formatDate, formatMoney } from '@/admin/utils'
import { Input } from '@/components/ui/input'

const bookingStatusStyles: Record<BookingStatus, string> = {
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-slate-100 text-slate-600 border-slate-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
}

const paymentStatusStyles: Record<PaymentStatus, string> = {
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  overdue: 'bg-red-50 text-red-600 border-red-200',
}

const paymentStatusLabels: Record<PaymentStatus, string> = {
  paid: 'Paid',
  pending: 'Pending',
  overdue: 'Overdue',
}

const bookingStatusLabels: Record<BookingStatus, string> = {
  confirmed: 'Confirmed',
  pending: 'Pending',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

/** Older rows predate `payment_method`; pending payments were cash by default. */
function resolvePaymentMethod(booking: AdminBooking): 'card' | 'gcash' | 'cash' {
  if (booking.payment_method) return booking.payment_method
  return booking.payment_status === 'pending' ? 'cash' : 'card'
}

export function PurchasesTab({ initialSearch = '' }: { initialSearch?: string }) {
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [loading, setLoading] = useState(Boolean(supabase))
  const [error, setError] = useState<string | null>(
    supabase ? null : 'Supabase is not configured.'
  )
  const [search, setSearch] = useState(initialSearch)
  const [statusFilter, setStatusFilter] = useState<'all' | BookingStatus>('all')
  const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentStatus>('all')
  const [deleteTarget, setDeleteTarget] = useState<AdminBooking | null>(null)

  useEffect(() => {
    setSearch(initialSearch)
  }, [initialSearch])

  useEffect(() => {
    if (!supabase) return

    let cancelled = false

    supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (cancelled) return

        if (fetchError) {
          setError(fetchError.message)
        } else {
          setBookings((data ?? []) as AdminBooking[])
          setError(null)
        }

        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const totals = useMemo(() => {
    const paid = bookings
      .filter((booking) => booking.payment_status === 'paid')
      .reduce((sum, booking) => sum + Number(booking.total), 0)
    const outstanding = bookings
      .filter(
        (booking) =>
          booking.payment_status !== 'paid' && booking.status !== 'cancelled'
      )
      .reduce((sum, booking) => sum + Number(booking.total), 0)
    const all = bookings
      .filter((booking) => booking.status !== 'cancelled')
      .reduce((sum, booking) => sum + Number(booking.total), 0)

    return {
      paid,
      outstanding,
      all,
      average: bookings.length ? all / bookings.length : 0,
    }
  }, [bookings])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()

    return bookings.filter((booking) => {
      if (statusFilter !== 'all' && booking.status !== statusFilter) return false
      if (paymentFilter !== 'all' && booking.payment_status !== paymentFilter) return false
      if (!term) return true

      return [
        booking.booking_code,
        booking.guest_name,
        booking.guest_email,
        booking.room_name,
        booking.user_id,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    })
  }, [bookings, paymentFilter, search, statusFilter])

  function togglePaymentFilter(status: PaymentStatus) {
    setPaymentFilter((current) => (current === status ? 'all' : status))
  }

  function toggleBookingFilter(status: BookingStatus) {
    setStatusFilter((current) => (current === status ? 'all' : status))
  }

  function clearFilters() {
    setStatusFilter('all')
    setPaymentFilter('all')
    setSearch('')
  }

  const pendingCount = bookings.filter(
    (booking) => booking.payment_status === 'pending' && booking.status !== 'cancelled'
  ).length

  async function deleteBooking(booking: AdminBooking) {
    if (!supabase) throw new Error('Supabase is not configured.')

    const { error: deleteError } = await supabase.from('bookings').delete().eq('id', booking.id)

    if (deleteError) throw new Error(deleteError.message)

    setBookings((previous) => previous.filter((item) => item.id !== booking.id))
  }

  function exportCsv() {
    downloadCsv('tapserve-purchases.csv', [
      [
        'Booking code',
        'Guest',
        'Email',
        'Room',
        'Check in',
        'Check out',
        'Nights',
        'Guests',
        'Total',
        'Payment method',
        'Booking status',
        'Payment status',
        'Card last 4',
        'Created',
      ],
      ...filtered.map((booking) => [
        booking.booking_code,
        booking.guest_name ?? '',
        booking.guest_email ?? '',
        booking.room_name,
        booking.check_in,
        booking.check_out,
        booking.nights,
        booking.guests,
        Number(booking.total),
        resolvePaymentMethod(booking) === 'cash' ? 'Cash' : resolvePaymentMethod(booking) === 'gcash' ? 'GCash' : 'Online card',
        booking.status,
        booking.payment_status,
        booking.card_last4 ?? '',
        booking.created_at,
      ]),
    ])
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="heading-font text-2xl font-bold text-slate-dark">Purchases</h1>
          <p className="text-sm text-slate-muted mt-1">
            All bookings and payment records across the property.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-slate-dark hover:border-indigo hover:text-indigo transition-colors disabled:opacity-40"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total purchases', value: formatMoney(totals.all), icon: Wallet, tone: 'text-indigo bg-indigo-pale' },
          { label: 'Paid', value: formatMoney(totals.paid), icon: CreditCard, tone: 'text-emerald-600 bg-emerald-50' },
          { label: 'Outstanding', value: formatMoney(totals.outstanding), icon: TrendingUp, tone: 'text-amber-600 bg-amber-50' },
          { label: 'Average booking', value: formatMoney(totals.average), icon: CreditCard, tone: 'text-sky-600 bg-sky-50' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-2xl border border-border bg-white p-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-muted">
                {label}
              </p>
              <p className="heading-font text-xl font-bold text-slate-dark mt-2">
                {loading ? '—' : value}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search booking code, guest, email, room…"
            aria-label="Search purchases"
            className="h-10 rounded-xl border-border pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as 'all' | BookingStatus)}
          aria-label="Filter by booking status"
          className="h-10 rounded-xl border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <option value="all">All booking statuses</option>
          <option value="confirmed">Booking: Confirmed</option>
          <option value="pending">Booking: Pending</option>
          <option value="completed">Booking: Completed</option>
          <option value="cancelled">Booking: Cancelled</option>
        </select>
        <select
          value={paymentFilter}
          onChange={(event) => setPaymentFilter(event.target.value as 'all' | PaymentStatus)}
          aria-label="Filter by payment status"
          className="h-10 rounded-xl border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <option value="all">All payment statuses</option>
          <option value="paid">Payment: Paid</option>
          <option value="pending">Payment: Pending</option>
          <option value="overdue">Payment: Overdue</option>
        </select>
      </div>

      {(statusFilter !== 'all' || paymentFilter !== 'all' || search.trim() !== '') && (
        <div className="flex flex-wrap items-center gap-2 -mt-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-muted">
            Filtered by
          </span>
          {statusFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className="inline-flex items-center gap-1.5 rounded-full border border-indigo/30 bg-indigo-pale px-3 py-1 text-xs font-semibold text-indigo hover:border-indigo transition-colors"
            >
              Booking: {bookingStatusLabels[statusFilter]} ✕
            </button>
          )}
          {paymentFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setPaymentFilter('all')}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 hover:border-amber-500 transition-colors"
            >
              Payment: {paymentStatusLabels[paymentFilter]} ✕
            </button>
          )}
          {search.trim() !== '' && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-slate-muted hover:border-indigo hover:text-indigo transition-colors"
            >
              Search: “{search.trim()}” ✕
            </button>
          )}
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-semibold text-slate-muted hover:text-indigo transition-colors ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {pendingCount > 0 && paymentFilter !== 'pending' && (
        <button
          type="button"
          onClick={() => setPaymentFilter('pending')}
          className="self-start inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:border-amber-500 hover:bg-amber-100 transition-colors -mt-1"
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          {pendingCount} booking{pendingCount === 1 ? '' : 's'} awaiting payment — view pending
        </button>
      )}

      <div className="rounded-2xl border border-border bg-white overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-7 h-7 border-2 border-indigo/20 border-t-indigo rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-muted">Loading purchases…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <CreditCard className="w-9 h-9 text-slate-muted/30 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-muted">No purchases found</p>
            <p className="text-xs text-slate-muted/70 mt-1">
              {bookings.length === 0 ? 'Bookings will appear here.' : 'Try clearing the filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr className="bg-slate-bg border-b border-border text-[10px] font-bold uppercase tracking-widest text-slate-muted">
                  <th className="px-5 py-3">Booking</th>
                  <th className="px-4 py-3">Guest</th>
                  <th className="px-4 py-3">Room</th>
                  <th className="px-4 py-3">Stay</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-4 py-3 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-bg/60 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-xs font-mono font-semibold text-slate-dark">
                        {booking.booking_code}
                      </p>
                      <p className="text-[10px] text-slate-muted mt-0.5">
                        {booking.nights} night{booking.nights === 1 ? '' : 's'} · {booking.guests}{' '}
                        guest{booking.guests === 1 ? '' : 's'}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-slate-dark">
                        {booking.guest_name ?? 'Guest'}
                      </p>
                      <p className="text-xs text-slate-muted">
                        {booking.guest_email ?? booking.user_id.slice(0, 8)}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-dark">{booking.room_name}</td>
                    <td className="px-4 py-4 text-xs text-slate-muted">
                      <p>{formatDate(booking.check_in)}</p>
                      <p className="mt-0.5">→ {formatDate(booking.check_out)}</p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="text-sm font-bold text-slate-dark">
                        {formatMoney(booking.total)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => togglePaymentFilter(booking.payment_status)}
                        aria-pressed={paymentFilter === booking.payment_status}
                        title={`Show ${paymentStatusLabels[booking.payment_status]} payments`}
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide cursor-pointer transition-all hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo/40 ${paymentStatusStyles[booking.payment_status]} ${
                          paymentFilter === booking.payment_status
                            ? 'ring-2 ring-indigo/40 ring-offset-1'
                            : ''
                        }`}
                      >
                        {booking.payment_status}
                      </button>
                      <p className="text-[10px] text-slate-muted mt-1">
                        {resolvePaymentMethod(booking) === 'cash'
                          ? 'Cash on arrival'
                          : resolvePaymentMethod(booking) === 'gcash'
                            ? 'GCash wallet'
                            : booking.card_last4
                              ? `Card ···· ${booking.card_last4}`
                              : 'Online card'}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => toggleBookingFilter(booking.status)}
                        aria-pressed={statusFilter === booking.status}
                        title={`Show ${bookingStatusLabels[booking.status]} bookings`}
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide cursor-pointer transition-all hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo/40 ${bookingStatusStyles[booking.status]} ${
                          statusFilter === booking.status ? 'ring-2 ring-indigo/40 ring-offset-1' : ''
                        }`}
                      >
                        {booking.status}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-muted">
                      {formatDate(booking.created_at)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(booking)}
                        aria-label={`Delete booking ${booking.booking_code}`}
                        title={`Delete booking ${booking.booking_code}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-muted transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-muted" aria-live="polite">
        Showing {filtered.length} of {bookings.length} purchases
        {paymentFilter !== 'all' && ` · Payment: ${paymentStatusLabels[paymentFilter]}`}
        {statusFilter !== 'all' && ` · Booking: ${bookingStatusLabels[statusFilter]}`}
        {search.trim() !== '' && ` · Search: “${search.trim()}”`}.
      </p>

      <DeleteBookingDialog
        booking={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onConfirm={deleteBooking}
      />
    </div>
  )
}