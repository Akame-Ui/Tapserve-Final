import { useEffect, useState } from 'react'
import { AuthProvider } from '@/context/AuthContext'
import { BookingsProvider } from '@/context/BookingsContext'
import { AdminApp } from '@/admin/AdminApp'
import { Navbar } from '@/components/Navbar'
import { SupabaseNotice } from '@/components/SupabaseNotice'
import { Hero } from '@/components/Hero'
import { ServiceCards } from '@/components/ServiceCards'
import { ExperienceSection } from '@/components/ExperienceSection'
import { RoomsSection } from '@/components/RoomsSection'
import { GallerySection } from '@/components/GallerySection'
import { TestimonialsSection } from '@/components/TestimonialsSection'
import { CTASection } from '@/components/CTASection'
import { Footer } from '@/components/Footer'

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash)

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return hash
}

export function App() {
  const hash = useHashRoute()
  const isAdminRoute = hash.startsWith('#/admin')

  return (
    <AuthProvider>
      {isAdminRoute ? (
        <AdminApp />
      ) : (
        <BookingsProvider>
          <div className="min-h-screen bg-white antialiased">
            <a href="#main-content" className="skip-link">
              Skip to content
            </a>
            <Navbar />
            <main id="main-content" tabIndex={-1}>
              <Hero />
              <ServiceCards />
              <ExperienceSection />
              <RoomsSection />
              <GallerySection />
              <TestimonialsSection />
              <CTASection />
            </main>
            <Footer />
            <SupabaseNotice />
          </div>
        </BookingsProvider>
      )}
    </AuthProvider>
  )
}

export default App
