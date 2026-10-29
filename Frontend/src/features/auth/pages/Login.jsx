import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { loginUser } from '../api/authApi.js'
import Logo from '../../../shared/components/common/Logo.jsx'
import { useTheme } from '../../theme/context/ThemeContext.jsx'

const initialForm = { email: '', password: '' }

export default function Login() {
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const { theme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  function handleChange(event) {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
    setStatus({ type: '', message: '' })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const errors = {}
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Enter a valid email address.'
    if (!form.password) errors.password = 'Enter your password.'
    if (Object.keys(errors).length) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setStatus({ type: '', message: '' })
    setIsLoggingIn(true)
    try {

      const response = await loginUser(form)
      const account = response.data?.user
      if (account) {
        const email = account.email || form.email
        const name = [account.Fullname?.firstname, account.Fullname?.lastname].filter(Boolean).join(' ') || email.split('@')[0]
        const profileImage = typeof account.profileImage === 'string' ? account.profileImage.trim() : ''
        localStorage.setItem('loopify_user', JSON.stringify({ name, email, role: account.role || 'user', profileImage }))
      }

      window.dispatchEvent(new Event('loopify:auth-changed'))
      setStatus({ type: 'success', message: 'Logged in successfully.' })
      const returnTo = location.state?.from
      navigate(typeof returnTo === 'string' && returnTo.startsWith('/') ? returnTo : '/', { replace: true })
    } catch (error) {
      const backendErrors = error.response?.data?.errors
      if (Array.isArray(backendErrors) && backendErrors.length) {
        const mappedErrors = {}
        backendErrors.forEach(({ path, param, msg }) => {
          const field = path || param
          if (field in form) mappedErrors[field] = msg
        })
        if (Object.keys(mappedErrors).length) {
          setFieldErrors(mappedErrors)
          return
        }
      }
      const message = isAxiosError(error)
        ? error.response?.data?.message || error.response?.data?.msg || 'Invalid email or password.'
        : 'Something went wrong. Please try again.'
      setFieldErrors({ password: message })
    } finally {
      setIsLoggingIn(false)
    }
  }
  async function HandleGooleAuth() {
   window.location.href =`${import.meta.env.VITE_AUTH_API_URL}/api/auth/google`;
  }

  return (
    <div className={`auth-shell ${theme}-theme`}>
      <aside className="auth-aside">
        <Link className="brand" to="/">
          <Logo size="sm" />
        </Link>
        <div className="aside-copy">
          <span className="eyebrow">YOUR SOUND, IN MOTION</span>
          <h2>Find the rhythm that follows you.</h2>
          <p>Pick up where you left off and let your next favorite track find you.</p>
        </div>
        <span className="aside-foot">A better way to listen.</span>
      </aside>

      <main className="auth-main">
        <section className="auth-card">
          <span className="eyebrow">WELCOME BACK</span>
          <h1>Log in to Loopify</h1>
          <p className="auth-subtitle">Your playlists are waiting for you.</p>
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label htmlFor="email">Email address</label>
            <input id="email" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'email-error' : undefined} className={fieldErrors.email ? 'input-error' : ''} />
            {fieldErrors.email && <p className="field-error" id="email-error">{fieldErrors.email}</p>}
            <div className="label-row">
              <label htmlFor="password">Password</label>
              <Link className="forgot-password-link" to="/forgot-password">Forgot password?</Link>
            </div>
            <div className="auth-password-field">
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={form.password} onChange={handleChange} required aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? 'password-error' : undefined} className={fieldErrors.password ? 'input-error' : ''} />
              <button className="auth-password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                {showPassword ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.8 10.8 0 0 1 12 5c5.2 0 9 5.2 9 7a9.7 9.7 0 0 1-2.4 3.6M6.2 6.2C4.2 7.5 3 10.1 3 12c0 1.8 3.8 7 9 7 1 0 2-.2 2.8-.5" /></svg> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12s3.2-7 9-7 9 7 9 7-3.2 7-9 7-9-7-9-7Z" /><circle cx="12" cy="12" r="3" /></svg>}
              </button>
            </div>
            {fieldErrors.password && <p className="field-error" id="password-error">{fieldErrors.password}</p>}
            {status.message && <p role="alert" className={`auth-status auth-status-${status.type}`}>{status.message}</p>}
            <button className="button button-primary button-wide" type="submit" disabled={isLoggingIn}>
              {isLoggingIn ? 'Logging in...' : 'Log in'}
            </button>
            <button onClick={HandleGooleAuth} className="google-button" type="button">
              <span className="google-mark" aria-hidden="true">G</span>
              Continue with Google
            </button>
          </form>
          <p className="auth-switch">New to Loopify? <Link to="/register">Create an account</Link></p>
        </section>
        <p className="auth-legal">By continuing, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</p>
      </main>
    </div>
  )
}
