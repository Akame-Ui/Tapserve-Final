import { motion } from 'framer-motion'
import { BrainCircuit, Waves, UtensilsCrossed, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const services = [
  {
    icon: BrainCircuit,
    title: 'Smart Concierge',
    description: 'On-demand AI assistance at every touchpoint — from booking to checkout.',
    iconBg: 'bg-indigo',
    link: '#book',
  },
  {
    icon: Waves,
    title: 'Infinity Pool',
    description: 'Serene infinity pool with panoramic ocean views over the Cebu coastline.',
    iconBg: 'bg-sky-500',
    link: '#gallery',
  },
  {
    icon: UtensilsCrossed,
    title: 'Gourmet Dining',
    description: 'Michelin-inspired cuisine using fresh local ingredients with world-class flair.',
    iconBg: 'bg-amber-500',
    link: '#gallery',
  },
]

export function ServiceCards() {
  return (
    <section className="relative z-10 -mt-16 px-6 pb-4 max-w-7xl mx-auto" id="amenities">
      <h2 className="sr-only">Featured amenities</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map((service, i) => (
          <motion.div
            key={service.title}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: i * 0.12 }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
          >
            <Card className="h-full bg-white border border-border-light rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300 overflow-hidden group">
              <CardContent className="p-7 h-full flex flex-col">
                <div
                  className={`w-12 h-12 rounded-xl ${service.iconBg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                >
                  <service.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="heading-font text-lg font-bold text-slate-dark mb-2">
                  {service.title}
                </h3>
                <p className="text-sm text-slate-muted leading-relaxed mb-5 font-light">
                  {service.description}
                </p>
                <a
                  href={service.link}
                  className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-indigo hover:gap-3 transition-all duration-200 group/link"
                  aria-label={`Learn more about ${service.title}`}
                >
                  Explore
                  <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                </a>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
