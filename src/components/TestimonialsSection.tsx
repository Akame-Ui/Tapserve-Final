import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const featured = {
  quote:
    'TapServe doesn\'t just feel like a hotel — it feels like living in the future. The AI concierge knew my preferences before I even asked. Absolutely flawless from check-in to checkout.',
  name: 'Isabelle Chen',
  role: 'Tech Executive, Singapore',
  avatar: 'https://i.pravatar.cc/80?u=isabelle-chen',
  rating: 5,
}

const testimonials = [
  {
    quote: 'The infinity pool at sunset is the most breathtaking experience I\'ve ever had at a resort. The staff remembered our anniversary and surprised us.',
    name: 'Marcus & Lena Wolff',
    role: 'Travelers from Berlin',
    avatar: 'https://i.pravatar.cc/60?u=marcus-wolff',
    rating: 5,
  },
  {
    quote: 'Gourmet dining at TapServe rivaled anything I\'ve had in Tokyo. The fusion of Filipino flavors with modern techniques is nothing short of extraordinary.',
    name: 'Kenji Nakamura',
    role: 'Food Critic, Tokyo',
    avatar: 'https://i.pravatar.cc/60?u=kenji-nakamura',
    rating: 5,
  },
  {
    quote: 'I\'ve stayed at hotels across 6 continents. TapServe\'s attention to detail — especially the smart room interface — is on a completely different level.',
    name: 'Priya Sharma',
    role: 'Founder, Mumbai',
    avatar: 'https://i.pravatar.cc/60?u=priya-sharma',
    rating: 5,
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-white" id="testimonials">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-indigo text-xs font-semibold uppercase tracking-widest mb-3">Guest Reviews</p>
          <h2 className="heading-font text-4xl lg:text-5xl font-bold text-slate-dark leading-tight">
            What Our Guests Say
          </h2>
        </motion.div>

        {/* Featured quote */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="relative bg-slate-bg rounded-3xl p-8 md:p-12 border-l-4 border-indigo shadow-lg max-w-4xl mx-auto">
            <Quote className="w-12 h-12 text-indigo/20 absolute top-6 right-8" />
            <div className="flex gap-1 mb-6">
              {Array.from({ length: featured.rating }).map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-slate-dark text-xl md:text-2xl font-light leading-relaxed mb-8 max-w-3xl">
              &ldquo;{featured.quote}&rdquo;
            </p>
            <div className="flex items-center gap-4">
              <img
                src={featured.avatar}
                alt={featured.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-indigo/20"
              />
              <div>
                <p className="font-semibold text-slate-dark">{featured.name}</p>
                <p className="text-slate-muted text-sm">{featured.role}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Supporting testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Card className="bg-white border border-border-light rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 h-full">
                <CardContent className="p-6 flex flex-col gap-4">
                  <div className="flex gap-1">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-dark text-sm font-light leading-relaxed flex-1">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 pt-2 border-t border-border-light">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-dark">{t.name}</p>
                      <p className="text-xs text-slate-muted">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
