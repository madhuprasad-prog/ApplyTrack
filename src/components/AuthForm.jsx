import { useState } from 'react'
import { Activity, ArrowRight, LoaderCircle } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  getAuthErrorMessage,
  loginWithEmail,
  loginWithGoogle,
  registerWithEmail,
} from '../firebase/authService.js'
import { getSafeReturnPath } from '../utils/authNavigation.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function AuthForm({ mode }) {
  const isRegister = mode === 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(null)
  const [formError, setFormError] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const returnTo = getSafeReturnPath(location.state?.from)

  async function submit(event) {
    event.preventDefault()
    setFormError('')

    const normalizedEmail = email.trim()
    if (!emailPattern.test(normalizedEmail)) {
      setFormError('Enter a valid email address.')
      return
    }
    if (password.length < 6) {
      setFormError('Your password must be at least 6 characters.')
      return
    }
    if (isRegister && password !== confirmPassword) {
      setFormError('The passwords do not match.')
      return
    }

    setBusy('email')
    try {
      if (isRegister) await registerWithEmail(normalizedEmail, password)
      else await loginWithEmail(normalizedEmail, password)
      navigate(returnTo, { replace: true })
    } catch (error) {
      const message = getAuthErrorMessage(error)
      setFormError(message)
      toast.error(message)
    } finally {
      setBusy(null)
    }
  }

  async function continueWithGoogle() {
    setFormError('')
    setBusy('google')
    try {
      await loginWithGoogle()
      navigate(returnTo, { replace: true })
    } catch (error) {
      const message = getAuthErrorMessage(error)
      setFormError(message)
      toast.error(message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <main className="auth-page">
      <aside className="auth-story">
        <div className="auth-brand">
          <span className="auth-brand-mark"><Activity size={20} strokeWidth={2.6} /></span>
          <span>applytrack<span className="auth-brand-period">.</span></span>
        </div>
        <div className="auth-story-content">
          <span className="auth-story-eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
          <h1>Make your job search feel more manageable.</h1>
          <p>Keep applications, interviews, and follow-ups organized in one calm workspace.</p>
          <div className="auth-feature-list">
            <span><i>01</i> See every opportunity at a glance</span>
            <span><i>02</i> Stay ready for every conversation</span>
            <span><i>03</i> Keep moving forward with confidence</span>
          </div>
        </div>
        <p className="auth-story-footer">A little structure goes a long way.</p>
      </aside>

      <section className="auth-content">
        <div className="auth-mobile-brand">
          <span className="auth-brand-mark"><Activity size={19} strokeWidth={2.6} /></span>
          <span>applytrack<span className="auth-brand-period">.</span></span>
        </div>
        <div className="auth-card">
          <p className="auth-eyebrow">{isRegister ? 'GET STARTED' : 'WELCOME BACK'}</p>
          <h2>{isRegister ? 'Create your account' : 'Sign in to ApplyTrack'}</h2>
          <p className="auth-description">
            {isRegister
              ? 'Start organizing your job search in one place.'
              : 'Pick up right where you left off.'}
          </p>

          <form className="auth-form" onSubmit={submit} noValidate>
            <label className="auth-field">
              <span>Email address</span>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                autoCapitalize="none"
                required
                disabled={Boolean(busy)}
              />
            </label>
            <label className="auth-field">
              <span>Password</span>
              <input
                type="password"
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required
                minLength={6}
                disabled={Boolean(busy)}
              />
            </label>
            {isRegister && (
              <label className="auth-field">
                <span>Confirm password</span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  disabled={Boolean(busy)}
                />
              </label>
            )}
            {formError && <p className="auth-error" role="alert">{formError}</p>}
            <button className="button button-primary button-full auth-submit" type="submit" disabled={Boolean(busy)}>
              {busy === 'email' ? <LoaderCircle className="auth-button-spinner" size={16} /> : null}
              {isRegister ? 'Create account' : 'Sign in'}
              {busy !== 'email' && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="auth-divider"><span>or continue with</span></div>
          <button
            className="button button-secondary button-full auth-google"
            type="button"
            onClick={continueWithGoogle}
            disabled={Boolean(busy)}
          >
            {busy === 'google'
              ? <LoaderCircle className="auth-button-spinner" size={16} />
              : <span className="auth-google-mark" aria-hidden="true">G</span>}
            Continue with Google
          </button>

          <p className="auth-switch">
            {isRegister ? 'Already have an account?' : 'New to ApplyTrack?'}{' '}
            <Link
              to={isRegister ? '/login' : '/register'}
              state={location.state}
            >
              {isRegister ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
        </div>
        <p className="auth-content-footer">Organize your search. Focus on what’s next.</p>
      </section>
    </main>
  )
}
