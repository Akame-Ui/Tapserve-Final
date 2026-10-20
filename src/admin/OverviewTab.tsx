import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  LogIn,
  LogOut,
  Sparkles,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { AdminBooking, AdminEvent, AuditLog } from '@/admin/types'
import { formatDate, formatDateTime, formatMoney, initials } from '@/admin/utils'
import { cn } from '@/lib/utils'

type OverviewTabProps = {
  onNavigate: (tab: 'users' | 'events' | 'purchases' | 'reports') => void
}

type AdminProfile = {
  id: string
  full_name: string | null
  role: 'guest' | 'admin'
  tier: string | null
  points: number | null
  created_at: string
}

type OverviewState = {
  profiles: AdminProfile[]
  bookings: AdminBooking[]
  events: AdminEvent[]
  logs: AuditLog[]
}

type StatsTarget = 'users' | 'events' | 'purchases' | 'reports'

const PREVIEW = window.location.hash.includes('preview')

const previewBooking = (
  values: Partial<AdminBooking> & Pick<AdminBooking, 'id' | 'booking_code' | 'user_id' | 'room_name'>
): AdminBooking => ({
  guest_name: 'Guest',
  guest_email: 'guest@example.com',
  room_id: 'room-1',
  room_image: null,
  check_in: '2026-10-21',
  check_out: '2026-10-24',
  nights: 3,
  guests: 2,
  status: 'confirmed',
  total: 0,
  price_per_night: 0,
  card_last4: null,
  payment_method: 'card',
  payment_status: 'paid',
  created_at: '2026-10-20T10:00:00Z',
  ...values,
})

const previewData: OverviewState = {
  profiles: [
    { id: 'p1', full_name: 'Jaylon Dorwart', role: 'admin', tier: 'Platinum', points: 980, created_at: '2025-11-01T09:00:00Z' },
    { id: 'p2', full_name: 'Maria Santos', role: 'guest', tier: 'Gold', points: 640, created_at: '2026-10-02T09:00:00Z' },
    { id: 'p3', full_name: 'Kenji Tanaka', role: 'guest', tier: 'Silver', points: 420, created_at: '2026-09-18T09:00:00Z' },
    { id: 'p4', full_name: 'Aisha Rahman', role: 'guest', tier: 'Bronze', points: 210, created_at: '2026-08-11T09:00:00Z' },
    { id: 'p5', full_name: 'Daniel Reyes', role: 'guest', tier: 'Gold', points: 560, created_at: '2026-07-06T09:00:00Z' },
    { id: 'p6', full_name: 'Sofia Lim', role: 'guest', tier: 'Bronze', points: 180, created_at: '2026-06-21T09:00:00Z' },
  ],
  bookings: [
    previewBooking({
      id: 'b1', booking_code: 'B-2026-1041', user_id: 'p2', guest_name: 'Maria Santos', guest_email: 'maria@example.com',
      room_name: 'Ocean Suite', check_in: '2026-10-21', check_out: '2026-10-24', total: 2450, price_per_night: 816.67,
      payment_method: 'card', card_last4: '4242', created_at: '2026-10-20T10:00:00Z',
    }),
    previewBooking({
      id: 'b2', booking_code: 'B-2026-1040', user_id: 'p3', guest_name: 'Kenji Tanaka', guest_email: 'kenji@example.com',
      room_name: 'Garden Villa', check_in: '2026-10-21', check_out: '2026-10-23', nights: 2, total: 1890, price_per_night: 945,
      payment_method: 'card', card_last4: '1881', created_at: '2026-10-19T13:30:00Z',
    }),
    previewBooking({
      id: 'b3', booking_code: 'B-2026-1039', user_id: 'p4', guest_name: 'Aisha Rahman', guest_email: 'aisha@example.com',
      room_name: 'Deluxe King', check_in: '2026-10-18', check_out: '2026-10-21', total: 1450, price_per_night: 483.33,
      payment_method: 'cash', created_at: '2026-10-15T08:15:00Z',
    }),
    previewBooking({
      id: 'b4', booking_code: 'B-2026-1038', user_id: 'p5', guest_name: 'Daniel Reyes', guest_email: 'daniel@example.com',
      room_name: 'Sky Loft', check_in: '2026-10-25', check_out: '2026-10-28', total: 3200, price_per_night: 1066.67,
      status: 'pending', payment_method: 'cash', payment_status: 'pending', created_at: '2026-10-18T16:20:00Z',
    }),
    previewBooking({
      id: 'b5', booking_code: 'B-2026-1037', user_id: 'p6', guest_name: 'Sofia Lim', guest_email: 'sofia@example.com',
      room_name: 'Ocean Suite', check_in: '2026-11-02', check_out: '2026-11-05', total: 2450, price_per_night: 816.67,
      payment_method: 'card', card_last4: '5510', created_at: '2026-10-05T11:00:00Z',
    }),
    previewBooking({
      id: 'b6', booking_code: 'B-2026-1036', user_id: 'p5', guest_name: 'Daniel Reyes', guest_email: 'daniel@example.com',
      room_name: 'Garden Villa', check_in: '2026-10-22', check_out: '2026-10-24', nights: 2, total: 1890, price_per_night: 945,
      payment_method: 'cash', payment_status: 'pending', created_at: '2026-10-21T07:45:00Z',
    }),
    previewBooking({
      id: 'b7', booking_code: 'B-2026-1035', user_id: 'p2', guest_name: 'Maria Santos', guest_email: 'maria@example.com',
      room_name: 'Garden Villa', check_in: '2026-09-12', check_out: '2026-09-15', total: 2760, price_per_night: 920,
      status: 'completed', payment_method: 'card', card_last4: '4242', created_at: '2026-09-01T09:00:00Z',
    }),
    previewBooking({
      id: 'b8', booking_code: 'B-2026-1034', user_id: 'p3', guest_name: 'Kenji Tanaka', guest_email: 'kenji@example.com',
      room_name: 'Deluxe King', check_in: '2026-09-20', check_out: '2026-09-22', nights: 2, total: 980, price_per_night: 490,
      status: 'completed', payment_method: 'cash', created_at: '2026-09-10T12:00:00Z',
    }),
    previewBooking({
      id: 'b9', booking_code: 'B-2026-1033', user_id: 'p4', guest_name: 'Aisha Rahman', guest_email: 'aisha@example.com',
      room_name: 'Sky Loft', check_in: '2026-08-10', check_out: '2026-08-13', total: 3200, price_per_night: 1066.67,
      status: 'completed', payment_method: 'card', card_last4: '9002', created_at: '2026-08-01T10:00:00Z',
    }),
    previewBooking({
      id: 'b10', booking_code: 'B-2026-1032', user_id: 'p5', guest_name: 'Daniel Reyes', guest_email: 'daniel@example.com',
      room_name: 'Ocean Suite', check_in: '2026-08-20', check_out: '2026-08-23', total: 2450, price_per_night: 816.67,
      status: 'completed', payment_method: 'card', card_last4: '7711', created_at: '2026-08-05T09:30:00Z',
    }),
    previewBooking({
      id: 'b11', booking_code: 'B-2026-1031', user_id: 'p6', guest_name: 'Sofia Lim', guest_email: 'sofia@example.com',
      room_name: 'Garden Villa', check_in: '2026-07-10', check_out: '2026-07-12', nights: 2, total: 1890, price_per_night: 945,
      status: 'completed', payment_method: 'cash', created_at: '2026-07-02T15:00:00Z',
    }),
    previewBooking({
      id: 'b12', booking_code: 'B-2026-1030', user_id: 'p2', guest_name: 'Maria Santos', guest_email: 'maria@example.com',
      room_name: 'Sky Loft', check_in: '2026-06-15', check_out: '2026-06-18', total: 3200, price_per_night: 1066.67,
      status: 'completed', payment_method: 'card', card_last4: '4242', created_at: '2026-06-01T08:00:00Z',
    }),
    previewBooking({
      id: 'b13', booking_code: 'B-2026-1029', user_id: 'p3', guest_name: 'Kenji Tanaka', guest_email: 'kenji@example.com',
      room_name: 'Ocean Suite', check_in: '2026-05-10', check_out: '2026-05-13', total: 2450, price_per_night: 816.67,
      status: 'completed', payment_method: 'card', card_last4: '1881', created_at: '2026-05-02T10:00:00Z',
    }),
    previewBooking({
      id: 'b14', booking_code: 'B-2026-1028', user_id: 'p4', guest_name: 'Aisha Rahman', guest_email: 'aisha@example.com',
      room_name: 'Deluxe King', check_in: '2026-10-12', check_out: '2026-10-14', nights: 2, total: 980, price_per_night: 490,
      status: 'cancelled', payment_method: 'card', card_last4: '9002', created_at: '2026-10-10T10:00:00Z',
    }),
    previewBooking({
      id: 'b15', booking_code: 'B-2026-1027', user_id: 'p6', guest_name: 'Sofia Lim', guest_email: 'sofia@example.com',
      room_name: 'Deluxe King', check_in: '2026-10-26', check_out: '2026-10-28', nights: 2, total: 1450, price_per_night: 725,
      payment_method: 'card', card_last4: '5510', created_at: '2026-10-21T06:30:00Z',
    }),
  ],
  events: [
    { id: 'e1', title: 'Sunset Cocktail Hour', description: '', event_date: '2026-11-02', start_time: '18:00', end_time: '20:00', location: 'Rooftop', image_url: null, price: 45, capacity: 40, status: 'published', created_by: null, created_at: '2026-10-01T09:00:00Z', updated_at: '2026-10-01T09:00:00Z' },
    { id: 'e2', title: 'Chef’s Table', description: '', event_date: '2026-11-08', start_time: '19:00', end_time: '21:00', location: 'Garden Villa', image_url: null, price: 95, capacity: 20, status: 'published', created_by: null, created_at: '2026-10-02T09:00:00Z', updated_at: '2026-10-02T09:00:00Z' },
    { id: 'e3', title: 'Island Yoga', description: '', event_date: '2026-11-15', start_time: '07:00', end_time: '08:00', location: 'Beach Deck', image_url: null, price: 30, capacity: 25, status: 'draft', created_by: null, created_at: '2026-10-03T09:00:00Z', updated_at: '2026-10-03T09:00:00Z' },
  ],
  logs: [
    { id: 1, actor_id: 'p1', actor_email: 'admin@tapserve.ph', action: 'update', entity_type: 'booking', entity_id: 'b1', details: null, created_at: '2026-10-21T08:10:00Z' },
    { id: 2, actor_id: 'p1', actor_email: 'admin@tapserve.ph', action: 'create', entity_type: 'event', entity_id: 'e3', details: null, created_at: '2026-10-20T14:35:00Z' },
    { id: 3, actor_id: 'p1', actor_email: 'admin@tapserve.ph', action: 'payment', entity_type: 'booking', entity_id: 'b2', details: null, created_at: '2026-10-20T10:05:00Z' },
    { id: 4, actor_id: 'p1', actor_email: 'admin@tapserve.ph', action: 'transfer', entity_type: 'profile', entity_id: 'p5', details: null, created_at: '2026-10-19T16:20:00Z' },
  ],
}

/* ── Date + value helpers ───────────────────────────────────── */

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function dateKey(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function todayKey(): string {
  return dateKey(new Date())
}

function monthKey(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

function monthLabel(value: string | Date, style: 'short' | 'long' = 'short'): string {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', {
    month: style,
    year: style === 'long' ? 'numeric' : undefined,
  })
}

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

function compactMoney(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`
  return `$${Math.round(value)}`
}

function niceCeiling(value: number): number {
  if (value <= 0) return 100
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalized = value / magnitude
  const nice = normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return nice * magnitude
}

function smoothPath(points: Array<{ x: number; y: number }>): string {
  return points
    .map((point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`
      const previous = points[index - 1]
      const middle = (previous.x + point.x) / 2
      return `C ${middle} ${previous.y}, ${middle} ${point.y}, ${point.x} ${point.y}`
    })
    .join(' ')
}

function resolvePaymentMethod(booking: AdminBooking): 'card' | 'gcash' | 'cash' {
  if (booking.payment_method) return booking.payment_method
  return booking.payment_status === 'pending' ? 'cash' : 'card'
}

/* ── Small presentation components ──────────────────────────── */

function TrendPill({ value, label }: { value: number; label: string }) {
  const rounded = Math.abs(value).toFixed(1)
  const tone =
    value > 0
      ? 'bg-white/85 text-[#3d7a4e]'
      : value < 0
        ? 'bg-red-50 text-[#b4534a]'
        : 'bg-white/85 text-[#64748B]'

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', tone)}>
        {value >= 0 ? (
          <ArrowUpRight className="h-3 w-3" />
        ) : (
          <ArrowDownRight className="h-3 w-3" />
        )}
        {rounded}%
      </span>
      <span className="text-[10px] text-[#64748B]">{label}</span>
    </span>
  )
}

function StatCard({
  label,
  value,
  trend,
  trendLabel,
  footnote,
  icon: Icon,
  mint,
  onClick,
}: {
  label: string
  value: string
  trend: number
  trendLabel: string
  footnote: string
  icon: React.ElementType
  mint?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group rounded-[26px] p-5 text-left transition-transform hover:-translate-y-0.5',
        mint
          ? 'bg-[#E0E7FF] shadow-[0_24px_50px_-40px_rgba(79,70,229,0.45)]'
          : 'border border-[#E2E8F0] bg-white shadow-[0_24px_50px_-42px_rgba(15,23,42,0.4)]'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[#475569]">{label}</p>
        <span
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl border',
            mint
              ? 'border-white/70 bg-white/60 text-[#4338CA]'
              : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#4F46E5]'
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.04em] text-[#1E293B]">
        {value}
      </p>
      <div className="mt-5 flex flex-col gap-1">
        <TrendPill value={trend} label={trendLabel} />
        <span className="text-[10px] text-[#64748B]">{footnote}</span>
      </div>
    </button>
  )
}

function Panel({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={cn('admin-card overflow-hidden', className)}>
      <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-5">
        <div>
          <h2 className="text-base font-semibold tracking-[-0.02em] text-[#1E293B]">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[11px] text-[#64748B]">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className={cn('px-5 pb-5', bodyClassName)}>{children}</div>
    </section>
  )
}

function RevenueChart({ data }: { data: Array<{ label: string; revenue: number }> }) {
  const width = 760
  const height = 250
  const left = 48
  const right = 14
  const top = 32
  const bottom = 36
  const innerWidth = width - left - right
  const innerHeight = height - top - bottom
  const maximum = niceCeiling(Math.max(...data.map((entry) => entry.revenue), 1))
  const step = innerWidth / Math.max(data.length - 1, 1)
  const points = data.map((entry, index) => ({
    x: left + index * step,
    y: top + innerHeight - (entry.revenue / maximum) * innerHeight,
    ...entry,
  }))
  const line = smoothPath(points)
  const area = line
    ? `${line} L ${points[points.length - 1].x} ${top + innerHeight} L ${points[0].x} ${top + innerHeight} Z`
    : ''
  const ticks = Array.from({ length: 5 }, (_, index) => {
    const value = (maximum / 4) * index
    return { value, y: top + innerHeight - (value / maximum) * innerHeight }
  })
  const lastPoint = points[points.length - 1]
  const labelX = Math.min(Math.max(lastPoint.x, 62), width - 62)

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mt-1 h-[250px] w-full"
      role="img"
      aria-label="Paid revenue by month"
    >
      <defs>
        <linearGradient id="admin-revenue-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C7D2FE" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#EEF2FF" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {ticks.map((tick) => (
        <g key={tick.value}>
          <line
            x1={left}
            y1={tick.y}
            x2={width - right}
            y2={tick.y}
            stroke="#E2E8F0"
            strokeDasharray="4 5"
          />
          <text
            x={left - 10}
            y={tick.y + 3}
            textAnchor="end"
            fontSize={10}
            fill="#94A3B8"
          >
            {compactMoney(tick.value)}
          </text>
        </g>
      ))}

      {area && <path d={area} fill="url(#admin-revenue-fill)" />}
      {line && (
        <path
          d={line}
          fill="none"
          stroke="#818CF8"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {points.map((point) => (
        <g key={point.label}>
          <circle cx={point.x} cy={point.y} r={4} fill="#ffffff" stroke="#6366F1" strokeWidth={2.5}>
            <title>{`${point.label}: ${formatMoney(point.revenue)}`}</title>
          </circle>
        </g>
      ))}

      {lastPoint && (
        <g>
          <line
            x1={lastPoint.x}
            y1={lastPoint.y + 7}
            x2={labelX}
            y2={lastPoint.y - 22}
            stroke="#C7D2FE"
            strokeDasharray="3 3"
          />
          <rect
            x={labelX - 54}
            y={lastPoint.y - 44}
            width={108}
            height={24}
            rx={12}
            fill="#E0E7FF"
          />
          <text
            x={labelX}
            y={lastPoint.y - 28}
            textAnchor="middle"
            fontSize={10}
            fontWeight={700}
            fill="#4338CA"
          >
            {`Total ${compactMoney(lastPoint.revenue)}`}
          </text>
        </g>
      )}

      {data.map((entry, index) => (
        <text
          key={entry.label}
          x={left + index * step}
          y={height - 10}
          textAnchor="middle"
          fontSize={10}
          fill="#94A3B8"
        >
          {entry.label}
        </text>
      ))}
    </svg>
  )
}

/* ── Overview ───────────────────────────────────────────────── */

export function OverviewTab({ onNavigate }: OverviewTabProps) {
  const [data, setData] = useState<OverviewState>(PREVIEW ? previewData : {
    profiles: [],
    bookings: [],
    events: [],
    logs: [],
  })
  const [loading, setLoading] = useState(Boolean(supabase) && !PREVIEW)
  const [error, setError] = useState<string | null>(
    PREVIEW ? null : supabase ? null : 'Supabase is not configured.'
  )
  const [live, setLive] = useState(PREVIEW)
  const [chartRange, setChartRange] = useState<6 | 12>(6)

  useEffect(() => {
    if (PREVIEW) return
    const client = supabase
    if (!client) return

    let cancelled = false

    async function loadOverview() {
      const [profiles, bookings, events, logs] = await Promise.all([
        client!
          .from('profiles')
          .select('id, full_name, role, tier, points, created_at')
          .order('created_at', { ascending: false }),
        client!
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false }),
        client!.from('events').select('*').order('event_date', { ascending: true }),
        client!
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(8),
      ])

      if (cancelled) return

      const firstError = profiles.error ?? bookings.error ?? events.error ?? logs.error

      if (firstError) {
        setError(firstError.message)
      } else {
        setError(null)
      }

      setData({
        profiles: (profiles.data ?? []) as AdminProfile[],
        bookings: (bookings.data ?? []) as AdminBooking[],
        events: (events.data ?? []) as AdminEvent[],
        logs: (logs.data ?? []) as AuditLog[],
      })
      setLoading(false)
    }

    void loadOverview()

    const channel = client
      .channel('tapserve-admin-overview')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          void loadOverview()
        }
      )
      .subscribe((status) => {
        if (!cancelled) setLive(status === 'SUBSCRIBED')
      })

    const poll = window.setInterval(() => {
      void loadOverview()
    }, 30000)

    return () => {
      cancelled = true
      window.clearInterval(poll)
      void client.removeChannel(channel)
    }
  }, [])

  const now = new Date()
  const today = todayKey()
  const yesterday = dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))
  const thisMonth = monthKey(now)
  const lastMonth = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1))

  const activeBookings = data.bookings.filter((booking) => booking.status !== 'cancelled')
  const paidBookings = data.bookings.filter((booking) => booking.payment_status === 'paid')
  const totalRevenue = paidBookings.reduce((sum, booking) => sum + Number(booking.total), 0)
  const paidThisMonth = paidBookings
    .filter((booking) => monthKey(booking.created_at) === thisMonth)
    .reduce((sum, booking) => sum + Number(booking.total), 0)
  const paidLastMonth = paidBookings
    .filter((booking) => monthKey(booking.created_at) === lastMonth)
    .reduce((sum, booking) => sum + Number(booking.total), 0)
  const newThisMonth = data.bookings.filter((booking) => monthKey(booking.created_at) === thisMonth)
  const newLastMonth = data.bookings.filter((booking) => monthKey(booking.created_at) === lastMonth)
  const checkInsToday = activeBookings.filter((booking) => booking.check_in === today)
  const checkInsYesterday = activeBookings.filter((booking) => booking.check_in === yesterday)
  const checkOutsToday = activeBookings.filter((booking) => booking.check_out === today)
  const checkOutsYesterday = activeBookings.filter((booking) => booking.check_out === yesterday)
  const arrivalsWeek = activeBookings.filter((booking) => {
    const key = dateKey(new Date(`${booking.check_in}T00:00:00`))
    return key >= today && key <= dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7))
  })
  const departuresWeek = activeBookings.filter((booking) => {
    const key = dateKey(new Date(`${booking.check_out}T00:00:00`))
    return key >= today && key <= dateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7))
  })
  const publishedEvents = data.events.filter((event) => event.status === 'published').length

  const stats: Array<{
    label: string
    value: string
    trend: number
    trendLabel: string
    footnote: string
    icon: React.ElementType
    mint?: boolean
    target: StatsTarget
  }> = [
    {
      label: 'New Bookings',
      value: newThisMonth.length.toLocaleString(),
      trend: percentChange(newThisMonth.length, newLastMonth.length),
      trendLabel: 'from last month',
      footnote: `${data.bookings.length} bookings all time`,
      icon: CalendarDays,
      mint: true,
      target: 'purchases',
    },
    {
      label: 'Check-In',
      value: checkInsToday.length.toLocaleString(),
      trend: percentChange(checkInsToday.length, checkInsYesterday.length),
      trendLabel: 'vs yesterday',
      footnote: `${arrivalsWeek.length} arriving in the next 7 days`,
      icon: LogIn,
      target: 'purchases',
    },
    {
      label: 'Check-Out',
      value: checkOutsToday.length.toLocaleString(),
      trend: percentChange(checkOutsToday.length, checkOutsYesterday.length),
      trendLabel: 'vs yesterday',
      footnote: `${departuresWeek.length} departing in the next 7 days`,
      icon: LogOut,
      target: 'purchases',
    },
    {
      label: 'Total Revenue',
      value: formatMoney(totalRevenue),
      trend: percentChange(paidThisMonth, paidLastMonth),
      trendLabel: 'from last month',
      footnote: `${formatMoney(paidThisMonth)} collected this month`,
      icon: Wallet,
      target: 'reports',
    },
  ]

  const chartData = (() => {
    const months = Array.from({ length: chartRange }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (chartRange - 1 - index), 1)
      return {
        key: monthKey(date),
        label: monthLabel(date),
        revenue: 0,
      }
    })

    const revenueByMonth = new Map<string, number>()
    data.bookings.forEach((booking) => {
      if (booking.payment_status !== 'paid') return
      const key = monthKey(booking.created_at)
      revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + Number(booking.total))
    })

    return months.map((month) => ({
      label: month.label,
      revenue: revenueByMonth.get(month.key) ?? 0,
    }))
  })()

  const weekData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - index))
    const key = dateKey(date)
    const daily = data.bookings.filter((booking) => dateKey(booking.created_at) === key)
    return {
      key,
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      booked: daily.filter((booking) => booking.status !== 'cancelled').length,
      cancelled: daily.filter((booking) => booking.status === 'cancelled').length,
    }
  })

  const maxDaily = Math.max(...weekData.map((day) => day.booked + day.cancelled), 1)

  const statusRows = [
    {
      label: 'Confirmed',
      count: data.bookings.filter((booking) => booking.status === 'confirmed').length,
      color: '#8fd6a8',
      soft: 'bg-[#e8f7ee] text-[#3d7a4e]',
    },
    {
      label: 'Pending',
      count: data.bookings.filter((booking) => booking.status === 'pending').length,
      color: '#FBBF24',
      soft: 'bg-[#FEF3C7] text-[#B45309]',
    },
    {
      label: 'Completed',
      count: data.bookings.filter((booking) => booking.status === 'completed').length,
      color: '#CBD5E1',
      soft: 'bg-[#EEF2FF] text-[#475569]',
    },
    {
      label: 'Cancelled',
      count: data.bookings.filter((booking) => booking.status === 'cancelled').length,
      color: '#efb3aa',
      soft: 'bg-[#fdebe8] text-[#b4534a]',
    },
  ]
  const statusTotal = statusRows.reduce((sum, row) => sum + row.count, 0)

  const paymentCounts = activeBookings.reduce(
    (counts, booking) => {
      counts[resolvePaymentMethod(booking)] += 1
      return counts
    },
    { card: 0, gcash: 0, cash: 0 }
  )
  const paymentTotal = paymentCounts.card + paymentCounts.cash
  const cardShare = paymentTotal ? (paymentCounts.card / paymentTotal) * 100 : 0

  const profileMap = useMemo(
    () => new Map(data.profiles.map((profile) => [profile.id, profile])),
    [data.profiles]
  )
  const guestCounts = new Map<string, number>()
  data.bookings.forEach((booking) => {
    guestCounts.set(booking.user_id, (guestCounts.get(booking.user_id) ?? 0) + 1)
  })
  const bookedAccounts = guestCounts.size
  const returningAccounts = Array.from(guestCounts.values()).filter((count) => count > 1).length
  const newAccounts = data.profiles.filter(
    (profile) => monthKey(profile.created_at) === thisMonth
  ).length
  const linkedBookings = data.bookings.filter((booking) => profileMap.has(booking.user_id)).length
  const linkedShare = data.bookings.length
    ? Math.round((linkedBookings / data.bookings.length) * 100)
    : 0
  const topGuest = Array.from(guestCounts.entries()).sort((a, b) => b[1] - a[1])[0]
  const topGuestProfile = topGuest ? profileMap.get(topGuest[0]) : undefined
  const topGuestBooking = topGuest
    ? data.bookings.find((booking) => booking.user_id === topGuest[0])
    : undefined
  const topGuestName =
    topGuestProfile?.full_name ??
    topGuestBooking?.guest_name ??
    topGuestBooking?.guest_email ??
    'No bookings yet'
  const recentProfiles = data.profiles.slice(0, 5)
  const recentBookings = data.bookings.slice(0, 6)

  const statusClasses: Record<AdminBooking['status'], string> = {
    confirmed: 'bg-[#e8f7ee] text-[#3d7a4e]',
    pending: 'bg-[#fbf4d7] text-[#947516]',
    completed: 'bg-[#EEF2FF] text-[#475569]',
    cancelled: 'bg-[#fdebe8] text-[#b4534a]',
  }

  const paymentClasses: Record<AdminBooking['payment_status'], string> = {
    paid: 'bg-[#e8f7ee] text-[#3d7a4e]',
    pending: 'bg-[#fbf4d7] text-[#947516]',
    overdue: 'bg-[#fdebe8] text-[#b4534a]',
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="heading-font text-[28px] font-bold text-[#1E293B]">Dashboard</h1>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em]',
                live
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-amber-200 bg-amber-50 text-amber-700'
              )}
              title="Statistics refresh automatically"
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  live ? 'animate-pulse bg-emerald-500' : 'bg-amber-500'
                )}
              />
              {live ? 'Live' : 'Auto-refresh'}
            </span>
          </div>
          <p className="mt-1 text-sm text-[#64748B]">
            A live look at bookings, guests, and revenue across TapServe.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E2E8F0] bg-white px-3 py-2 text-[11px] font-medium text-[#64748B]">
            <CalendarDays className="h-3.5 w-3.5 text-[#6366F1]" />
            {now.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <button
            type="button"
            onClick={() => onNavigate('purchases')}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#E0E7FF] px-4 py-2 text-[11px] font-bold text-[#4338CA] transition-colors hover:bg-[#C7D2FE]"
          >
            View bookings
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
          {error}
        </div>
      )}

      {/* ── Live stat cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, trend, trendLabel, footnote, icon, mint, target }) => (
          <StatCard
            key={label}
            label={label}
            value={loading ? '—' : value}
            trend={trend}
            trendLabel={trendLabel}
            footnote={footnote}
            icon={icon}
            mint={mint}
            onClick={() => onNavigate(target)}
          />
        ))}
      </div>

      {/* ── Main analytics ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="flex flex-col gap-5 xl:col-span-8">
          <Panel
            title="Revenue"
            subtitle="Paid booking revenue, grouped by booking date"
            action={
              <div className="flex rounded-full bg-[#EEF2FF] p-1 text-[10px] font-semibold text-[#64748B]">
                <button
                  type="button"
                  onClick={() => setChartRange(6)}
                  className={cn(
                    'rounded-full px-3 py-1.5 transition-colors',
                    chartRange === 6 ? 'bg-[#E0E7FF] text-[#4338CA]' : 'hover:text-[#1E293B]'
                  )}
                >
                  Last 6 months
                </button>
                <button
                  type="button"
                  onClick={() => setChartRange(12)}
                  className={cn(
                    'rounded-full px-3 py-1.5 transition-colors',
                    chartRange === 12 ? 'bg-[#E0E7FF] text-[#4338CA]' : 'hover:text-[#1E293B]'
                  )}
                >
                  12 months
                </button>
              </div>
            }
          >
            {loading ? (
              <div className="flex h-[250px] items-center justify-center text-sm text-[#64748B]">
                Loading revenue…
              </div>
            ) : chartData.some((entry) => entry.revenue > 0) ? (
              <RevenueChart data={chartData} />
            ) : (
              <div className="flex h-[250px] flex-col items-center justify-center text-center">
                <CircleDollarSign className="mb-2 h-9 w-9 text-[#CBD5E1]" />
                <p className="text-sm font-medium text-[#64748B]">No paid revenue in this period</p>
                <p className="mt-1 text-xs text-[#94A3B8]">
                  Payments marked as paid will appear here automatically.
                </p>
              </div>
            )}
          </Panel>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Panel
              title="Booking status"
              subtitle="Live reservation mix"
              action={
                <button
                  type="button"
                  onClick={() => onNavigate('purchases')}
                  className="text-[11px] font-semibold text-[#4F46E5] hover:text-[#4338CA]"
                >
                  View all
                </button>
              }
            >
              <div className="flex h-3 overflow-hidden rounded-full bg-[#EEF2FF]">
                {statusRows.map((row) =>
                  row.count > 0 ? (
                    <div
                      key={row.label}
                      style={{
                        width: `${(row.count / Math.max(statusTotal, 1)) * 100}%`,
                        backgroundColor: row.color,
                      }}
                      title={`${row.label}: ${row.count}`}
                    />
                  ) : null
                )}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4">
                {statusRows.map((row) => (
                  <div key={row.label}>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      <span className="text-[11px] text-[#64748B]">{row.label}</span>
                    </div>
                    <p className="mt-1 text-xl font-semibold text-[#1E293B]">{row.count}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-[#F1F5F9] px-3 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#64748B]">
                  Total bookings
                </span>
                <span className="text-xs font-bold text-[#1E293B]">{statusTotal}</span>
              </div>
            </Panel>

            <Panel
              title="Reservations"
              subtitle="Bookings created in the last 7 days"
              action={
                <span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[10px] font-semibold text-[#4F46E5]">
                  Last 7 days
                </span>
              }
            >
              <div className="flex h-[148px] items-end gap-2">
                {weekData.map((day) => {
                  const total = day.booked + day.cancelled
                  const totalHeight = total ? Math.max((total / maxDaily) * 100, 8) : 3
                  const bookedHeight = total ? (day.booked / total) * totalHeight : 0
                  return (
                    <div key={day.key} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                      <div
                        className="flex w-full max-w-[30px] flex-col justify-end overflow-hidden rounded-t-lg bg-[#EEF2FF]"
                        style={{ height: `${totalHeight}%` }}
                        title={`${day.label}: ${day.booked} booked, ${day.cancelled} cancelled`}
                      >
                        <div
                          className="w-full rounded-t-lg bg-[#6366F1]"
                          style={{ height: `${bookedHeight}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[#94A3B8]">{day.label}</span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 flex items-center gap-4 text-[10px] text-[#64748B]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#6366F1]" /> Booked
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#EEF2FF]" /> Cancelled
                </span>
              </div>
            </Panel>
          </div>
        </div>

        <div className="flex flex-col gap-5 xl:col-span-4">
          <Panel
            title="Guest accounts"
            subtitle="Bookings connected to registered guests"
            action={
              <button
                type="button"
                onClick={() => onNavigate('users')}
                className="text-[11px] font-semibold text-[#4F46E5] hover:text-[#4338CA]"
              >
                Manage
              </button>
            }
          >
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[38px] font-semibold leading-none tracking-[-0.05em] text-[#1E293B]">
                  {data.profiles.length}
                </p>
                <p className="mt-1 text-[11px] text-[#64748B]">registered accounts</p>
              </div>
              {recentProfiles.length > 0 && (
                <div className="flex -space-x-2">
                  {recentProfiles.map((profile) => (
                    <span
                      key={profile.id}
                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#E0E7FF] text-[9px] font-bold text-[#4338CA]"
                      title={profile.full_name ?? 'Guest account'}
                    >
                      {initials(profile.full_name)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-3">
              {[
                {
                  label: 'Bookings linked to accounts',
                  value: linkedBookings,
                  total: Math.max(data.bookings.length, 1),
                  display: `${linkedShare}%`,
                },
                {
                  label: 'Guests with bookings',
                  value: bookedAccounts,
                  total: Math.max(data.profiles.length, 1),
                  display: String(bookedAccounts),
                },
                {
                  label: 'Returning guests',
                  value: returningAccounts,
                  total: Math.max(bookedAccounts, 1),
                  display: String(returningAccounts),
                },
                {
                  label: 'New accounts this month',
                  value: newAccounts,
                  total: Math.max(data.profiles.length, 1),
                  display: String(newAccounts),
                },
              ].map((row) => (
                <div key={row.label}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-[#64748B]">{row.label}</span>
                    <span className="font-semibold text-[#1E293B]">{row.display}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#EEF2FF]">
                    <div
                      className="h-full rounded-full bg-[#818CF8]"
                      style={{ width: `${Math.min((row.value / row.total) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl bg-[#F8FAFC] px-3.5 py-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#64748B]">
                Top guest
              </p>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <span className="truncate text-xs font-semibold text-[#1E293B]">
                  {topGuestName}
                </span>
                {topGuest && (
                  <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[#4F46E5]">
                    {topGuest[1]} booking{topGuest[1] === 1 ? '' : 's'}
                  </span>
                )}
              </div>
            </div>
          </Panel>

          <Panel
            title="Recent activity"
            subtitle="Latest administrator actions"
            action={
              <button
                type="button"
                onClick={() => onNavigate('reports')}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4F46E5] hover:text-[#4338CA]"
              >
                Revenue <ChevronRight className="h-3 w-3" />
              </button>
            }
          >
            {loading ? (
              <p className="py-8 text-center text-xs text-[#64748B]">Loading activity…</p>
            ) : data.logs.length === 0 ? (
              <p className="py-8 text-center text-xs text-[#64748B]">No activity recorded yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {data.logs.slice(0, 4).map((log, index) => (
                  <div
                    key={log.id}
                    className={cn(
                      'rounded-2xl px-3.5 py-3',
                      index % 3 === 0
                        ? 'bg-[#EEF2FF]'
                        : index % 3 === 1
                          ? 'bg-[#E0E7FF]'
                          : 'bg-[#F1F5F9]'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6366F1]" />
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-semibold text-[#1E293B]">
                          {log.action.toUpperCase()} · {log.entity_type}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] text-[#64748B]">
                          {log.actor_email ?? 'system'} · {formatDateTime(log.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* ── Payment mix + recent reservations ──────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Panel
          title="Booking by payment"
          subtitle="Active bookings by payment method"
          className="lg:col-span-4"
          action={
            <button
              type="button"
              onClick={() => onNavigate('purchases')}
              className="text-[11px] font-semibold text-[#4F46E5] hover:text-[#4338CA]"
            >
              Details
            </button>
          }
        >
          <div className="flex flex-col items-center gap-5 sm:flex-row lg:flex-col">
            <div
              className="relative flex h-36 w-36 shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#6366F1 0 ${cardShare}%, #A5B4FC ${cardShare}% 100%)`,
              }}
              role="img"
              aria-label={`${paymentCounts.card} online card, ${paymentCounts.gcash} gcash bookings, ${paymentCounts.cash} cash bookings`}
            >
              <div className="flex h-[104px] w-[104px] flex-col items-center justify-center rounded-full bg-white">
                <span className="text-2xl font-semibold text-[#1E293B]">{paymentTotal}</span>
                <span className="text-[9px] uppercase tracking-[0.12em] text-[#94A3B8]">
                  bookings
                </span>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3">
              {[
                {
                  label: 'Online card',
                  count: paymentCounts.card,
                  color: '#6366F1',
                },
                { label: 'GCash', count: paymentCounts.gcash, color: '#06B6D4' },
                { label: 'Cash', count: paymentCounts.cash, color: '#A5B4FC' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-[11px] text-[#64748B]">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: row.color }}
                    />
                    {row.label}
                  </span>
                  <span className="text-[11px] font-semibold text-[#1E293B]">
                    {paymentTotal ? Math.round((row.count / paymentTotal) * 100) : 0}% · {row.count}
                  </span>
                </div>
              ))}
              <div className="mt-1 flex items-center justify-between rounded-xl bg-[#F1F5F9] px-3 py-2">
                <span className="text-[10px] text-[#64748B]">Cancelled</span>
                <span className="text-[11px] font-semibold text-[#b4534a]">
                  {data.bookings.filter((booking) => booking.status === 'cancelled').length}
                </span>
              </div>
            </div>
          </div>
        </Panel>

        <section className="admin-card overflow-hidden lg:col-span-8">
          <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-5">
            <div>
              <h2 className="text-base font-semibold tracking-[-0.02em] text-[#1E293B]">
                Recent reservations
              </h2>
              <p className="mt-0.5 text-[11px] text-[#64748B]">
                Latest bookings linked to guest accounts
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('purchases')}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4F46E5] hover:text-[#4338CA]"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>

          {loading ? (
            <p className="px-5 py-10 text-center text-sm text-[#64748B]">Loading bookings…</p>
          ) : recentBookings.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-[#64748B]">No bookings yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-[#F1F5F9] text-[9px] uppercase tracking-[0.12em] text-[#94A3B8]">
                  <tr>
                    <th className="px-5 py-2.5 font-bold">Guest account</th>
                    <th className="px-3 py-2.5 font-bold">Room</th>
                    <th className="px-3 py-2.5 font-bold">Stay</th>
                    <th className="px-3 py-2.5 font-bold">Amount</th>
                    <th className="px-5 py-2.5 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2FF]">
                  {recentBookings.map((booking) => {
                    const profile = profileMap.get(booking.user_id)
                    const accountName =
                      profile?.full_name ?? booking.guest_name ?? booking.guest_email ?? 'Guest'
                    return (
                      <tr key={booking.id} className="transition-colors hover:bg-[#F8FAFC]">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E0E7FF] text-[9px] font-bold text-[#4338CA]">
                              {initials(accountName)}
                            </span>
                            <div className="min-w-0">
                              <p className="max-w-[190px] truncate text-xs font-semibold text-[#1E293B]">
                                {accountName}
                              </p>
                              <p className="max-w-[190px] truncate text-[10px] text-[#64748B]">
                                {booking.guest_email ?? 'No account email'}
                              </p>
                              <span className="mt-0.5 inline-flex items-center gap-1 text-[9px] font-medium text-[#4F46E5]">
                                {profile ? (
                                  <>
                                    <UserCheck className="h-2.5 w-2.5" />
                                    {profile.tier ?? 'Guest account'}
                                  </>
                                ) : (
                                  'Booking profile'
                                )}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <p className="max-w-[150px] truncate text-xs font-medium text-[#1E293B]">
                            {booking.room_name}
                          </p>
                          <p className="mt-0.5 text-[10px] text-[#64748B]">
                            {booking.booking_code} · {booking.nights} night
                            {booking.nights === 1 ? '' : 's'}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-[11px] text-[#64748B]">
                          <p>{formatDate(booking.check_in)}</p>
                          <p className="mt-0.5 text-[10px] text-[#94A3B8]">
                            to {formatDate(booking.check_out)}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-xs font-semibold text-[#1E293B]">
                            {formatMoney(booking.total)}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1">
                            <span className="text-[9px] text-[#64748B]">
                              {resolvePaymentMethod(booking) === 'cash' ? 'Cash' : 'Online'}
                            </span>
                            <span
                              className={cn(
                                'rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide',
                                paymentClasses[booking.payment_status]
                              )}
                            >
                              {booking.payment_status}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wide',
                              statusClasses[booking.status]
                            )}
                          >
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* ── Quick actions ───────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Manage guests',
            detail: `${data.profiles.length} registered accounts`,
            icon: Users,
            tone: 'bg-[#EEF2FF]',
            target: 'users' as const,
          },
          {
            label: 'Create an event',
            detail: `${publishedEvents} published experiences`,
            icon: Sparkles,
            tone: 'bg-[#E0E7FF]',
            target: 'events' as const,
          },
          {
            label: 'Review bookings',
            detail: `${activeBookings.length} active reservations`,
            icon: CreditCard,
            tone: 'bg-[#F1F5F9]',
            target: 'purchases' as const,
          },
        ].map(({ label, detail, icon: Icon, tone, target }) => (
          <button
            key={label}
            type="button"
            onClick={() => onNavigate(target)}
            className="group flex items-center justify-between gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 text-left transition-colors hover:border-[#C7D2FE]"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#4338CA]',
                  tone
                )}
              >
                <Icon className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-[#1E293B]">{label}</p>
                <p className="mt-0.5 truncate text-[10px] text-[#64748B]">{detail}</p>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-[#94A3B8] transition-colors group-hover:text-[#4F46E5]" />
          </button>
        ))}
      </div>

      <p className="flex items-center gap-1.5 text-[10px] text-[#94A3B8]">
        <Activity className="h-3 w-3" />
        Revenue counts bookings marked as paid. The dashboard refreshes automatically whenever
        bookings change.
      </p>
    </div>
  )
}
