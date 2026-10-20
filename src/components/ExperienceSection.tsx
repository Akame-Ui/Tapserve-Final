import { motion } from 'framer-motion'
import { Sparkles, Cpu, TreePalm } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const features = [
  {
    icon: Sparkles,
    title: 'Spa & Wellness',
    description: 'Indulge in ancient Filipino healing traditions fused with modern spa science for complete mind-body renewal.',
    img: 'https://images.pexels.com/photos/3771811/pexels-photo-3771811.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    icon: Cpu,
    title: 'Smart Room Tech',
    description: 'Control lighting, temperature, curtains and dining orders from a sleek tablet on your nightstand.',
    img: 'https://images.pexels.com/photos/7031731/pexels-photo-7031731.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    icon: TreePalm,
    title: 'Private Beach',
    description: 'Your own stretch of white Cebu sand — complete with butler service and chilled coconuts on demand.',
    img: 'https://images.pexels.com/photos/584302/pexels-photo-584302.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
]

export function ExperienceSection() {
  return (
    <section className="py-24 bg-slate-bg relative overflow-hidden" id="about">
      {/* Dot pattern background */}
      <div className="absolute inset-0 dot-pattern opacity-60 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="bg-indigo-pale text-indigo border-indigo/20 text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">
              The Experience
            </Badge>
            <h2 className="heading-font text-4xl lg:text-5xl font-bold text-slate-dark leading-tight max-w-lg">
              Crafted for the{' '}
              <span className="gradient-text">Discerning</span> Traveler
            </h2>
          </motion.div>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* Large left card - aerial Cebu */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3 rounded-3xl overflow-hidden relative aspect-[4/3] shadow-2xl group"
          >
            <img
              src="https://images.pexels.com/photos/20478603/pexels-photo-20478603.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt="Aerial view of TapServe tropical resort in Cebu City by XT7 Core on Pexels"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-space-indigo via-space-indigo/30 to-transparent" />
            <div className="absolute bottom-0 left-0 p-8">
              <p className="text-indigo-light text-xs font-semibold uppercase tracking-widest mb-2">Cebu City, Philippines</p>
              <h3 className="heading-font text-white text-2xl font-bold mb-2">Our Resort</h3>
              <p className="text-white/70 text-sm font-light leading-relaxed max-w-xs">
                Nestled on the shores of Cebu, offering breathtaking views of the Visayan Sea.
              </p>
              <div className="mt-4 flex gap-4">
                <div className="text-center">
                  <p className="text-white font-bold text-xl heading-font">15+</p>
                  <p className="text-white/60 text-xs">Years</p>
                </div>
                <div className="w-px bg-white/20" />
                <div className="text-center">
                  <p className="text-white font-bold text-xl heading-font">5ha</p>
                  <p className="text-white/60 text-xs">Land Area</p>
                </div>
                <div className="w-px bg-white/20" />
                <div className="text-center">
                  <p className="text-white font-bold text-xl heading-font">3</p>
                  <p className="text-white/60 text-xs">Restaurants</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right column - 3 feature cards */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white rounded-2xl border border-border-light shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
              >
                <div className="flex gap-4 p-5">
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                    <img
                      src={feature.img}
                      alt={feature.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <feature.icon className="w-4 h-4 text-indigo shrink-0" />
                      <h3 className="heading-font text-sm font-bold text-slate-dark">{feature.title}</h3>
                    </div>
                    <p className="text-xs text-slate-muted font-light leading-relaxed line-clamp-3">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
