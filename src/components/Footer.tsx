import { Zap, Phone, Mail, MapPin, Instagram, Twitter, Facebook, Linkedin } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

const footerLinks = {
  Explore: [
    { label: 'Suites', href: '#rooms' },
    { label: 'Villas', href: '#rooms' },
    { label: 'Penthouse', href: '#rooms' },
    { label: 'Pool Rooms', href: '#rooms' },
  ],
  Company: [
    { label: 'About Us', href: '#about' },
    { label: 'Careers', href: '#contact' },
    { label: 'Press', href: '#contact' },
    { label: 'Sustainability', href: '#about' },
  ],
  Services: [
    { label: 'Smart Concierge', href: '#book' },
    { label: 'Spa & Wellness', href: '#amenities' },
    { label: 'Gourmet Dining', href: '#gallery' },
    { label: 'Events', href: '#book' },
  ],
}

const socials = [
  { icon: Instagram, label: 'Instagram', href: 'https://instagram.com' },
  { icon: Twitter, label: 'Twitter', href: 'https://x.com' },
  { icon: Facebook, label: 'Facebook', href: 'https://facebook.com' },
  { icon: Linkedin, label: 'LinkedIn', href: 'https://linkedin.com' },
]

export function Footer() {
  return (
    <footer className="bg-space-indigo-deep text-white" id="contact">
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <a href="#home" className="flex items-center gap-2 mb-5 group">
              <div className="w-9 h-9 rounded-xl bg-indigo flex items-center justify-center shadow-lg shadow-indigo/40">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="heading-font text-2xl font-bold">
                <span className="text-white/50">Tap</span>
                <span className="text-indigo-light">Serve</span>
              </span>
            </a>
            <p className="text-white/50 text-sm font-light leading-relaxed max-w-xs mb-6">
              Where Cebu warmth meets Silicon Valley sleekness. The premier tech-forward boutique resort redefining hospitality since 2009.
            </p>

            {/* Contact info */}
            <div className="flex flex-col gap-3">
              <a href="tel:+63328889999" className="flex items-center gap-3 text-white/50 hover:text-indigo-light transition-colors text-sm group">
                <Phone className="w-4 h-4 text-indigo shrink-0" />
                +63 32 888 9999
              </a>
              <a href="mailto:hello@tapserve.ph" className="flex items-center gap-3 text-white/50 hover:text-indigo-light transition-colors text-sm">
                <Mail className="w-4 h-4 text-indigo shrink-0" />
                hello@tapserve.ph
              </a>
              <div className="flex items-start gap-3 text-white/50 text-sm">
                <MapPin className="w-4 h-4 text-indigo shrink-0 mt-0.5" />
                Lapu-Lapu City, Cebu, PH 6015
              </div>
            </div>
          </div>

          {/* Links columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="heading-font text-white font-semibold text-sm uppercase tracking-widest mb-5">
                {title}
              </h3>
              <ul className="flex flex-col gap-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-white/50 hover:text-indigo-light transition-colors text-sm font-light"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="bg-white/10 mb-8" />

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/50 text-xs">
            © 2026 TapServe. All rights reserved. ·{' '}
            <a href="#" className="text-white/60 underline underline-offset-2 hover:text-indigo-light transition-colors">Privacy Policy</a>
            {' · '}
            <a href="#" className="text-white/60 underline underline-offset-2 hover:text-indigo-light transition-colors">Terms of Service</a>
          </p>
          <div className="flex items-center gap-3">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                target="_blank"
                rel="noreferrer"
                className="group w-8 h-8 rounded-lg bg-white/10 hover:bg-indigo/60 flex items-center justify-center transition-colors duration-200"
              >
                <social.icon className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
