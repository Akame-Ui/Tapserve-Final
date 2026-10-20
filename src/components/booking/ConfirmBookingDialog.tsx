import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Lock,
  Moon,
  Smartphone,
  Users,
  Wallet,
  Zap,
} from 'lucide-react'
import { type DateRange } from 'react-day-picker'
import { useBookings, type PaymentMethod } from '@/context/BookingsContext'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

/* ── Room options ────────────────────────────────────────── */

const ROOM_OPTIONS = [
  {
    id: 'garden-terrace',
    label: 'Garden Terrace Room',
    pricePerNight: 199,
    image:
      'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=400',
    badge: null,
  },
  {
    id: 'deluxe-city-view',
    label: 'Deluxe City View',
    pricePerNight: 249,
    image:
      'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=400',
    badge: null,
  },
  {
    id: 'ocean-view-suite',
    label: 'Ocean View Suite',
    pricePerNight: 299,
    image:
      'https://images.pexels.com/photos/27543255/pexels-photo-27543255.jpeg?auto=compress&cs=tinysrgb&w=400',
    badge: 'Best Value',
  },
  {
    id: 'executive-penthouse',
    label: 'Executive Penthouse',
    pricePerNight: 599,
    image:
      'https://images.pexels.com/photos/1457847/pexels-photo-1457847.jpeg?auto=compress&cs=tinysrgb&w=400',
    badge: 'Luxury',
  },
]

/* ── Helpers ─────────────────────────────────────────────── */

function formatDate(date: Date | undefined): string {
  if (!date) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function toIsoDate(date: Date | undefined): string {
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return digits
}

function getCardLast4(cardNumber: string): string {
  const digits = cardNumber.replace(/\s/g, '')
  return digits.slice(-4) || '0000'
}

function getGcashLast4(gcashNumber: string): string {
  const digits = gcashNumber.replace(/\D/g, '')
  return digits.slice(-4) || '0000'
}

/* ── Component ───────────────────────────────────────────── */

interface ConfirmBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dateRange: DateRange | undefined
  guests: number
  nights: number
}

export function ConfirmBookingDialog({
  open,
  onOpenChange,
  dateRange,
  guests,
  nights,
}: ConfirmBookingDialogProps) {
  const { addBooking } = useBookings()

  const [selectedRoom, setSelectedRoom] = useState(ROOM_OPTIONS[2].id)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [gcashName, setGcashName] = useState('')
  const [gcashNumber, setGcashNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')

  const room = ROOM_OPTIONS.find((r) => r.id === selectedRoom) ?? ROOM_OPTIONS[2]
  const safeNights = Math.max(nights, 1)
  const subtotal = room.pricePerNight * safeNights
  const taxes = Math.round(subtotal * 0.12)
  const grandTotal = subtotal + taxes

  function validate() {
    const e: Record<string, string> = {}

    if (paymentMethod === 'card') {
      if (!cardName.trim()) e.cardName = 'Cardholder name is required'
      const digits = cardNumber.replace(/\s/g, '')
      if (digits.length < 16) e.cardNumber = 'Enter a valid 16-digit card number'
      const parts = expiry.split('/')
      if (parts.length !== 2 || parts[0].length !== 2 || parts[1].length !== 2) {
        e.expiry = 'Enter a valid expiry (MM/YY)'
      }
      if (cvv.length < 3) e.cvv = 'Enter a valid CVV'
    }

    if (paymentMethod === 'gcash') {
      if (!gcashName.trim()) e.gcashName = 'GCash account name is required'
      const digits = gcashNumber.replace(/\D/g, '')
      if (digits.length !== 11 || !digits.startsWith('09')) {
        e.gcashNumber = 'Enter a valid 11-digit GCash number (09XX XXX XXXX)'
      }
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  function resetForm() {
    setPaymentMethod('card')
    setCardName('')
    setCardNumber('')
    setExpiry('')
    setCvv('')
    setGcashName('')
    setGcashNumber('')
    setErrors({})
    setSubmitError('')
    setSelectedRoom(ROOM_OPTIONS[2].id)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitError('')
    setLoading(true)
    try {
      await addBooking({
        room: room.label,
        roomId: room.id,
        image: room.image,
        checkIn: toIsoDate(dateRange?.from),
        checkOut: toIsoDate(dateRange?.to),
        nights: safeNights,
        guests,
        status: paymentMethod === 'cash' ? 'pending' : 'confirmed',
        total: grandTotal,
        pricePerNight: room.pricePerNight,
        cardLast4:
          paymentMethod === 'card'
            ? getCardLast4(cardNumber)
            : paymentMethod === 'gcash'
              ? getGcashLast4(gcashNumber)
              : '',
        paymentMethod,
        paymentStatus: paymentMethod === 'cash' ? 'pending' : 'paid',
      })
      setSuccess(true)
      setTimeout(() => {
        onOpenChange(false)
        setTimeout(() => {
          setSuccess(false)
          resetForm()
        }, 300)
      }, 2500)
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Could not save your booking. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !loading) {
      onOpenChange(false)
      setTimeout(() => {
        setSuccess(false)
        resetForm()
      }, 300)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-xl p-0 overflow-hidden border-border flex flex-col"
        style={{ maxHeight: '90vh' }}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div
          className="px-7 pt-7 pb-5 shrink-0"
          style={{ background: 'linear-gradient(135deg, #1E2952 0%, #0F172A 100%)' }}
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-indigo flex items-center justify-center shadow-lg shadow-indigo/40">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="heading-font text-lg font-bold text-white tracking-tight">
              Tap<span className="text-indigo-light">Serve</span>
            </span>
          </div>
          <DialogHeader>
            <DialogTitle className="heading-font text-2xl font-bold text-white text-left leading-tight">
              Complete Your Booking
            </DialogTitle>
            <DialogDescription className="text-white/50 text-sm text-left mt-1">
              Select your room type and payment method to confirm.
            </DialogDescription>
          </DialogHeader>

          {/* Booking summary chips */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs text-white/80 font-medium">
              <CalendarDays className="w-3 h-3 text-indigo-light" />
              {formatDate(dateRange?.from)} → {formatDate(dateRange?.to)}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs text-white/80 font-medium">
              <Moon className="w-3 h-3 text-indigo-light" />
              {safeNights} night{safeNights !== 1 ? 's' : ''}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs text-white/80 font-medium">
              <Users className="w-3 h-3 text-indigo-light" />
              {guests} guest{guests !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* ── Success overlay ─────────────────────────────── */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-5"
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="heading-font text-2xl font-bold text-slate-dark"
              >
                {paymentMethod === 'cash' ? 'Reservation Pending' : 'Booking Confirmed!'}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="text-slate-muted text-sm mt-2 text-center max-w-xs px-4"
              >
                Your reservation for{' '}
                <span className="font-semibold text-slate-dark">{room.label}</span> has been saved
                to your account summary.
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="text-xs mt-3 text-center max-w-xs px-6 font-medium text-slate-muted"
              >
                {paymentMethod === 'cash' ? (
                  <>
                    Please pay{' '}
                    <span className="font-bold text-indigo">
                      ${grandTotal.toLocaleString()}
                    </span>{' '}
                    in cash at the front desk on arrival.
                  </>
                ) : paymentMethod === 'gcash' ? (
                  <>Payment received — GCash ···· {getGcashLast4(gcashNumber)}.</>
                ) : (
                  <>Payment received — your card ending in {getCardLast4(cardNumber)} was charged.</>
                )}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Scrollable body ─────────────────────────────── */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <form onSubmit={handleSubmit} id="booking-payment-form">
            <div className="px-7 py-5 flex flex-col gap-6">
              {/* ── Room Selection ─────────────────────────── */}
              <div>
                <p className="text-xs font-bold text-slate-dark uppercase tracking-widest mb-3">
                  Select Room Type
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {ROOM_OPTIONS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRoom(r.id)}
                      className={cn(
                        'relative rounded-2xl border overflow-hidden text-left transition-all duration-200 focus:outline-none',
                        selectedRoom === r.id
                          ? 'border-indigo shadow-lg shadow-indigo/20 ring-2 ring-indigo/25'
                          : 'border-border hover:border-indigo/40 hover:shadow-md'
                      )}
                    >
                      <div className="relative h-[72px] overflow-hidden">
                        <img
                          src={r.image}
                          alt={r.label}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        {r.badge && (
                          <span className="absolute top-1.5 right-1.5 bg-indigo text-white text-[9px] font-bold rounded-full px-1.5 py-0.5">
                            {r.badge}
                          </span>
                        )}
                        {selectedRoom === r.id && (
                          <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-indigo flex items-center justify-center shadow">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="px-3 py-2.5">
                        <p className="text-xs font-semibold text-slate-dark leading-tight">
                          {r.label}
                        </p>
                        <p className="text-xs text-slate-muted mt-0.5">
                          <span className="font-bold text-indigo">${r.pricePerNight}</span>
                          <span> / night</span>
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* ── Payment Method & Details ───────────────── */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Wallet className="w-4 h-4 text-indigo shrink-0" />
                  <p className="text-xs font-bold text-slate-dark uppercase tracking-widest">
                    Payment Method
                  </p>
                  {paymentMethod !== 'cash' && (
                    <div className="flex items-center gap-1 ml-auto">
                      <Lock className="w-3 h-3 text-slate-muted" />
                      <span className="text-[11px] text-slate-muted">Secure checkout</span>
                    </div>
                  )}
                </div>

                {/* Card, GCash or cash */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    aria-pressed={paymentMethod === 'card'}
                    className={cn(
                      'relative flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo/40',
                      paymentMethod === 'card'
                        ? 'border-indigo bg-indigo-pale/60 shadow-md shadow-indigo/10 ring-1 ring-indigo/25'
                        : 'border-border bg-white hover:border-indigo/40'
                    )}
                  >
                    <div
                      className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                        paymentMethod === 'card'
                          ? 'bg-indigo text-white'
                          : 'bg-slate-bg text-slate-muted'
                      )}
                    >
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-dark leading-tight">
                        Card Payment
                      </p>
                      <p className="text-[11px] text-slate-muted mt-0.5 leading-snug">
                        Visa, Mastercard, or debit card
                      </p>
                    </div>
                    {paymentMethod === 'card' && (
                      <CheckCircle2 className="w-4 h-4 text-indigo absolute top-2.5 right-2.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('gcash')}
                    aria-pressed={paymentMethod === 'gcash'}
                    className={cn(
                      'relative flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007DFE]/40',
                      paymentMethod === 'gcash'
                        ? 'border-[#007DFE] bg-sky-50 shadow-md shadow-sky-500/10 ring-1 ring-[#007DFE]/25'
                        : 'border-border bg-white hover:border-[#007DFE]/40'
                    )}
                  >
                    <div
                      className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                        paymentMethod === 'gcash'
                          ? 'bg-[#007DFE] text-white'
                          : 'bg-slate-bg text-slate-muted'
                      )}
                    >
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-dark leading-tight">GCash</p>
                      <p className="text-[11px] text-slate-muted mt-0.5 leading-snug">
                        Pay now with your GCash wallet
                      </p>
                    </div>
                    {paymentMethod === 'gcash' && (
                      <CheckCircle2 className="w-4 h-4 text-[#007DFE] absolute top-2.5 right-2.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    aria-pressed={paymentMethod === 'cash'}
                    className={cn(
                      'relative flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo/40',
                      paymentMethod === 'cash'
                        ? 'border-indigo bg-indigo-pale/60 shadow-md shadow-indigo/10 ring-1 ring-indigo/25'
                        : 'border-border bg-white hover:border-indigo/40'
                    )}
                  >
                    <div
                      className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                        paymentMethod === 'cash'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-bg text-slate-muted'
                      )}
                    >
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-dark leading-tight">
                        Cash Payment
                      </p>
                      <p className="text-[11px] text-slate-muted mt-0.5 leading-snug">
                        Pay at the front desk on arrival
                      </p>
                    </div>
                    {paymentMethod === 'cash' && (
                      <CheckCircle2 className="w-4 h-4 text-indigo absolute top-2.5 right-2.5" />
                    )}
                  </button>
                </div>

                {paymentMethod === 'card' ? (
                  <div className="flex flex-col gap-4">
                    {/* Cardholder name */}
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="card-name" className="text-sm font-medium text-slate-dark">
                        Cardholder Name
                      </Label>
                      <Input
                        id="card-name"
                        type="text"
                        placeholder="John Doe"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        autoComplete="cc-name"
                        className={cn(
                          'h-11 rounded-xl border-border focus-visible:ring-indigo/40 focus-visible:border-indigo',
                          errors.cardName &&
                          'border-destructive focus-visible:ring-destructive/40'
                        )}
                      />
                      {errors.cardName && (
                        <p className="text-xs text-destructive">{errors.cardName}</p>
                      )}
                    </div>

                    {/* Card number */}
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="card-number" className="text-sm font-medium text-slate-dark">
                        Card Number
                      </Label>
                      <div className="relative">
                        <Input
                          id="card-number"
                          type="text"
                          placeholder="0000 0000 0000 0000"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          autoComplete="cc-number"
                          inputMode="numeric"
                          className={cn(
                            'h-11 rounded-xl border-border focus-visible:ring-indigo/40 focus-visible:border-indigo pr-12',
                            errors.cardNumber &&
                            'border-destructive focus-visible:ring-destructive/40'
                          )}
                        />
                        <CreditCard className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-muted pointer-events-none" />
                      </div>
                      {errors.cardNumber && (
                        <p className="text-xs text-destructive">{errors.cardNumber}</p>
                      )}
                    </div>

                    {/* Expiry + CVV */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="expiry" className="text-sm font-medium text-slate-dark">
                          Expiry Date
                        </Label>
                        <Input
                          id="expiry"
                          type="text"
                          placeholder="MM/YY"
                          value={expiry}
                          onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                          autoComplete="cc-exp"
                          inputMode="numeric"
                          maxLength={5}
                          className={cn(
                            'h-11 rounded-xl border-border focus-visible:ring-indigo/40 focus-visible:border-indigo',
                            errors.expiry &&
                            'border-destructive focus-visible:ring-destructive/40'
                          )}
                        />
                        {errors.expiry && (
                          <p className="text-xs text-destructive">{errors.expiry}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="cvv" className="text-sm font-medium text-slate-dark">
                          CVV
                        </Label>
                        <Input
                          id="cvv"
                          type="text"
                          placeholder="•••"
                          value={cvv}
                          onChange={(e) =>
                            setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))
                          }
                          autoComplete="cc-csc"
                          inputMode="numeric"
                          maxLength={4}
                          className={cn(
                            'h-11 rounded-xl border-border focus-visible:ring-indigo/40 focus-visible:border-indigo',
                            errors.cvv && 'border-destructive focus-visible:ring-destructive/40'
                          )}
                        />
                        {errors.cvv && (
                          <p className="text-xs text-destructive">{errors.cvv}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex gap-3">
                  <Banknote className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">
                      Pay with cash on arrival
                    </p>
                    <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                      Your room will be reserved now. Please settle the total of{' '}
                      <span className="font-bold">${grandTotal.toLocaleString()}</span> at the
                      front desk when you check in.
                    </p>
                  </div>
                </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* ── Footer ──────────────────────────────────────── */}
        <div className="px-7 py-5 border-t border-border bg-slate-bg shrink-0">
          {/* Price breakdown */}
          <div className="flex flex-col gap-1.5 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-muted">
                ${room.pricePerNight} × {safeNights} night{safeNights !== 1 ? 's' : ''}
              </span>
              <span className="text-slate-dark font-medium">${subtotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-muted">Taxes & fees (12%)</span>
              <span className="text-slate-dark font-medium">${taxes.toLocaleString()}</span>
            </div>
            <Separator className="my-1" />
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-dark">
                {paymentMethod === 'cash' ? 'Total to Pay on Arrival' : 'Total Due'}
              </span>
              <span className="heading-font text-xl font-bold text-indigo">
                ${grandTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {submitError && (
            <p className="text-xs text-destructive font-medium mb-3">{submitError}</p>
          )}

          <Button
            form="booking-payment-form"
            type="submit"
            disabled={loading}
            className={cn(
              'w-full h-12 rounded-xl text-white font-semibold shadow-lg transition-all duration-200 hover:-translate-y-0.5 gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0',
              paymentMethod === 'cash'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30'
                : 'bg-indigo hover:bg-indigo-dark shadow-indigo/30'
            )}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                {paymentMethod === 'cash' ? 'Confirming Booking…' : 'Processing Payment…'}
              </>
            ) : paymentMethod === 'cash' ? (
              <>
                <Banknote className="w-4 h-4" />
                Confirm Booking · Pay ${grandTotal.toLocaleString()} on Arrival
                <ChevronRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Pay ${grandTotal.toLocaleString()} & Confirm Booking
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
