import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  History,
  Hourglass,
  LogOut,
  Star,
  TrendingUp,
  Users,
  XCircle,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/context/AuthContext'
import { CancelBookingDialog } from '@/components/booking/CancelBookingDialog'
import {
  useBookings,
  type StoredBooking,
  type BookingStatus,
  type PaymentMethod,
  type PaymentStatus,
} from '@/context/BookingsContext'

/* ── Types ───────────────────────────────────────────────────── */

interface Payment {
  id: string
  description: string
  amount: number
  due: string
  status: PaymentStatus
  method: PaymentMethod
  cardLast4: string
}

interface HistoryItem {
  id: string
  room: string
  image: string
  checkIn: string
  checkOut: string
  nights: number
  total: number
  rating: number
}

/* ── Sub-components ─────────────────────────────────────────── */

const statusConfig: Record<BookingStatus, { label: string; color: string; icon: React.ReactNode }> = {
  confirmed: { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-3 h-3" /> },
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Hourglass className="w-3 h-3" /> },
  completed: { label: 'Completed', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: <CheckCircle2 className="w-3 h-3" /> },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-600 border-red-200', icon: <AlertCircle className="w-3 h-3" /> },
}

const paymentConfig: Record<PaymentStatus, { label: string; color: string }> = {
  pending: { label: 'Due Soon', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700 border-red-200' },
  paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
}

function BookingCard({
  booking,
  onCancel,
}: {
  booking: StoredBooking
  onCancel: (booking: StoredBooking) => void
}) {
  const status = statusConfig[booking.status]
  const canCancel = booking.status === 'confirmed' || booking.status === 'pending'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border overflow-hidden bg-white"
    >
      <div className="relative h-28 overflow-hidden">
        <img src={booking.image} alt={booking.room} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
          <p className="text-white font-semibold text-sm leading-tight">{booking.room}</p>
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold border rounded-full px-2 py-0.5 ${status.color}`}>
            {status.icon} {status.label}
          </span>
        </div>
      </div>
      <div className="px-3 py-3 flex flex-col gap-2">
        <div className="flex items-center gap-4 text-xs text-slate-muted">
          <span className="flex items-center gap-1">
            <CalendarDays className="w-3 h-3 text-indigo" />
            {booking.checkIn} → {booking.checkOut}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-slate-muted">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {booking.nights} nights
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {booking.guests} guests
            </span>
          </div>
          <p className="text-sm font-bold text-slate-dark">${booking.total.toLocaleString()}</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-slate-muted font-mono tracking-wider">{booking.id}</p>
          {booking.cardLast4 ? (
            <span className="text-[10px] text-slate-muted flex items-center gap-1">
              <CreditCard className="w-3 h-3" /> ···· {booking.cardLast4}
            </span>
          ) : booking.paymentMethod === 'cash' ? (
            <span className="text-[10px] text-amber-700 flex items-center gap-1">
              <Banknote className="w-3 h-3" /> Cash on arrival
            </span>
          ) : null}
        </div>
        {canCancel && (
          <div className="pt-2 mt-0.5 border-t border-border-light">
            <button
              type="button"
              onClick={() => onCancel(booking)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 -ml-2 text-[11px] font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel booking
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function PaymentCard({ payment }: { payment: Payment }) {
  const cfg = paymentConfig[payment.status]
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-white p-4 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-sm font-semibold text-slate-dark leading-tight">{payment.description}</p>
          <p className="text-xs text-slate-muted flex items-center gap-1">
            <Clock className="w-3 h-3" /> Due: {payment.due}
          </p>
          {payment.method === 'cash' ? (
            <p className="text-xs text-amber-700 flex items-center gap-1">
              <Banknote className="w-3 h-3" /> Pay cash at the front desk
            </p>
          ) : payment.cardLast4 ? (
            <p className="text-xs text-slate-muted flex items-center gap-1">
              <CreditCard className="w-3 h-3" /> Card ···· {payment.cardLast4}
            </p>
          ) : null}
        </div>
        <span className={`inline-flex items-center text-[10px] font-bold border rounded-full px-2 py-0.5 shrink-0 ${cfg.color}`}>
          {cfg.label}
        </span>
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <p className="text-xl font-bold text-slate-dark">${payment.amount.toLocaleString()}</p>
        {payment.status === 'paid' ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Paid
          </span>
        ) : payment.method === 'cash' ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
            <Banknote className="w-3.5 h-3.5" />
            Pay at front desk
          </span>
        ) : (
          <Button
            size="sm"
            className="rounded-xl bg-indigo hover:bg-indigo-dark text-white text-xs h-8 px-4 shadow-md shadow-indigo/30"
          >
            <CreditCard className="w-3 h-3 mr-1" />
            Pay Now
          </Button>
        )}
      </div>
    </motion.div>
  )
}

function HistoryCard({ item }: { item: HistoryItem }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 rounded-2xl border border-border bg-white overflow-hidden"
    >
      <img
        src={item.image}
        alt={item.room}
        className="w-20 h-20 object-cover shrink-0"
      />
      <div className="py-3 pr-3 flex flex-col justify-between min-w-0 flex-1">
        <div>
          <p className="text-sm font-semibold text-slate-dark truncate">{item.room}</p>
          <p className="text-xs text-slate-muted mt-0.5">{item.checkIn} · {item.nights} nights</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${i < item.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
              />
            ))}
          </div>
          <p className="text-sm font-bold text-slate-dark">${item.total.toLocaleString()}</p>
        </div>
      </div>
    </motion.div>
  )
}

/* ── Main Component ──────────────────────────────────────────── */

interface ProfileSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileSheet({ open, onOpenChange }: ProfileSheetProps) {
  const { user, logout } = useAuth()
  const { bookings, loading, error } = useBookings()
  const [cancelTarget, setCancelTarget] = useState<StoredBooking | null>(null)
  const [notice, setNotice] = useState('')

  if (!user) return null

  // Cancelled bookings stay visible in the list but are not counted as stays.
  const activeBookings = bookings.filter((b) => b.status !== 'cancelled')

  // Completed stays become the history tab.
  const history: HistoryItem[] = bookings
    .filter((b) => b.status === 'completed')
    .map((b) => ({
      id: b.id,
      room: b.room,
      image: b.image,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      nights: b.nights,
      total: b.total,
      rating: b.rating ?? 0,
    }))

  // Derive payments from real bookings
  const payments: Payment[] = activeBookings.map((b) => ({
    id: `PAY-${b.id}`,
    description: `${b.room} · ${b.checkIn}–${b.checkOut}`,
    amount: b.total,
    due: b.checkIn,
    status: b.paymentStatus,
    method: b.paymentMethod,
    cardLast4: b.cardLast4,
  }))

  const historyTotal = history.reduce((s, h) => s + h.total, 0)
  const bookingsTotal = activeBookings.reduce((s, b) => s + b.total, 0)
  const totalSpent = historyTotal + bookingsTotal
  const pendingTotal = payments.filter((p) => p.status !== 'paid').reduce((s, p) => s + p.amount, 0)
  const points = Math.floor(totalSpent * 0.5).toLocaleString()
  const avatarUrl =
    user.avatarUrl ?? `https://i.pravatar.cc/80?u=${encodeURIComponent(user.email)}`

  async function handleLogout() {
    onOpenChange(false)
    try {
      await logout()
    } catch {
      // Session already cleared; close the sheet regardless.
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[400px] p-0 flex flex-col overflow-hidden bg-slate-bg border-l border-border"
      >
        {/* ── Header ──────────────────────────────────────── */}
        <div
          className="px-6 pt-8 pb-6 shrink-0"
          style={{ background: 'linear-gradient(135deg, #1E2952 0%, #0F172A 100%)' }}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>My Account</SheetTitle>
          </SheetHeader>

          {/* Logo mark */}
          <div className="flex items-center gap-1.5 mb-5">
            <div className="w-6 h-6 rounded-md bg-indigo flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="heading-font text-sm font-bold text-white/60 tracking-tight">
              Tap<span className="text-indigo-light">Serve</span>
            </span>
          </div>

          {/* Avatar + user info */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={avatarUrl}
                alt={user.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-xl"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-white/20" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="heading-font text-xl font-bold text-white leading-none">{user.name}</p>
              <p className="text-white/50 text-sm">{user.email}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="inline-flex items-center gap-1 bg-indigo/40 border border-indigo-light/30 text-indigo-light text-[10px] font-bold uppercase tracking-widest rounded-full px-2.5 py-0.5">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  Gold Member
                </span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { label: 'Total Stays', value: activeBookings.length },
              { label: 'Total Spent', value: `$${totalSpent.toLocaleString()}` },
              { label: 'Points', value: points },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/[0.07] rounded-xl px-3 py-2.5 text-center border border-white/10">
                <p className="heading-font text-base font-bold text-white leading-none">{stat.value}</p>
                <p className="text-white/40 text-[10px] mt-1 uppercase tracking-wide">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs content ─────────────────────────────────── */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <Tabs defaultValue="bookings" className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Tab list */}
            <div className="px-4 pt-4 pb-0 shrink-0">
              <TabsList
                variant="line"
                className="w-full h-9 justify-start border-b border-border rounded-none pb-0 gap-0"
              >
                <TabsTrigger
                  value="bookings"
                  className="flex items-center gap-1.5 px-3 text-xs font-semibold rounded-none data-active:text-indigo"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  Bookings
                  {bookings.length > 0 && (
                    <span className="ml-1 bg-indigo text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {bookings.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="payments"
                  className="flex items-center gap-1.5 px-3 text-xs font-semibold rounded-none data-active:text-indigo"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Payments
                  {payments.filter((p) => p.status !== 'paid').length > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {payments.filter((p) => p.status !== 'paid').length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="flex items-center gap-1.5 px-3 text-xs font-semibold rounded-none data-active:text-indigo"
                >
                  <History className="w-3.5 h-3.5" />
                  History
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Bookings tab */}
            <TabsContent value="bookings" className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
              {notice && (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-700 flex-1">{notice}</p>
                  <button
                    type="button"
                    onClick={() => setNotice('')}
                    aria-label="Dismiss"
                    className="text-emerald-600 hover:text-emerald-800 text-xs font-bold leading-none"
                  >
                    ✕
                  </button>
                </div>
              )}
              {error && (
                <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-600">
                  {error}
                </div>
              )}
              {loading ? (
                <div className="rounded-2xl border border-border bg-white p-6 text-center">
                  <div className="w-6 h-6 border-2 border-indigo/20 border-t-indigo rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-muted">Loading your bookings…</p>
                </div>
              ) : bookings.length > 0 ? (
                bookings.map((b, i) => (
                  <motion.div key={b.id} transition={{ delay: i * 0.06 }}>
                    <BookingCard booking={b} onCancel={setCancelTarget} />
                  </motion.div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-indigo/30 bg-indigo-pale/50 p-6 text-center">
                  <CalendarDays className="w-7 h-7 text-indigo/40 mx-auto mb-2" />
                  <p className="text-sm font-medium text-indigo/70">No bookings yet</p>
                  <p className="text-xs text-slate-muted mt-1">Your confirmed bookings will appear here.</p>
                </div>
              )}
              <div className="rounded-2xl border border-dashed border-indigo/30 bg-indigo-pale/50 p-4 text-center mt-1">
                <CalendarDays className="w-6 h-6 text-indigo/50 mx-auto mb-2" />
                <p className="text-xs font-medium text-indigo/70">Book your next stay</p>
                <a
                  href="#book"
                  onClick={() => onOpenChange(false)}
                  className="inline-flex items-center mt-2 text-xs font-bold text-indigo hover:text-indigo-dark transition-colors"
                >
                  Reserve a Room →
                </a>
              </div>
            </TabsContent>

            {/* Payments tab */}
            <TabsContent value="payments" className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
              {pendingTotal > 0 && (
                <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-red-700">
                      ${pendingTotal.toLocaleString()} pending
                    </p>
                    <p className="text-xs text-red-500">
                      {payments.filter((p) => p.status !== 'paid').length} payment
                      {payments.filter((p) => p.status !== 'paid').length !== 1 ? 's' : ''} due
                    </p>
                  </div>
                  <TrendingUp className="w-4 h-4 text-red-400 ml-auto" />
                </div>
              )}
              {payments.length > 0 ? (
                payments.map((p, i) => (
                  <motion.div key={p.id} transition={{ delay: i * 0.06 }}>
                    <PaymentCard payment={p} />
                  </motion.div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-white p-6 text-center">
                  <CreditCard className="w-7 h-7 text-slate-muted/40 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-muted">No payment records</p>
                  <p className="text-xs text-slate-muted/70 mt-1">Payments will appear here after booking.</p>
                </div>
              )}
            </TabsContent>

            {/* History tab */}
            <TabsContent value="history" className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-slate-muted uppercase tracking-wide">
                  {history.length} past stay{history.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs font-bold text-slate-dark">
                  ${historyTotal.toLocaleString()} total
                </p>
              </div>
              {history.length > 0 ? (
                history.map((h, i) => (
                  <motion.div key={h.id} transition={{ delay: i * 0.06 }}>
                    <HistoryCard item={h} />
                  </motion.div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-white p-6 text-center">
                  <History className="w-7 h-7 text-slate-muted/40 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-muted">No past stays yet</p>
                  <p className="text-xs text-slate-muted/70 mt-1">
                    Completed stays will appear here.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Footer / Logout ──────────────────────────────── */}
        <div className="px-4 pb-6 pt-3 shrink-0 border-t border-border bg-white">
          <Separator className="mb-3" />
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-2 text-sm font-semibold text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl h-10"
          >
            <LogOut className="w-4 h-4" />
            Log out of TapServe
          </Button>
        </div>
      </SheetContent>
    </Sheet>

      <CancelBookingDialog
        key={cancelTarget?.id ?? 'closed'}
        booking={cancelTarget}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setCancelTarget(null)
        }}
        onCancelled={(booking) => {
          setCancelTarget(null)
          setNotice(
            `Booking ${booking.id} was cancelled and the room has been released.`
          )
        }}
      />
    </>
  )
}
