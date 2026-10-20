import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Menu, Zap, LogOut, User, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/context/AuthContext'
import { useBookings } from '@/context/BookingsContext'
import { LoginDialog } from '@/components/auth/LoginDialog'
import { RegisterDialog } from '@/components/auth/RegisterDialog'
import { ProfileSheet } from '@/components/auth/ProfileSheet'

const navLinks = [
  { label: 'About', href: '#about' },
  { label: 'Rooms', href: '#rooms' },
  { label: 'Amenities', href: '#amenities' },
  { label: 'Contact', href: '#contact' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const promptedRef = useRef(false)

  const { user, loading, logout } = useAuth()
  const { bookings } = useBookings()
  const activeBookingsCount = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'pending'
  ).length

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleOpenLogin = () => setLoginOpen(true)
    window.addEventListener('tapserve:open-login', handleOpenLogin)
    return () => window.removeEventListener('tapserve:open-login', handleOpenLogin)
  }, [])

  useEffect(() => {
    const handleOpenRegister = () => setRegisterOpen(true)
    window.addEventListener('tapserve:open-register', handleOpenRegister)
    return () => window.removeEventListener('tapserve:open-register', handleOpenRegister)
  }, [])

  // Show the registration form as the first thing a new visitor sees.
  useEffect(() => {
    if (loading || promptedRef.current) return

    // Decide only once per page load, after auth has resolved.
    promptedRef.current = true

    if (user) return
    if (window.location.hash.startsWith('#/admin')) return

    // The delay lets the hero animation settle before the dialog slides in.
    window.setTimeout(() => setRegisterOpen(true), 350)
  }, [loading, user])

  const avatarUrl = user
    ? user.avatarUrl ?? `https://i.pravatar.cc/40?u=${encodeURIComponent(user.email)}`
    : null

  async function handleLogout() {
    try {
      await logout()
    } catch {
      // The session may already be gone; nothing else to clean up here.
    }
  }

  function handleOpenProfile() {
    setProfileOpen(true)
  }

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass-nav shadow-sm py-3' : 'bg-transparent py-5'}`}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 w-12 h-12 bg-indigo rounded-full blur-sm" aria-hidden="true" />
        </div>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <a href="#home" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-indigo flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="heading-font text-xl font-bold tracking-tight">
              <span className="text-slate-muted">Tap</span>
              <span className="text-indigo">Serve</span>
            </span>
          </a>

          {/* Desktop Nav */}
          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-8" role="navigation">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-slate-muted hover:text-slate-dark transition-colors duration-200"
                aria-label={`Navigate to ${link.label}`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA / Auth */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-indigo-pale animate-pulse" aria-hidden="true" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 hover:bg-indigo-pale transition-colors cursor-pointer border-0 bg-transparent"
                      aria-label={`My account, ${user.name}`}
                    />
                  }
                >
                  <img
                    src={avatarUrl!}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border-2 border-indigo/30"
                  />
                  <span className="text-sm font-semibold text-slate-dark max-w-[120px] truncate">
                    {user.name}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-xl border-border mt-1 p-2">
                  {/* User info header */}
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="px-2 py-2 flex flex-col gap-0.5">
                      <span className="font-semibold text-slate-dark text-sm">{user.name}</span>
                      <span className="text-xs text-slate-muted font-normal truncate">{user.email}</span>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>

                  <DropdownMenuSeparator />

                  {/* My Account → opens ProfileSheet */}
                  <DropdownMenuItem
                    className="gap-2 text-sm text-slate-dark rounded-xl cursor-pointer px-2 py-2"
                    onClick={handleOpenProfile}
                  >
                    <User className="w-4 h-4 text-indigo shrink-0" />
                    My Account
                    {activeBookingsCount > 0 && (
                      <span className="ml-auto text-[10px] font-bold bg-red-100 text-red-600 rounded-full px-1.5 py-0.5">
                        {activeBookingsCount}
                      </span>
                    )}
                  </DropdownMenuItem>

                  {user.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="gap-2 text-sm text-indigo rounded-xl cursor-pointer px-2 py-2"
                        onClick={() => {
                          setProfileOpen(false)
                          window.location.hash = '#/admin'
                        }}
                      >
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        Admin Dashboard
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />

                  {/* Log out */}
                  <DropdownMenuItem
                    variant="destructive"
                    className="gap-2 text-sm rounded-xl cursor-pointer px-2 py-2"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setLoginOpen(true)}
                  className="inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold text-slate-dark transition-colors hover:bg-indigo-pale hover:text-indigo"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterOpen(true)}
                  className="inline-flex h-10 items-center rounded-xl border border-indigo/25 px-4 text-sm font-semibold text-indigo transition-colors hover:bg-indigo-pale"
                >
                  Register
                </button>
              </>
            )}

            <a
              href="#book"
              className="inline-flex h-10 items-center rounded-xl bg-indigo px-5 text-sm font-semibold text-white shadow-lg shadow-indigo/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-dark hover:shadow-indigo/50"
              aria-label="Book now"
            >
              Book Now
            </a>
          </div>

          {/* Mobile actions */}
          <div className="flex items-center gap-2 md:hidden">
            <a
              href="#book"
              className="inline-flex h-9 items-center rounded-xl bg-indigo px-3 text-xs font-semibold text-white shadow-md shadow-indigo/25"
              aria-label="Book now"
            >
              Book
            </a>
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-dark"
                  aria-label="Open navigation menu"
                />
              }
            >
              <Menu className="w-5 h-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-white">
              <div className="flex flex-col gap-8 pt-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <span className="heading-font text-xl font-bold">
                    <span className="text-slate-muted">Tap</span>
                    <span className="text-indigo">Serve</span>
                  </span>
                </div>

                {/* Mobile user info */}
                {user && (
                  <button
                    type="button"
                    onClick={() => { setMobileOpen(false); setTimeout(() => setProfileOpen(true), 200) }}
                    className="flex items-center gap-3 bg-indigo-pale hover:bg-indigo/10 rounded-2xl px-4 py-3 transition-colors text-left w-full"
                  >
                    <img
                      src={avatarUrl!}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover border-2 border-indigo/30 shrink-0"
                    />
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <span className="text-sm font-semibold text-slate-dark truncate">{user.name}</span>
                      <span className="text-xs text-slate-muted truncate">{user.email}</span>
                    </div>
                    {activeBookingsCount > 0 && (
                      <span className="text-[10px] font-bold bg-red-100 text-red-600 rounded-full px-1.5 py-0.5 shrink-0">
                        {activeBookingsCount}
                      </span>
                    )}
                  </button>
                )}

                <nav aria-label="Mobile navigation" className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="text-base font-medium text-slate-dark hover:text-indigo transition-colors py-2 border-b border-border-light"
                    >
                      {link.label}
                    </a>
                  ))}
                </nav>

                <div className="flex flex-col gap-3">
                  <a
                    href="#book"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex justify-center items-center bg-indigo hover:bg-indigo-dark text-white rounded-xl w-full py-3 font-semibold transition-colors"
                  >
                    Book Now
                  </a>

                  {user ? (
                    <>
                      {user.role === 'admin' && (
                        <button
                          type="button"
                          onClick={() => {
                            setMobileOpen(false)
                            window.location.hash = '#/admin'
                          }}
                          className="inline-flex justify-center items-center gap-2 bg-indigo-pale hover:bg-indigo text-indigo hover:text-white rounded-xl w-full py-3 text-sm font-semibold transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Admin Dashboard
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => { setMobileOpen(false); handleLogout() }}
                        className="inline-flex justify-center items-center gap-2 border border-border-light hover:border-destructive text-slate-muted hover:text-destructive rounded-xl w-full py-3 text-sm font-semibold transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Log out
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => { setMobileOpen(false); setTimeout(() => setLoginOpen(true), 200) }}
                        className="inline-flex justify-center items-center border border-border-light hover:border-indigo text-slate-dark hover:text-indigo rounded-xl w-full py-3 text-sm font-semibold transition-colors"
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMobileOpen(false); setTimeout(() => setRegisterOpen(true), 200) }}
                        className="inline-flex justify-center items-center bg-indigo-pale hover:bg-indigo text-indigo hover:text-white rounded-xl w-full py-3 text-sm font-semibold transition-colors"
                      >
                        Register
                      </button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
            </Sheet>
          </div>
        </div>
      </motion.header>

      {/* Auth Dialogs */}
      <LoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSwitchToRegister={() => setRegisterOpen(true)}
      />
      <RegisterDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onSwitchToLogin={() => setLoginOpen(true)}
      />
      <ProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  )
}