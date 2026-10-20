import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Maximize2, Eye, Bed, Wifi, Tv, ArrowRight, Check, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

type RoomCategory = 'All' | 'Suites' | 'Villas' | 'Penthouse'

const categories: RoomCategory[] = ['All', 'Suites', 'Villas', 'Penthouse']

const rooms = [
  {
    id: 'superior',
    category: 'Suites' as RoomCategory,
    name: 'Superior Room',
    tagline: 'Comfort redefined, effortlessly',
    image:
      'https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=900',
    attribution: 'Pixabay on Pexels',
    price: 149,
    guests: 2,
    size: '32 m²',
    view: 'Garden View',
    bed: 'King Bed',
    badge: null as string | null,
    rating: 4.7,
    perks: ['Smart TV', 'Free Wi-Fi', 'Mini Bar', 'Rain Shower'],
  },
  {
    id: 'ocean-suite',
    category: 'Suites' as RoomCategory,
    name: 'Ocean View Suite',
    tagline: 'Wake up to the open sea',
    image:
      'https://images.pexels.com/photos/18201945/pexels-photo-18201945.jpeg?auto=compress&cs=tinysrgb&w=900',
    attribution: 'The 7 Hotel Lisbon on Pexels',
    price: 299,
    guests: 2,
    size: '56 m²',
    view: 'Ocean View',
    bed: 'King Bed',
    badge: 'Most Popular',
    rating: 4.9,
    perks: ['Smart TV', 'Free Wi-Fi', 'Private Balcony', 'AI Concierge', 'Jacuzzi'],
  },
  {
    id: 'garden-villa',
    category: 'Villas' as RoomCategory,
    name: 'Garden Pool Villa',
    tagline: 'Your own private tropical retreat',
    image:
      'https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=900',
    attribution: 'Vecislavas Popa on Pexels',
    price: 249,
    guests: 3,
    size: '72 m²',
    view: 'Garden & Pool',
    bed: 'King + Twin',
    badge: null as string | null,
    rating: 4.8,
    perks: ['Smart TV', 'Free Wi-Fi', 'Private Pool', 'Butler Service', 'Outdoor Lounge'],
  },
  {
    id: 'penthouse',
    category: 'Penthouse' as RoomCategory,
    name: 'Sky Penthouse',
    tagline: 'The pinnacle of elevated living',
    image:
      'https://images.pexels.com/photos/2631746/pexels-photo-2631746.jpeg?auto=compress&cs=tinysrgb&w=900',
    attribution: 'Max Vakhtbovych on Pexels',
    price: 599,
    guests: 4,
    size: '140 m²',
    view: '360° Panoramic',
    bed: '2 King Beds',
    badge: 'Exclusive',
    rating: 5.0,
    perks: ['Smart TV', 'Free Wi-Fi', 'Private Terrace', 'Butler Service', 'Hot Tub', 'Chef on Call'],
  },
]

const perkIcon: Record<string, React.ElementType> = {
  'Free Wi-Fi': Wifi,
  'Smart TV': Tv,
}

export function RoomsSection() {
  const [active, setActive] = useState<RoomCategory>('All')

  const filtered = active === 'All' ? rooms : rooms.filter((r) => r.category === active)

  return (
    <section className="py-24 bg-white relative overflow-hidden" id="rooms">
      {/* Subtle background accent */}
      <div
        className="absolute top-0 left-0 w-full h-64 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, #EEF2FF 0%, transparent 100%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div>
            <Badge className="bg-indigo-pale text-indigo border-indigo/20 text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">
              Our Rooms &amp; Suites
            </Badge>
            <h2 className="heading-font text-4xl lg:text-5xl font-bold text-slate-dark leading-tight">
              Find Your Perfect{' '}
              <span className="gradient-text">Stay</span>
            </h2>
            <p className="text-slate-muted font-light text-base mt-3 max-w-md leading-relaxed">
              Each room is a sanctuary — crafted with smart technology, curated design, and
              unmatched Cebu hospitality.
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 bg-slate-bg border border-border-light rounded-2xl p-1.5 shrink-0 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActive(cat)}
                aria-pressed={active === cat}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  active === cat
                    ? 'bg-indigo text-white shadow-md shadow-indigo/30'
                    : 'text-slate-muted hover:text-slate-dark hover:bg-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Room cards grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {filtered.map((room, i) => (
              <motion.div
                key={room.id}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="h-full"
              >
                <Card className="h-full flex flex-col bg-white border border-border-light rounded-3xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden gap-0 py-0 ring-0 group/card">
                  {/* Room Image */}
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <img
                      src={room.image}
                      alt={`${room.name} — ${room.attribution}`}
                      className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700"
                      loading="lazy"
                      decoding="async"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-space-indigo/70 via-transparent to-transparent" />

                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      {room.badge && (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            room.badge === 'Exclusive'
                              ? 'bg-amber-400 text-amber-950 shadow-lg shadow-amber-500/30'
                              : 'bg-indigo text-white shadow-lg shadow-indigo/40'
                          }`}
                        >
                          {room.badge}
                        </span>
                      )}
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm border border-white/30 text-white">
                        {room.category}
                      </span>
                    </div>

                    {/* Rating pill */}
                    <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-3 py-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-white text-xs font-bold">{room.rating}</span>
                    </div>

                    {/* Price overlay at bottom */}
                    <div className="absolute bottom-4 right-4 text-right">
                      <p className="text-white/70 text-xs">from</p>
                      <p className="text-white font-bold text-2xl heading-font leading-none">
                        ${room.price}
                        <span className="text-sm font-normal text-white/70">/night</span>
                      </p>
                    </div>

                    {/* Room name at bottom left */}
                    <div className="absolute bottom-4 left-4">
                      <h3 className="heading-font text-white font-bold text-xl leading-tight">
                        {room.name}
                      </h3>
                      <p className="text-white/60 text-xs mt-0.5">{room.tagline}</p>
                    </div>
                  </div>

                  {/* Card body */}
                  <CardContent className="p-6 flex flex-1 flex-col gap-5">
                    {/* Quick stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { icon: Users, label: `${room.guests} Guests` },
                        { icon: Maximize2, label: room.size },
                        { icon: Eye, label: room.view },
                        { icon: Bed, label: room.bed },
                      ].map(({ icon: Icon, label }) => (
                        <div
                          key={label}
                          className="flex flex-col items-center gap-1.5 bg-slate-bg rounded-xl py-3 px-1"
                        >
                          <Icon className="w-4 h-4 text-indigo" />
                          <span className="text-xs text-slate-muted text-center leading-tight font-medium">
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Perks */}
                    <div>
                      <p className="text-xs font-semibold text-slate-dark uppercase tracking-widest mb-3">
                        Included Preferences
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {room.perks.map((perk) => {
                          const Icon = perkIcon[perk]
                          return (
                            <div
                              key={perk}
                              className="inline-flex items-center gap-1.5 bg-indigo-pale text-indigo rounded-lg px-3 py-1.5 text-xs font-medium"
                            >
                              {Icon ? (
                                <Icon className="w-3 h-3" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                              {perk}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Action row */}
                    <div className="mt-auto flex items-center justify-between gap-4 pt-1 border-t border-border-light">
                      <div>
                        <p className="text-slate-muted text-xs">Starting from</p>
                        <p className="text-slate-dark font-bold text-xl heading-font">
                          ${room.price}
                          <span className="text-xs font-normal text-slate-muted ml-1">/night</span>
                        </p>
                      </div>
                      <a
                        href="#book"
                        className="inline-flex items-center gap-2 bg-indigo hover:bg-indigo-dark text-white rounded-xl px-6 py-3 text-sm font-semibold shadow-lg shadow-indigo/30 hover:-translate-y-0.5 transition-all duration-200 group/btn"
                        aria-label="Book now"
                      >
                        Book Now
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center text-slate-muted text-sm mt-10 font-light"
        >
          All rooms include complimentary breakfast, AI concierge access, and 24/7 butler on-call.{' '}
          <a href="#contact" className="text-indigo font-medium hover:underline">
            Contact us
          </a>{' '}
          for custom packages.
        </motion.p>
      </div>
    </section>
  )
}
