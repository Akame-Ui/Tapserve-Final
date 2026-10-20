import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/context/AuthContext'
import { requireSupabase } from '@/lib/supabase'

export type BookingStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled'
export type PaymentStatus = 'pending' | 'overdue' | 'paid'
export type PaymentMethod = 'card' | 'gcash' | 'cash'

/** Booking shape used by the UI. */
export interface StoredBooking {
  id: string
  room: string
  roomId: string
  image: string
  checkIn: string
  checkOut: string
  nights: number
  guests: number
  status: BookingStatus
  total: number
  pricePerNight: number
  cardLast4: string
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  rating?: number | null
  createdAt: string
}

/** Payload accepted by `addBooking`; dates are ISO `YYYY-MM-DD`. */
export type NewBookingInput = {
  room: string
  roomId: string
  image: string
  checkIn: string
  checkOut: string
  nights: number
  guests: number
  status: BookingStatus
  total: number
  pricePerNight: number
  cardLast4: string
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
}

type BookingRow = {
  id: string
  booking_code: string
  room_id: string
  room_name: string
  room_image: string | null
  check_in: string
  check_out: string
  nights: number
  guests: number
  status: BookingStatus
  total: number | string
  price_per_night: number | string
  card_last4: string | null
  payment_method: PaymentMethod | null
  payment_status: PaymentStatus
  rating: number | null
  created_at: string
}

type BookingsContextValue = {
  bookings: StoredBooking[]
  loading: boolean
  error: string | null
  addBooking: (data: NewBookingInput) => Promise<StoredBooking>
  cancelBooking: (id: string) => Promise<void>
  removeBooking: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

const BookingsContext = createContext<BookingsContextValue | null>(null)

function formatDisplayDate(value: string): string {
  if (!value) return ''
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function mapBooking(row: BookingRow): StoredBooking {
  return {
    id: row.booking_code,
    room: row.room_name,
    roomId: row.room_id,
    image: row.room_image ?? '',
    checkIn: formatDisplayDate(row.check_in),
    checkOut: formatDisplayDate(row.check_out),
    nights: row.nights,
    guests: row.guests,
    status: row.status,
    total: Number(row.total),
    pricePerNight: Number(row.price_per_night),
    cardLast4: row.card_last4 ?? '',
    paymentMethod:
      row.payment_method ?? (row.payment_status === 'pending' ? 'cash' : 'card'),
    paymentStatus: row.payment_status,
    rating: row.rating,
    createdAt: row.created_at,
  }
}

function bookingsQuery(userId: string) {
  return requireSupabase()
    .from('bookings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
}

export function BookingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id

  const [bookings, setBookings] = useState<StoredBooking[]>([])
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!userId) return

    const { data, error: fetchError } = await bookingsQuery(userId)

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setBookings(((data ?? []) as BookingRow[]).map(mapBooking))
      setError(null)
    }

    setLoadedUserId(userId)
  }, [userId])

  useEffect(() => {
    if (!userId) return

    let cancelled = false

    bookingsQuery(userId).then(({ data, error: fetchError }) => {
      if (cancelled) return

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setBookings(((data ?? []) as BookingRow[]).map(mapBooking))
        setError(null)
      }

      setLoadedUserId(userId)
    })

    return () => {
      cancelled = true
    }
  }, [userId])

  const addBooking = useCallback(
    async (data: NewBookingInput): Promise<StoredBooking> => {
      const client = requireSupabase()
      if (!userId) throw new Error('Please sign in to complete your booking.')

      const baseBooking = {
        user_id: userId,
        room_id: data.roomId,
        room_name: data.room,
        room_image: data.image,
        check_in: data.checkIn,
        check_out: data.checkOut,
        nights: data.nights,
        guests: data.guests,
        status: data.status,
        total: data.total,
        price_per_night: data.pricePerNight,
        card_last4: data.cardLast4,
        payment_method: data.paymentMethod,
        payment_status: data.paymentStatus,
      }

      // Older databases may not have the guest_* or payment_method columns yet.
      // Drop whichever column the API complains about and retry, so booking
      // keeps working before every migration file has been applied.
      const insertRow: Record<string, unknown> = {
        ...baseBooking,
        guest_name: user?.name ?? null,
        guest_email: user?.email ?? null,
      }

      let savedRow: unknown = null
      let savedError: { message: string } | null = null

      for (let attempt = 0; attempt < 3; attempt += 1) {
        const result = await client.from('bookings').insert(insertRow).select().single()
        savedRow = result.data
        savedError = result.error

        if (!savedError) break

        if (/payment_method/i.test(savedError.message) && 'payment_method' in insertRow) {
          delete insertRow.payment_method
          continue
        }

        if (/guest_(name|email)/i.test(savedError.message) && 'guest_name' in insertRow) {
          delete insertRow.guest_name
          delete insertRow.guest_email
          continue
        }

        break
      }

      if (savedError) {
        if (/bookings_payment_method_check/i.test(savedError.message)) {
          throw new Error(
            'GCash is not enabled in the database yet. Run supabase/0007_gcash.sql in the Supabase SQL editor.'
          )
        }
        throw new Error(savedError.message)
      }

      const booking = mapBooking(savedRow as BookingRow)
      await refresh()
      return booking
    },
    [user, userId, refresh]
  )

  const cancelBooking = useCallback(
    async (id: string) => {
      const client = requireSupabase()
      if (!userId) throw new Error('Please sign in to manage your bookings.')

      const { error: cancelError } = await client
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('booking_code', id)
        .eq('user_id', userId)
        .in('status', ['confirmed', 'pending'])

      if (cancelError) throw new Error(cancelError.message)

      await refresh()
    },
    [userId, refresh]
  )

  const removeBooking = useCallback(
    async (id: string) => {
      const client = requireSupabase()
      if (!userId) throw new Error('Please sign in to manage your bookings.')

      const { error: deleteError } = await client
        .from('bookings')
        .delete()
        .eq('booking_code', id)
        .eq('user_id', userId)

      if (deleteError) throw new Error(deleteError.message)

      await refresh()
    },
    [userId, refresh]
  )

  // Avoid showing a previous session's bookings while the new fetch runs.
  const visibleBookings = userId && loadedUserId === userId ? bookings : []
  const loading = Boolean(userId) && loadedUserId !== userId

  return (
    <BookingsContext.Provider
      value={{ bookings: visibleBookings, loading, error, addBooking, cancelBooking, removeBooking, refresh }}
    >
      {children}
    </BookingsContext.Provider>
  )
}

export function useBookings() {
  const ctx = useContext(BookingsContext)
  if (!ctx) throw new Error('useBookings must be used within BookingsProvider')
  return ctx
}
