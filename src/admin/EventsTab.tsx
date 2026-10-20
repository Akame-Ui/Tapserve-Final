import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Clock,
  MapPin,
  Pencil,
  Plus,
  Ticket,
  Trash2,
  Users,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import type { AdminEvent, EventStatus } from '@/admin/types'
import { formatDate, formatMoney } from '@/admin/utils'
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

type EventForm = {
  title: string
  description: string
  event_date: string
  start_time: string
  end_time: string
  location: string
  capacity: string
  price: string
  status: EventStatus
  image_url: string
}

function todayIso(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function emptyForm(): EventForm {
  return {
    title: '',
    description: '',
    event_date: todayIso(),
    start_time: '',
    end_time: '',
    location: '',
    capacity: '',
    price: '0',
    status: 'draft',
    image_url: '',
  }
}

const statusStyles: Record<EventStatus, string> = {
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  confirmed: 'bg-indigo-100 text-indigo-700 border-indigo/20',
  pending: 'bg-amber-100 text-amber-700 border-amber/20',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
  completed: 'bg-indigo-pale text-indigo border-indigo/20',
}

export function EventsTab() {
  const { user } = useAuth()
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [loading, setLoading] = useState(Boolean(supabase))
  const [error, setError] = useState<string | null>(
    supabase ? null : 'Supabase is not configured.'
  )
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<EventForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return

    let cancelled = false

    supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true })
      .then(({ data, error: fetchError }) => {
        if (cancelled) return

        if (fetchError) {
          setError(fetchError.message)
        } else {
          setEvents((data ?? []) as AdminEvent[])
          setError(null)
        }

        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const counts = useMemo(
    () => ({
      total: events.length,
      published: events.filter((event) => event.status === 'published').length,
      draft: events.filter((event) => event.status === 'draft').length,
    }),
    [events]
  )

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm())
    setFormError('')
    setDialogOpen(true)
  }

  function openEdit(event: AdminEvent) {
    setEditingId(event.id)
    setForm({
      title: event.title,
      description: event.description ?? '',
      event_date: event.event_date,
      start_time: event.start_time?.slice(0, 5) ?? '',
      end_time: event.end_time?.slice(0, 5) ?? '',
      location: event.location ?? '',
      capacity: event.capacity ? String(event.capacity) : '',
      price: String(event.price),
      status: event.status,
      image_url: event.image_url ?? '',
    })
    setFormError('')
    setDialogOpen(true)
  }

  function updateField<K extends keyof EventForm>(field: K, value: EventForm[K]) {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    if (!supabase) return

    if (!form.title.trim()) {
      setFormError('Event title is required.')
      return
    }
    if (!form.event_date) {
      setFormError('Event date is required.')
      return
    }

    setSaving(true)
    setFormError('')

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      event_date: form.event_date,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      location: form.location.trim() || null,
      capacity: form.capacity ? Number(form.capacity) : null,
      price: Number(form.price) || 0,
      status: form.status,
      image_url: form.image_url.trim() || null,
    }

    if (editingId) {
      const { data, error: updateError } = await supabase
        .from('events')
        .update(payload)
        .eq('id', editingId)
        .select()
        .single()

      if (updateError) {
        setFormError(updateError.message)
        setSaving(false)
        return
      }

      setEvents((previous) =>
        previous.map((item) => (item.id === editingId ? (data as AdminEvent) : item))
      )
    } else {
      const { data, error: insertError } = await supabase
        .from('events')
        .insert({ ...payload, created_by: user?.id ?? null })
        .select()
        .single()

      if (insertError) {
        setFormError(insertError.message)
        setSaving(false)
        return
      }

      setEvents((previous) => [...previous, data as AdminEvent])
    }

    setSaving(false)
    setDialogOpen(false)
    setEditingId(null)
    setForm(emptyForm())
  }

  async function handleDelete(event: AdminEvent) {
    if (!supabase) return
    if (!window.confirm(`Delete “${event.title}”? This cannot be undone.`)) return

    setBusyId(event.id)
    setError(null)

    const { error: deleteError } = await supabase.from('events').delete().eq('id', event.id)

    setBusyId(null)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setEvents((previous) => previous.filter((item) => item.id !== event.id))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="heading-font text-2xl font-bold text-slate-dark">Events</h1>
          <p className="text-sm text-slate-muted mt-1">
            {counts.total} events · {counts.published} published · {counts.draft} drafts
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          className="rounded-xl bg-indigo hover:bg-indigo-dark text-white gap-2 shadow-lg shadow-indigo/25"
        >
          <Plus className="w-4 h-4" />
          New event
        </Button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <p>{error}</p>
          {error.toLowerCase().includes('events') && (
            <p className="text-xs mt-1">
              Run <code className="font-mono">supabase/0002_admin.sql</code> in the Supabase SQL
              editor to create the events table.
            </p>
          )}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-border bg-white py-16 text-center">
          <div className="w-7 h-7 border-2 border-indigo/20 border-t-indigo rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-muted">Loading events…</p>
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-indigo/30 bg-white py-16 text-center">
          <CalendarDays className="w-10 h-10 text-indigo/30 mx-auto mb-3" />
          <p className="font-semibold text-slate-dark">No events yet</p>
          <p className="text-sm text-slate-muted mt-1">
            Create your first guest experience to get started.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo hover:text-indigo-dark"
          >
            <Plus className="w-4 h-4" />
            Create an event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {events.map((event) => (
            <article
              key={event.id}
              className="rounded-2xl border border-border bg-white overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow"
            >
              {event.image_url ? (
                <div className="h-36 overflow-hidden bg-slate-bg">
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className="h-24 flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #1E2952 0%, #4F46E5 100%)',
                  }}
                >
                  <Ticket className="w-7 h-7 text-white/50" />
                </div>
              )}

              <div className="p-5 flex flex-col gap-3 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-slate-dark leading-snug">{event.title}</h2>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusStyles[event.status]}`}
                  >
                    {event.status}
                  </span>
                </div>

                {event.description && (
                  <p className="text-xs text-slate-muted line-clamp-2">{event.description}</p>
                )}

                <div className="flex flex-col gap-1.5 text-xs text-slate-muted">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-indigo" />
                    {formatDate(event.event_date)}
                  </span>
                  {(event.start_time || event.end_time) && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo" />
                      {event.start_time?.slice(0, 5) ?? '—'} – {event.end_time?.slice(0, 5) ?? '—'}
                    </span>
                  )}
                  {event.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo" />
                      {event.location}
                    </span>
                  )}
                  {event.capacity && (
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo" />
                      {event.capacity} seats
                    </span>
                  )}
                </div>

                <div className="mt-auto flex items-center justify-between pt-3 border-t border-border">
                  <p className="text-sm font-bold text-slate-dark">
                    {Number(event.price) === 0 ? 'Free' : formatMoney(event.price)}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(event)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-muted hover:text-indigo hover:bg-indigo-pale transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busyId === event.id}
                      onClick={() => void handleDelete(event)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-muted hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {busyId === event.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
          <div className="px-6 pt-6 pb-4 shrink-0 border-b border-border">
            <DialogHeader>
              <DialogTitle className="heading-font text-xl font-bold text-slate-dark text-left">
                {editingId ? 'Edit event' : 'Create event'}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-muted text-left mt-1">
                {editingId
                  ? 'Update the event details below.'
                  : 'Add a new experience for TapServe guests.'}
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-title">Title</Label>
              <Input
                id="event-title"
                value={form.title}
                onChange={(event) => updateField('title', event.target.value)}
                placeholder="Sunset Rooftop Dinner"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-description">Description</Label>
              <textarea
                id="event-description"
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
                rows={3}
                placeholder="A short description for guests…"
                className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-indigo resize-y"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="event-date">Date</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={form.event_date}
                  onChange={(event) => updateField('event_date', event.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="event-start">Start</Label>
                <Input
                  id="event-start"
                  type="time"
                  value={form.start_time}
                  onChange={(event) => updateField('start_time', event.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="event-end">End</Label>
                <Input
                  id="event-end"
                  type="time"
                  value={form.end_time}
                  onChange={(event) => updateField('end_time', event.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="event-location">Location</Label>
                <Input
                  id="event-location"
                  value={form.location}
                  onChange={(event) => updateField('location', event.target.value)}
                  placeholder="Rooftop Terrace"
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="event-capacity">Capacity</Label>
                <Input
                  id="event-capacity"
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(event) => updateField('capacity', event.target.value)}
                  placeholder="40"
                  className="h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="event-price">Price (USD)</Label>
                <Input
                  id="event-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) => updateField('price', event.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="event-status">Status</Label>
                <select
                  id="event-status"
                  value={form.status}
                  onChange={(event) => updateField('status', event.target.value as EventStatus)}
                  className="h-10 rounded-xl border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-indigo"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-image">Image URL</Label>
              <Input
                id="event-image"
                value={form.image_url}
                onChange={(event) => updateField('image_url', event.target.value)}
                placeholder="https://images.pexels.com/…"
                className="h-10 rounded-xl"
              />
            </div>

            {formError && <p className="text-sm font-medium text-destructive">{formError}</p>}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-slate-muted hover:text-slate-dark transition-colors"
              >
                Cancel
              </button>
              <Button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-indigo hover:bg-indigo-dark text-white px-5"
              >
                {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create event'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
