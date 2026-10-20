import { useEffect, useState } from 'react'
import { AlertCircle, CalendarDays, Loader2, Trash2 } from 'lucide-react'
import type { AdminBooking } from '@/admin/types'
import { formatDate, formatMoney } from '@/admin/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type DeleteBookingDialogProps = {
  booking: AdminBooking | null
  onOpenChange: (open: boolean) => void
  onConfirm: (booking: AdminBooking) => Promise<void>
}

export function DeleteBookingDialog({
  booking,
  onOpenChange,
  onConfirm,
}: DeleteBookingDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(false)
    setError('')
  }, [booking?.id])

  function handleOpenChange(nextOpen: boolean) {
    if (loading) return
    onOpenChange(nextOpen)
  }

  async function handleConfirm() {
    if (!booking || loading) return

    setError('')
    setLoading(true)
    try {
      await onConfirm(booking)
      setLoading(false)
      onOpenChange(false)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not delete this booking. Please try again.'
      )
      setLoading(false)
    }
  }

  return (
    <Dialog open={!!booking} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={!loading} className="sm:max-w-md rounded-2xl">
        <DialogHeader className="items-center text-center pt-2">
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mb-1">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <DialogTitle className="heading-font text-xl font-bold text-slate-dark">
            Delete this booking?
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-muted">
            This permanently removes the reservation and its payment record from revenue reports.
            This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {booking && (
          <div className="rounded-2xl border border-border bg-slate-bg/60 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-mono font-semibold tracking-wider text-slate-dark">
                {booking.booking_code}
              </p>
              <p className="text-sm font-bold text-slate-dark">{formatMoney(booking.total)}</p>
            </div>
            <p className="mt-1.5 text-sm font-semibold text-slate-dark truncate">
              {booking.room_name}
            </p>
            <p className="text-xs text-slate-muted truncate">
              {booking.guest_name ?? booking.guest_email ?? booking.user_id.slice(0, 8)}
            </p>
            <p className="text-xs text-slate-muted flex items-center gap-1 mt-1">
              <CalendarDays className="w-3 h-3 text-indigo shrink-0" />
              {formatDate(booking.check_in)} → {formatDate(booking.check_out)}
              <span className="mx-0.5">·</span>
              {booking.nights} night{booking.nights === 1 ? '' : 's'} · {booking.guests} guest
              {booking.guests === 1 ? '' : 's'}
            </p>
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
            Keep booking
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
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete booking
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
