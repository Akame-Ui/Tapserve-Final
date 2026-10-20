import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  Download,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { AdminBooking } from '@/admin/types'
import { downloadCsv, formatMoney } from '@/admin/utils'
import { cn } from '@/lib/utils'

/* ── Helpers ─────────────────────────────────────────────────── */

type RoomRevenue = { room: string; revenue: number; bookings: number }

type MonthRecord = {
  key: string
  revenue: number
  pending: number
  bookings: number
  paidBookings: number
  pendingBookings: number
  cancelled: number
  rooms: RoomRevenue[]
}

function monthOf(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function currentMonthKey(): string {
  return monthOf(new Date())
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

function shortMonth(key: string): string {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short' })
}

function shiftMonth(key: string, delta: number): string {
  const [year, month] = key.split('-').map(Number)
  return monthOf(new Date(year, month - 1 + delta, 1))
}

function emptyMonth(key: string): MonthRecord {
  return {
    key,
    revenue: 0,
    pending: 0,
    bookings: 0,
    paidBookings: 0,
    pendingBookings: 0,
    cancelled: 0,
    rooms: [],
  }
}

function addRoom(
  map: Map<string, RoomRevenue>,
  room: string,
  revenue: number,
  bookings: number
) {
  const current = map.get(room) ?? { room, revenue: 0, bookings: 0 }
  current.revenue += revenue
  current.bookings += bookings
  map.set(room, current)
}

function sortRooms(map: Map<string, RoomRevenue>): RoomRevenue[] {
  return Array.from(map.values())
    .filter((entry) => entry.revenue > 0 || entry.bookings > 0)
    .sort((a, b) => b.revenue - a.revenue || b.bookings - a.bookings)
}

/* ── Component ───────────────────────────────────────────────── */

export function ReportsTab() {
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [loading, setLoading] = useState(Boolean(supabase))
  const [error, setError] = useState<string | null>(
    supabase ? null : 'Supabase is not configured.'
  )
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey)
  const [expandedMonth, setExpandedMonth] = useState(currentMonthKey)

  // Realtime monthly data: listen to booking changes and poll as a fallback.
  useEffect(() => {
    const client = supabase
    if (!client) return

    let cancelled = false

    async function loadBookings() {
      const { data, error: fetchError } = await client!
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })

      if (cancelled) return

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setBookings((data ?? []) as AdminBooking[])
        setError(null)
      }
      setLoading(false)
    }

    void loadBookings()

    const channel = client
      .channel('tapserve-reports-bookings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          void loadBookings()
        }
      )
      .subscribe()

    const poll = window.setInterval(() => {
      void loadBookings()
    }, 30000)

    return () => {
      cancelled = true
      window.clearInterval(poll)
      void client.removeChannel(channel)
    }
  }, [])

  const monthWindow = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1)
      return monthOf(date)
    })
  }, [])

  const monthlyRecords = useMemo(() => {
    const buckets = new Map<string, MonthRecord>()
    const roomMaps = new Map<string, Map<string, RoomRevenue>>()

    monthWindow.forEach((key) => {
      buckets.set(key, emptyMonth(key))
      roomMaps.set(key, new Map())
    })

    bookings.forEach((booking) => {
      const key = monthOf(booking.created_at)
      const bucket = buckets.get(key)
      if (!bucket) return

      const total = Number(booking.total) || 0
      const rooms = roomMaps.get(key)!
      const isCancelled = booking.status === 'cancelled'

      if (booking.payment_status === 'paid') {
        bucket.revenue += total
        bucket.paidBookings += 1
        addRoom(rooms, booking.room_name, total, isCancelled ? 0 : 1)
      } else if (booking.payment_status === 'pending' && !isCancelled) {
        bucket.pending += total
        bucket.pendingBookings += 1
      }

      if (isCancelled) {
        bucket.cancelled += 1
      } else {
        bucket.bookings += 1
        if (booking.payment_status !== 'paid') {
          addRoom(rooms, booking.room_name, 0, 1)
        }
      }
    })

    return monthWindow
      .map((key) => {
        const bucket = buckets.get(key)!
        bucket.rooms = sortRooms(roomMaps.get(key)!)
        return bucket
      })
      .filter(
        (record) =>
          record.revenue > 0 ||
          record.pending > 0 ||
          record.bookings > 0 ||
          record.cancelled > 0 ||
          record.key === currentMonthKey()
      )
      .reverse()
  }, [bookings, monthWindow])

  const selectedStats = useMemo(() => {
    if (selectedMonth === 'all') {
      const paid = bookings.filter((booking) => booking.payment_status === 'paid')
      const pending = bookings.filter(
        (booking) => booking.payment_status === 'pending' && booking.status !== 'cancelled'
      )
      const active = bookings.filter((booking) => booking.status !== 'cancelled')
      const revenue = paid.reduce((sum, booking) => sum + Number(booking.total), 0)

      return {
        revenue,
        pending: pending.reduce((sum, booking) => sum + Number(booking.total), 0),
        bookings: active.length,
        paidBookings: paid.length,
        pendingBookings: pending.length,
        cancelled: bookings.length - active.length,
        previousRevenue: null as number | null,
        previousKey: '',
      }
    }

    const record = monthlyRecords.find((entry) => entry.key === selectedMonth)
    const previousKey = shiftMonth(selectedMonth, -1)
    const previous = monthlyRecords.find((entry) => entry.key === previousKey)

    return {
      revenue: record?.revenue ?? 0,
      pending: record?.pending ?? 0,
      bookings: record?.bookings ?? 0,
      paidBookings: record?.paidBookings ?? 0,
      pendingBookings: record?.pendingBookings ?? 0,
      cancelled: record?.cancelled ?? 0,
      previousRevenue: previous ? previous.revenue : null,
      previousKey,
    }
  }, [bookings, monthlyRecords, selectedMonth])

  const selectedRooms = useMemo(() => {
    if (selectedMonth === 'all') {
      const map = new Map<string, RoomRevenue>()
      bookings.forEach((booking) => {
        const cancelled = booking.status === 'cancelled'
        addRoom(
          map,
          booking.room_name,
          booking.payment_status === 'paid' ? Number(booking.total) || 0 : 0,
          cancelled ? 0 : 1
        )
      })
      return sortRooms(map)
    }

    return monthlyRecords.find((entry) => entry.key === selectedMonth)?.rooms ?? []
  }, [bookings, monthlyRecords, selectedMonth])

  const maxMonthRevenue = Math.max(...monthlyRecords.map((entry) => entry.revenue), 1)
  const maxRoomRevenue = Math.max(...selectedRooms.map((entry) => entry.revenue), 1)
  const selectedRoomTotal = selectedRooms.reduce((sum, entry) => sum + entry.revenue, 0)

  const revenueDelta =
    selectedStats.previousRevenue && selectedStats.previousRevenue > 0
      ? Math.round(
          ((selectedStats.revenue - selectedStats.previousRevenue) /
            selectedStats.previousRevenue) *
            100
        )
      : null

  const averageBooking = selectedStats.paidBookings
    ? selectedStats.revenue / selectedStats.paidBookings
    : 0

  function handleSelectMonth(key: string) {
    setSelectedMonth(key)
    if (key !== 'all') setExpandedMonth(key)
  }

  function exportRevenueCsv() {
    downloadCsv('tapserve-revenue-records.csv', [
      [
        'Month',
        'Bookings',
        'Paid bookings',
        'Paid revenue',
        'Pending amount',
        'Pending bookings',
        'Cancelled',
      ],
      ...monthlyRecords.map((record) => [
        monthLabel(record.key),
        record.bookings,
        record.paidBookings,
        record.revenue,
        record.pending,
        record.pendingBookings,
        record.cancelled,
      ]),
    ])
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="heading-font text-2xl font-bold text-slate-dark">Revenue reports</h1>
            {supabase && !error ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-700"
                title="Updates automatically when bookings change"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-700"
                title="Live updates are unavailable; data refreshes every 30 seconds"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Auto-refresh
              </span>
            )}
          </div>
          <p className="text-sm text-slate-muted mt-1">
            Realtime monthly revenue records and top-performing rooms.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-slate-muted">
            <CalendarDays className="w-4 h-4 text-indigo" />
            <select
              value={selectedMonth}
              onChange={(event) => handleSelectMonth(event.target.value)}
              aria-label="Select revenue month"
              className="bg-transparent text-sm font-semibold text-slate-dark outline-none"
            >
              {monthlyRecords.map((record) => (
                <option key={record.key} value={record.key}>
                  {monthLabel(record.key)}
                </option>
              ))}
              <option value="all">All time</option>
            </select>
          </label>
          <button
            type="button"
            onClick={exportRevenueCsv}
            disabled={monthlyRecords.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-slate-dark hover:border-indigo hover:text-indigo transition-colors disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            Export revenue CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <p>{error}</p>
          <p className="text-xs mt-1">
            Instant updates use Supabase Realtime; data still refreshes every 30 seconds without it.
          </p>
        </div>
      )}

      {/* ── Monthly stat cards ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Paid revenue',
            value: formatMoney(selectedStats.revenue),
            hint:
              selectedMonth === 'all'
                ? 'All recorded bookings'
                : revenueDelta === null
                  ? `No revenue in ${shortMonth(selectedStats.previousKey)}`
                  : `${revenueDelta >= 0 ? '↑' : '↓'} ${Math.abs(revenueDelta)}% vs ${shortMonth(selectedStats.previousKey)}`,
            icon: TrendingUp,
            tone: 'bg-emerald-50 text-emerald-600',
          },
          {
            label: 'Pending payments',
            value: formatMoney(selectedStats.pending),
            hint: `${selectedStats.pendingBookings} booking${selectedStats.pendingBookings === 1 ? '' : 's'} awaiting payment`,
            icon: Wallet,
            tone: 'bg-amber-50 text-amber-600',
          },
          {
            label: 'Bookings',
            value: selectedStats.bookings.toLocaleString(),
            hint: `${selectedStats.paidBookings} paid · ${selectedStats.cancelled} cancelled`,
            icon: Users,
            tone: 'bg-indigo-pale text-indigo',
          },
          {
            label: 'Average booking',
            value: formatMoney(averageBooking),
            hint: 'Per paid booking',
            icon: BarChart3,
            tone: 'bg-sky-50 text-sky-600',
          },
        ].map(({ label, value, hint, icon: Icon, tone }) => (
          <div
            key={label}
            className="rounded-2xl border border-border bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-muted">
                  {label}
                </p>
                <p className="heading-font text-2xl font-bold text-slate-dark mt-2">
                  {loading ? '—' : value}
                </p>
                <p className="text-xs text-slate-muted mt-1">{hint}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Revenue records + top rooms ──────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <section className="xl:col-span-3 rounded-2xl border border-border bg-white overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
            <div>
              <h2 className="font-semibold text-slate-dark">Revenue records</h2>
              <p className="text-xs text-slate-muted mt-0.5">
                Last 12 months · grouped by booking date · click a month to expand its rooms
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-muted">
              Monthly
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <div className="w-7 h-7 border-2 border-indigo/20 border-t-indigo rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-muted">Loading revenue records…</p>
            </div>
          ) : monthlyRecords.length === 0 ? (
            <div className="py-16 text-center">
              <BarChart3 className="w-9 h-9 text-slate-muted/30 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-muted">No revenue records yet</p>
              <p className="text-xs text-slate-muted/70 mt-1">
                Paid bookings will appear here month by month.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {monthlyRecords.map((record) => {
                const expanded = expandedMonth === record.key
                const active = selectedMonth === record.key
                return (
                  <div key={record.key} className={cn(active && 'bg-indigo-pale/20')}>
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectMonth(record.key)
                        setExpandedMonth(expanded ? '' : record.key)
                      }}
                      aria-expanded={expanded}
                      className="w-full px-5 py-3.5 flex items-center gap-3 text-left hover:bg-slate-bg/70 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-pale text-indigo flex flex-col items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold uppercase tracking-wide leading-none">
                          {shortMonth(record.key)}
                        </span>
                        <span className="text-xs font-bold leading-none mt-0.5">
                          {record.key.slice(2, 4)}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-dark truncate">
                          {monthLabel(record.key)}
                        </p>
                        <p className="text-[11px] text-slate-muted mt-0.5">
                          {record.bookings} booking{record.bookings === 1 ? '' : 's'} ·{' '}
                          {record.paidBookings} paid · {record.pendingBookings} pending
                        </p>
                        <div className="h-1.5 rounded-full bg-slate-bg overflow-hidden mt-1.5 max-w-[220px]">
                          <div
                            className="h-full rounded-full bg-indigo"
                            style={{
                              width: `${Math.max((record.revenue / maxMonthRevenue) * 100, record.revenue > 0 ? 3 : 0)}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-slate-dark">
                          {formatMoney(record.revenue)}
                        </p>
                        {record.pending > 0 && (
                          <p className="text-[10px] text-amber-600 mt-0.5">
                            {formatMoney(record.pending)} pending
                          </p>
                        )}
                      </div>

                      <ChevronDown
                        className={cn(
                          'w-4 h-4 text-slate-muted shrink-0 transition-transform',
                          expanded && 'rotate-180'
                        )}
                      />
                    </button>

                    {expanded && (
                      <div className="px-5 pb-4 pt-1 bg-slate-bg/40 border-t border-border-light">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-muted">
                            <Users className="w-3 h-3" /> {record.bookings} bookings
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                            {formatMoney(record.revenue)} collected
                          </span>
                          {record.pending > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                              {formatMoney(record.pending)} pending
                            </span>
                          )}
                          {record.cancelled > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600">
                              {record.cancelled} cancelled
                            </span>
                          )}
                        </div>

                        {record.rooms.length === 0 ? (
                          <p className="text-xs text-slate-muted py-2">
                            No room activity recorded this month.
                          </p>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {record.rooms.slice(0, 4).map((room) => {
                              const maxRoom = Math.max(
                                ...record.rooms.map((entry) => entry.revenue),
                                1
                              )
                              return (
                                <div key={room.room}>
                                  <div className="flex items-center justify-between text-[11px] mb-1">
                                    <span className="font-medium text-slate-dark truncate">
                                      {room.room}
                                    </span>
                                    <span className="text-slate-muted shrink-0 ml-2">
                                      {room.bookings} booking
                                      {room.bookings === 1 ? '' : 's'} ·{' '}
                                      {formatMoney(room.revenue)}
                                    </span>
                                  </div>
                                  <div className="h-1.5 rounded-full bg-white overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-emerald-500"
                                      style={{
                                        width: `${Math.max((room.revenue / maxRoom) * 100, room.revenue > 0 ? 3 : 0)}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="xl:col-span-2 rounded-2xl border border-border bg-white p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="font-semibold text-slate-dark">Top rooms by revenue</h2>
              <p className="text-xs text-slate-muted mt-0.5">
                {selectedMonth === 'all' ? 'All time' : monthLabel(selectedMonth)}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm text-slate-muted">Loading rooms…</p>
          ) : selectedRooms.length === 0 ? (
            <div className="py-10 text-center">
              <BarChart3 className="w-9 h-9 text-slate-muted/30 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-muted">No room revenue yet</p>
              <p className="text-xs text-slate-muted/70 mt-1">
                Paid bookings for this period will rank the rooms.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {selectedRooms.slice(0, 5).map((entry, index) => {
                const share = selectedRoomTotal ? (entry.revenue / selectedRoomTotal) * 100 : 0
                const average = entry.bookings ? entry.revenue / entry.bookings : 0
                return (
                  <div key={entry.room}>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span
                        className={cn(
                          'w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0',
                          index === 0
                            ? 'bg-amber-100 text-amber-700'
                            : index === 1
                              ? 'bg-slate-200 text-slate-600'
                              : index === 2
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-slate-bg text-slate-muted'
                        )}
                      >
                        {index + 1}
                      </span>
                      <p className="text-sm font-semibold text-slate-dark flex-1 min-w-0 truncate">
                        {entry.room}
                      </p>
                      <p className="text-sm font-bold text-slate-dark shrink-0">
                        {formatMoney(entry.revenue)}
                      </p>
                    </div>
                    <div className="h-2 rounded-full bg-slate-bg overflow-hidden ml-8">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{
                          width: `${Math.max((entry.revenue / maxRoomRevenue) * 100, entry.revenue > 0 ? 3 : 0)}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-muted mt-1 ml-8">
                      <span>
                        {entry.bookings} booking{entry.bookings === 1 ? '' : 's'}
                      </span>
                      <span>
                        {share.toFixed(1)}% share · avg {formatMoney(average)}
                      </span>
                    </div>
                  </div>
                )
              })}

              <div className="flex items-center justify-between border-t border-border pt-3 mt-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-muted">
                  Total room revenue
                </span>
                <span className="heading-font text-lg font-bold text-emerald-600">
                  {formatMoney(selectedRoomTotal)}
                </span>
              </div>
            </div>
          )}
        </section>
      </div>

      <p className="text-xs text-slate-muted">
        Monthly records are grouped by booking date and count revenue when payment is marked paid.
        Values update automatically whenever a booking is created, paid, cancelled, or changed.
      </p>
    </div>
  )
}
