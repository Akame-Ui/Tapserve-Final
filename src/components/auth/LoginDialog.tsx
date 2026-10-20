import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, LogIn, Zap } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
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

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchToRegister: () => void
}

export function LoginDialog({ open, onOpenChange, onSwitchToRegister }: LoginDialogProps) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      await login(email, password)
      onOpenChange(false)
      setEmail('')
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleSwitchToRegister() {
    onOpenChange(false)
    setTimeout(onSwitchToRegister, 200)
  }

  const fieldVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, delay: i * 0.08 },
    }),
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-0 border-border">
        {/* Header band */}
        <div
          className="px-5 sm:px-8 pt-6 sm:pt-8 pb-5 sm:pb-6"
          style={{ background: 'linear-gradient(135deg, #1E2952 0%, #0F172A 100%)' }}
        >
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-indigo flex items-center justify-center shadow-lg shadow-indigo/40">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="heading-font text-xl font-bold text-white tracking-tight">
              Tap<span className="text-indigo-light">Serve</span>
            </span>
          </div>
          <DialogHeader>
            <DialogTitle className="heading-font text-2xl font-bold text-white text-left">
              Welcome back
            </DialogTitle>
            <DialogDescription className="text-white/50 text-sm text-left mt-1">
              Sign in to manage your bookings and preferences.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 sm:px-8 py-5 sm:py-6 flex flex-col gap-5">
          <motion.div
            custom={0}
            initial="hidden"
            animate={open ? 'visible' : 'hidden'}
            variants={fieldVariants}
            className="flex flex-col gap-1.5"
          >
            <Label htmlFor="login-email" className="text-sm font-medium text-slate-dark">
              Email
            </Label>
            <Input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="h-11 rounded-xl border-border focus-visible:ring-indigo/40 focus-visible:border-indigo"
            />
          </motion.div>

          <motion.div
            custom={1}
            initial="hidden"
            animate={open ? 'visible' : 'hidden'}
            variants={fieldVariants}
            className="flex flex-col gap-1.5"
          >
            <Label htmlFor="login-password" className="text-sm font-medium text-slate-dark">
              Password
            </Label>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="h-11 rounded-xl border-border pr-11 focus-visible:ring-indigo/40 focus-visible:border-indigo"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-muted transition-colors hover:bg-slate-bg hover:text-slate-dark"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-destructive text-sm font-medium -mt-1"
              role="alert"
            >
              {error}
            </motion.p>
          )}

          <motion.div
            custom={2}
            initial="hidden"
            animate={open ? 'visible' : 'hidden'}
            variants={fieldVariants}
          >
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-indigo hover:bg-indigo-dark text-white font-semibold shadow-lg shadow-indigo/30 transition-all duration-200 hover:-translate-y-0.5 gap-2"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </motion.div>

          <motion.p
            custom={3}
            initial="hidden"
            animate={open ? 'visible' : 'hidden'}
            variants={fieldVariants}
            className="text-center text-sm text-slate-muted"
          >
            Don't have an account?{' '}
            <button
              type="button"
              onClick={handleSwitchToRegister}
              className="text-indigo font-semibold hover:text-indigo-dark transition-colors"
            >
              Register
            </button>
          </motion.p>
        </form>
      </DialogContent>
    </Dialog>
  )
}
