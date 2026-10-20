import { motion } from 'framer-motion'
import { ArrowRight, Star, Users, Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const floatingStats = [
  { icon: Star, value: '4.9 / 5', label: 'Guest Rating', color: 'text-amber-400' },
  { icon: Building2, value: '200+', label: 'Luxury Rooms', color: 'text-indigo-400' },
  { icon: Users, value: '50K+', label: 'Happy Guests', color: 'text-emerald-400' },
]

export function Hero() {
  return (
    <section id="home" className="relative min-h-[100svh] bg-white overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 dot-pattern opacity-40 pointer-events-none" />
      <div
        className="absolute top-0 right-0 w-full lg:w-[45%] h-full bg-indigo-pale/50 pointer-events-none"
        style={{ clipPath: 'polygon(8% 0, 100% 0, 100% 100%, 0% 100%)' }}
      />

      <div className="relative max-w-7xl mx-auto px-6 pt-24 sm:pt-32 pb-20 min-h-[100svh] flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">

          {/* Left: Text content */}
          <div className="flex flex-col gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0 }}
            >
              <Badge className="bg-indigo-pale text-indigo border-indigo/20 text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest">
                Est. in Cebu, PH · Since 2009
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="heading-font text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.05] text-slate-dark"
            >
              Excellence
              <br />
              <span className="gradient-text">at Your</span>
              <br />
              Fingertips.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg text-slate-muted font-light leading-relaxed max-w-md"
            >
              Where the warmth of Cebu meets the sleekness of Silicon Valley.
              A tech-forward boutique resort redefining what luxury means in 2026.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="flex flex-wrap items-center gap-4"
            >
              <a
                href="#book"
                className="inline-flex items-center gap-2 bg-indigo hover:bg-indigo-dark text-white rounded-xl px-8 py-4 text-base font-semibold shadow-xl transition-all duration-300 hover:shadow-indigo/50 hover:-translate-y-1 group"
              >
                Book Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#rooms"
                className="inline-flex items-center gap-2 text-slate-dark hover:text-indigo px-6 py-4 text-base font-medium rounded-xl hover:bg-indigo-pale transition-all duration-200"
              >
                Explore Rooms
              </a>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex items-center gap-6 pt-2"
            >
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <img
                    key={i}
                    src={`https://i.pravatar.cc/40?u=guest${i}`}
                    alt={`Guest ${i}`}
                    className="w-9 h-9 rounded-full border-2 border-white object-cover"
                  />
                ))}
              </div>
              <div className="text-sm text-slate-muted">
                <span className="font-semibold text-slate-dark">50,000+</span> guests trusted us
              </div>
            </motion.div>

            {/* Mobile hero image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55 }}
              className="relative lg:hidden rounded-3xl overflow-hidden aspect-[4/3] shadow-2xl bg-space-indigo"
            >
              <img
                src="https://images.pexels.com/photos/27543255/pexels-photo-27543255.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Luxurious hotel suite interior"
                className="w-full h-full object-cover"
                loading="eager"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-space-indigo/80 via-space-indigo/10 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-white font-semibold text-sm">Ocean View Suite</p>
                  <p className="text-white/60 text-xs">Smart room with AI concierge</p>
                </div>
                <p className="text-white font-bold text-sm whitespace-nowrap">
                  $299<span className="font-normal text-xs text-white/70">/night</span>
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right: Hotel image with floating cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            {/* Main image */}
            <div className="relative rounded-3xl overflow-hidden aspect-[4/5] shadow-2xl">
              <img
                src="https://images.pexels.com/photos/27543255/pexels-photo-27543255.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Luxurious hotel suite interior by Hoàng nguyễn on Pexels"
                className="w-full h-full object-cover"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-space-indigo/60 via-transparent to-transparent" />
            </div>

            {/* Floating stat cards */}
            {floatingStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 + i * 0.15 }}
                className={`absolute glass-card rounded-2xl px-4 py-3 shadow-xl min-w-[140px] ${
                  i === 0
                    ? '-left-8 top-16'
                    : i === 1
                      ? '-right-6 top-1/3'
                      : '-left-8 bottom-24'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm leading-none">{stat.value}</p>
                    <p className="text-white/70 text-xs mt-0.5">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Bottom tag */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.4 }}
              className="absolute bottom-6 left-6 right-6 glass-card rounded-2xl p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold text-sm">Ocean View Suite</p>
                  <p className="text-white/60 text-xs">Smart room with AI concierge</p>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-xs">from</p>
                  <p className="text-white font-bold">
                    $299<span className="font-normal text-xs">/night</span>
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-slate-muted uppercase tracking-widest">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-0.5 h-6 bg-indigo/40 rounded-full"
        />
      </motion.div>
    </section>
  )
}
