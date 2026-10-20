import { useState } from 'react'
import { AlertCircle, CalendarDays, Loader2, XCircle } from 'lucide-react'
import { useBookings, type StoredBooking } from '@/context/BookingsContext'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CancelBookingDialogProps {
  booking: StoredBooking | null
  onOpenChange: (open: boolean) => void
  onCancelled: (booking: StoredBooking) => void
}

export function CancelBookingDialog({
  booking,
  onOpenChange,
  onCancelled,
}: CancelBookingDialogProps) {
  const { cancelBooking } = useBookings()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleOpenChange(nextOpen: boolean) {
    if (loading) return
    onOpenChange(nextOpen)
  }

  async function handleConfirm() {
    if (!booking || loading) return

    setError('')
    setLoading(true)
    try {
      await cancelBooking(booking.id)
      onCancelled(booking)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel your booking. Please try again.')
      setLoading(false)
    }
  }

  return (
    <Dialog open={!!booking} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={!loading} className="sm:max-w-md rounded-2xl">
        <DialogHeader className="items-center text-center pt-2">
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mb-1">
            <XCircle className="w-6 h-6 text-red-500" />
          </div>
          <DialogTitle className="heading-font text-xl font-bold text-slate-dark">
            Cancel this booking?
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-muted">
            Your reservation will be cancelled and the room released. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {booking && (
          <div className="rounded-2xl border border-border bg-slate-bg/60 p-3 flex gap-3">
            <img
              src={booking.image}
              alt={booking.room}
              className="w-16 h-16 rounded-xl object-cover shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-dark truncate">{booking.room}</p>
              <p className="text-xs text-slate-muted flex items-center gap-1 mt-1">
                <CalendarDays className="w-3 h-3 text-indigo shrink-0" />
                {booking.checkIn} → {booking.checkOut}
              </p>
              <p className="text-xs text-slate-muted mt-0.5">
                {booking.nights} night{booking.nights === 1 ? '' : 's'} · {booking.guests} guest
                {booking.guests === 1 ? '' : 's'} ·{' '}
                <span className="font-semibold text-slate-dark">
                  ${booking.total.toLocaleString()}
                </span>
              </p>
              <p className="text-[10px] font-mono text-slate-muted mt-1 tracking-wider">
                {booking.id}
              </p>
            </div>
          </div>
        )}

        {error && (
          <p
            className="text-xs text-destructive font-medium flex items-start gap-1.5"
            role="alert"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            {error}
          </p>
        )}

        <DialogFooter className="-mx-4 -mb-4 mt-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
            className="rounded-xl h-10"
          >
            Keep my booking
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="rounded-xl h-10 bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md shadow-red-500/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Cancelling…
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                Cancel booking
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
