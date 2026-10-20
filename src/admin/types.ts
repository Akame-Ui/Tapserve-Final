export type AdminUser = {
  id: string
  email: string
  full_name: string | null
  role: 'guest' | 'admin'
  tier: string | null
  points: number | null
  created_at: string
  last_sign_in_at: string | null
}

export type AdminEvent = {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string | null
  location: string | null
  event_date: string
  capacity: number
  price: number
  status: EventStatus
  image_url: string | null
  created_by: string | null
  created_at: string | null
  updated_at: string | null
}

export type EventStatus = 'draft' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'published'

export type AuditLog = {
  entity_type: string
  action: string
  actor_email: string
  created_at: string
  id: string | number
  details: string | null
  actor_id: string
  entity_id: string
}

export type BookingStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled'
export type PaymentStatus = 'pending' | 'overdue' | 'paid'

export type AdminBooking = {
  id: string
  booking_code: string
  user_id: string
  guest_name: string | null
  guest_email: string | null
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
  payment_method: 'card' | 'cash' | null
  payment_status: PaymentStatus
  created_at: string
}