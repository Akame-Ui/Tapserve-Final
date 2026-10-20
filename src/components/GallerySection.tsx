import { useRef } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const galleryImages = [
  {
    src: 'https://images.unsplash.com/photo-1762254923872-5bdc4210eb90?crop=entropy&cs=srgb&fm=jpg&w=800&q=80',
    caption: 'Infinity Pool',
    sub: 'Panoramic ocean views',
    attribution: 'Tommaso Ubezio on Unsplash',
  },
  {
    src: 'https://images.pexels.com/photos/33474124/pexels-photo-33474124.jpeg?auto=compress&cs=tinysrgb&w=800',
    caption: 'Gourmet Dining',
    sub: 'Michelin-inspired cuisine',
    attribution: 'Deane Bayas on Pexels',
  },
  {
    src: 'https://images.pexels.com/photos/18201945/pexels-photo-18201945.jpeg?auto=compress&cs=tinysrgb&w=800',
    caption: 'Luxury Suites',
    sub: 'Elegant modern interiors',
    attribution: 'The 7 Hotel Lisbon on Pexels',
  },
  {
    src: 'https://images.pexels.com/photos/14036250/pexels-photo-14036250.jpeg?auto=compress&cs=tinysrgb&w=800',
    caption: 'Grand Lobby',
    sub: 'Timeless first impressions',
    attribution: 'Quang Nguyen Vinh on Pexels',
  },
  {
    src: 'https://images.pexels.com/photos/5932576/pexels-photo-5932576.jpeg?auto=compress&cs=tinysrgb&w=800',
    caption: 'Sunset Terrace',
    sub: 'Golden hour every evening',
    attribution: 'Ahmed Abd Allah on Pexels',
  },
]

export function GallerySection() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = 380
    scrollRef.current.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' })
  }

  return (
    <section className="py-24 bg-space-indigo overflow-hidden" id="gallery">
      <div className="max-w-7xl mx-auto px-6 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="text-indigo-light text-xs font-semibold uppercase tracking-widest mb-3">Our Gallery</p>
            <h2 className="heading-font text-4xl lg:text-5xl font-bold text-white leading-tight">
              A Feast for the Senses
            </h2>
          </div>
          <div className="flex gap-3 shrink-0">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/20"
              aria-label="Scroll gallery left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="w-11 h-11 rounded-full bg-indigo hover:bg-indigo-dark text-white flex items-center justify-center transition-colors shadow-lg shadow-indigo/40"
              aria-label="Scroll gallery right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Filmstrip */}
      <div
        ref={scrollRef}
        role="region"
        aria-label="Gallery images"
        tabIndex={0}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth pl-6 md:pl-[calc((100vw-80rem)/2+1.5rem)] pr-6 pb-4 scrollbar-hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {galleryImages.map((img, i) => (
          <motion.div
            key={img.caption}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="snap-start shrink-0 w-72 md:w-80 relative rounded-2xl overflow-hidden group shadow-2xl"
          >
            <div className="aspect-[3/4] overflow-hidden">
              <img
                src={img.src}
                alt={`${img.caption} — ${img.attribution}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-space-indigo-deep/90 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 p-5">
              <h3 className="heading-font text-white font-bold text-base">{img.caption}</h3>
              <p className="text-white/60 text-xs mt-1">{img.sub}</p>
            </div>
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-indigo/0 group-hover:bg-indigo/10 transition-colors duration-300" />
          </motion.div>
        ))}
      </div>
    </section>
  )
}
