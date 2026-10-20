import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CalendarDays, Users, Moon, Plus, Minus } from 'lucide-react'
import { type DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ConfirmBookingDialog } from '@/components/booking/ConfirmBookingDialog'
import { useAuth } from '@/context/AuthContext'

/* ── Helpers ─────────────────────────────────────────────────── */

function formatDate(date: Date | undefined): string {
  if (!date) return 'Select date'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function calcNights(from: Date | undefined, to: Date | undefined): number {
  if (!from || !to) return 0
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

const todayDate = new Date()
todayDate.setHours(0, 0, 0, 0)

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const update = () => setMatches(mediaQuery.matches)
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [query])

  return matches
}

/* ── Component ───────────────────────────────────────────────── */

export function CTASection() {
  const { user } = useAuth()
  const [openPicker, setOpenPicker] = useState<'checkin' | 'checkout' | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [guests, setGuests] = useState(2)
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const isMobile = useMediaQuery('(max-width: 639px)')

  const nights = useMemo(() => calcNights(dateRange?.from, dateRange?.to), [dateRange])
  const isReady = !!dateRange?.from && !!dateRange?.to

  function handleConfirmBooking() {
    if (!isReady) return

    if (!user) {
      window.dispatchEvent(new Event('tapserve:open-login'))
      return
    }

    setBookingDialogOpen(true)
  }

  function handleRangeSelect(range: DateRange | undefined) {
    setDateRange(range)
    // Auto-close once a full range is selected
    if (range?.from && range?.to) {
      setTimeout(() => setOpenPicker(null), 300)
    }
  }

  return (
    <section
      className="relative py-24 overflow-hidden"
      id="book"
      style={{ background: 'linear-gradient(135deg, #1E2952 0%, #0F172A 50%, #1E2952 100%)' }}
    >
      {/* Decorative glows */}
      <div
        className="absolute top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.25) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.15) 0%, transparent 70%)' }}
      />
      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px',
        }}
      />

      <div className="relative max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-8 text-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-xs text-indigo-light font-semibold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Rooms Available Now
          </div>

          {/* Heading */}
          <h2 className="heading-font text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1]">
            Ready to Experience
            <br />
            <span className="text-indigo-light">Excellence?</span>
          </h2>

          {/* Subtitle */}
          <p className="text-white/60 text-base sm:text-lg font-light max-w-xl leading-relaxed -mt-2">
            The future of hospitality is here. Book your stay at TapServe and discover why 50,000+
            guests call it home.
          </p>

          {/* ── Booking Appointment Widget ─────────────────────── */}
          <div className="w-full bg-white/[0.07] backdrop-blur-2xl border border-white/15 rounded-3xl p-5 sm:p-6 md:p-8 text-left shadow-2xl shadow-black/40">
            {/* Widget header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-indigo flex items-center justify-center shadow-lg shadow-indigo/40 shrink-0">
                <CalendarDays className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="heading-font text-white font-bold text-lg leading-none">
                  Book Your Stay
                </h3>
                <p className="text-white/40 text-xs mt-1">
                  Select dates and preferences below
                </p>
              </div>
            </div>

            {/* ── Fields Grid ─────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

              {/* 1. Check-In */}
              <Popover
                open={openPicker === 'checkin'}
                onOpenChange={(open) => setOpenPicker(open ? 'checkin' : null)}
              >
                <PopoverTrigger
                  className={cn(
                    'flex flex-col items-start gap-2 w-full rounded-2xl border px-4 py-3.5 text-left transition-all duration-200 cursor-pointer bg-transparent appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-light/70 focus-visible:ring-offset-2 focus-visible:ring-offset-space-indigo-deep',
                    openPicker === 'checkin'
                      ? 'border-indigo-light/60 bg-indigo/20 shadow-lg shadow-indigo/20'
                      : 'border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30'
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="w-3 h-3 text-indigo-light" />
                    <span className="text-[10px] font-bold text-indigo-light uppercase tracking-widest">
                      Check-in
                    </span>
                  </div>
                  <span
                    className={cn(
                      'text-sm font-semibold leading-none',
                      dateRange?.from ? 'text-white' : 'text-white/30'
                    )}
                  >
                    {formatDate(dateRange?.from)}
                  </span>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto max-w-[calc(100vw-2rem)] overflow-x-auto p-0"
                  side="bottom"
                  align="start"
                  sideOffset={8}
                >
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={handleRangeSelect}
                    numberOfMonths={isMobile ? 1 : 2}
                    disabled={{ before: todayDate }}
                    defaultMonth={todayDate}
                  />
                </PopoverContent>
              </Popover>

              {/* 2. Check-Out */}
              <Popover
                open={openPicker === 'checkout'}
                onOpenChange={(open) => setOpenPicker(open ? 'checkout' : null)}
              >
                <PopoverTrigger
                  className={cn(
                    'flex flex-col items-start gap-2 w-full rounded-2xl border px-4 py-3.5 text-left transition-all duration-200 cursor-pointer bg-transparent appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-light/70 focus-visible:ring-offset-2 focus-visible:ring-offset-space-indigo-deep',
                    openPicker === 'checkout'
                      ? 'border-indigo-light/60 bg-indigo/20 shadow-lg shadow-indigo/20'
                      : 'border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30'
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="w-3 h-3 text-indigo-light" />
                    <span className="text-[10px] font-bold text-indigo-light uppercase tracking-widest">
                      Check-out
                    </span>
                  </div>
                  <span
                    className={cn(
                      'text-sm font-semibold leading-none',
                      dateRange?.to ? 'text-white' : 'text-white/30'
                    )}
                  >
                    {formatDate(dateRange?.to)}
                  </span>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto max-w-[calc(100vw-2rem)] overflow-x-auto p-0"
                  side="bottom"
                  align="start"
                  sideOffset={8}
                >
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={handleRangeSelect}
                    numberOfMonths={isMobile ? 1 : 2}
                    disabled={{ before: todayDate }}
                    defaultMonth={dateRange?.from ?? todayDate}
                  />
                </PopoverContent>
              </Popover>

              {/* 3. Number of Guests */}
              <div className="flex flex-col items-start gap-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3 h-3 text-indigo-light" />
                  <span className="text-[10px] font-bold text-indigo-light uppercase tracking-widest">
                    Guests
                  </span>
                </div>
                <div className="flex items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-indigo/40 text-white flex items-center justify-center transition-colors shrink-0 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-light/70"
                    disabled={guests <= 1}
                    aria-label="Decrease guests"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-white font-semibold text-sm flex-1 text-center leading-none">
                    {guests} {guests === 1 ? 'Guest' : 'Guests'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setGuests(Math.min(10, guests + 1))}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-indigo/40 text-white flex items-center justify-center transition-colors shrink-0 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-light/70"
                    disabled={guests >= 10}
                    aria-label="Increase guests"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 4. Duration (auto-calculated) */}
              <div className="flex flex-col items-start gap-2 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
                <div className="flex items-center gap-1.5">
                  <Moon className="w-3 h-3 text-indigo-light" />
                  <span className="text-[10px] font-bold text-indigo-light uppercase tracking-widest">
                    Duration
                  </span>
                </div>
                <span
                  className={cn(
                    'text-sm font-semibold leading-none',
                    nights > 0 ? 'text-white' : 'text-white/30'
                  )}
                >
                  {nights > 0 ? `${nights} Night${nights !== 1 ? 's' : ''}` : '— Nights'}
                </span>
              </div>
            </div>

            {/* ── Summary + Confirm ───────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-5 mt-5 border-t border-white/10">
              {/* Booking summary */}
              <p className="text-white/50 text-sm font-light leading-relaxed">
                {isReady ? (
                  <>
                    <span className="text-white font-medium">
                      {nights} night{nights !== 1 ? 's' : ''}
                    </span>
                    {' · '}
                    <span className="text-white font-medium">
                      {guests} guest{guests !== 1 ? 's' : ''}
                    </span>
                    {' · '}
                    <span className="text-indigo-light font-medium">
                      {formatDate(dateRange?.from)} → {formatDate(dateRange?.to)}
                    </span>
                  </>
                ) : (
                  'Select check-in & check-out dates to continue'
                )}
              </p>

              {/* Confirm button */}
              <button
                type="button"
                disabled={!isReady}
                onClick={handleConfirmBooking}
                className={cn(
                  'inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold transition-all duration-300 shrink-0 group',
                  isReady
                    ? 'bg-indigo hover:bg-indigo-dark text-white shadow-xl shadow-indigo/40 hover:-translate-y-0.5 active:translate-y-0'
                    : 'bg-white/10 text-white/30 cursor-not-allowed pointer-events-none'
                )}
              >
                <CalendarDays className="w-4 h-4" />
                {user ? 'Confirm Booking' : 'Sign in to Book'}
                <ArrowRight
                  className={cn(
                    'w-4 h-4 transition-transform',
                    isReady && 'group-hover:translate-x-1'
                  )}
                />
              </button>
            </div>
          </div>

          {/* ── Metrics row ─────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-6 pt-8 border-t border-white/10 w-full">
            {[
              { value: '4.9 / 5', label: 'Guest Rating' },
              { value: '200+', label: 'Luxury Rooms' },
              { value: '50K+', label: 'Happy Guests' },
              { value: '15+', label: 'Years of Excellence' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="heading-font text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-white/50 text-xs mt-1 uppercase tracking-wide">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <ConfirmBookingDialog
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        dateRange={dateRange}
        guests={guests}
        nights={nights}
      />
    </section>
  )
}
