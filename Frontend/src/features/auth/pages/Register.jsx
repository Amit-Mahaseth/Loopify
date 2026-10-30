import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '../api/authApi.js'
import Logo from '../../../shared/components/common/Logo.jsx'
import { useTheme } from '../../theme/context/ThemeContext.jsx'

const initialForm = {
  firstname: '',
  lastname: '',
  email: '',
  password: '',
  role: 'user',
}

export default function Register() {
  const [form, setForm] = useState(initialForm)
  const navigate = useNavigate()
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const { theme } = useTheme()

  function handleChange(event) {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
    setStatus({ type: '', message: '' })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const errors = {}
    if (!form.firstname.trim()) errors.firstname = 'Enter your first name.'
    if (!form.lastname.trim()) errors.lastname = 'Enter your last name.'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Enter a valid email address.'
    if (form.password.length < 6) errors.password = 'Password must be at least 6 characters.'
    if (Object.keys(errors).length) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setStatus({ type: '', message: '' })
    setIsSubmitting(true)

    try {
      await registerUser({
        email: form.email,
        password: form.password,
        Fullname: {
          firstname: form.firstname,
          lastname: form.lastname,
        },
        role: form.role,
      })

      setStatus({ type: 'success', message: 'Account created successfully. You can now log in.' })
      setForm(initialForm)
      navigate('/login')
    } catch (error) {
      const data = error.response?.data
      const backendErrors = data?.errors
      if (Array.isArray(backendErrors) && backendErrors.length) {
        const mappedErrors = {}
        backendErrors.forEach(({ path, param, msg }) => {
          const field = path || param
          const mappedField = field === 'Fullname.firstname' ? 'firstname' : field === 'Fullname.lastname' ? 'lastname' : field
          if (mappedField in form) mappedErrors[mappedField] = msg
        })
        if (Object.keys(mappedErrors).length) {
          setFieldErrors(mappedErrors)
          return
        }
      }
      const message = data?.errors?.map((item) => item.msg).join(', ') ||
        data?.msg || data?.message ||
        (error.response ? 'Unable to create your account.' : 'Cannot reach the server. Check that the backend is running.')
      setStatus({ type: 'error', message })
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleGoogleAuth() {
    window.location.href = '/api/auth/google'
  }

  return (
    <div className={`auth-shell register-shell ${theme}-theme`}>
      <aside className="auth-aside">
        <Link className="brand" to="/">
          <Logo size="sm" />
        </Link>
        <div className="auth-aside-glow" aria-hidden="true" />
        <div className="aside-copy">
          <span className="eyebrow">MAKE IT YOURS</span>
          <h2>Your soundtrack starts here.</h2>
          <p>Build a listening space that sounds like you, from the first beat to the last.</p>
        </div>
        <div className="auth-sound-wave" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
        <span className="aside-foot">A better way to listen.</span>
      </aside>

      <main className="auth-main">
        <section className="auth-card register-card">
          <span className="eyebrow">GET STARTED</span>
          <h1>Create your account</h1>
          <p className="auth-subtitle">Join Loopify and make every listen count.</p>
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <fieldset className="name-fields">
              <legend>Your name</legend>
              <input id="first-name" name="firstname" type="text" placeholder="First name" value={form.firstname} onChange={handleChange} required aria-invalid={Boolean(fieldErrors.firstname)} aria-describedby={fieldErrors.firstname ? 'firstname-error' : undefined} className={fieldErrors.firstname ? 'input-error' : ''} />
              <input id="last-name" name="lastname" type="text" placeholder="Last name" value={form.lastname} onChange={handleChange} required aria-invalid={Boolean(fieldErrors.lastname)} aria-describedby={fieldErrors.lastname ? 'lastname-error' : undefined} className={fieldErrors.lastname ? 'input-error' : ''} />
              {fieldErrors.firstname && <p className="field-error" id="firstname-error">{fieldErrors.firstname}</p>}
              {fieldErrors.lastname && <p className="field-error" id="lastname-error">{fieldErrors.lastname}</p>}
            </fieldset>
            <fieldset className="auth-role-options">
              <legend>Account type</legend>
              <label>
                <input type="radio" name="role" value="user" checked={form.role === 'user'} onChange={handleChange} />
                <strong>User</strong>
              </label>
              <label>
                <input type="radio" name="role" value="artist" checked={form.role === 'artist'} onChange={handleChange} />
                <strong>Artist</strong>
              </label>
            </fieldset>
            <label htmlFor="register-email">Email address</label>
            <input id="register-email" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'register-email-error' : undefined} className={fieldErrors.email ? 'input-error' : ''} />
            {fieldErrors.email && <p className="field-error" id="register-email-error">{fieldErrors.email}</p>}
            <label htmlFor="register-password">Password</label>
            <div className="auth-password-field">
              <input id="register-password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Create a password" minLength="6" value={form.password} onChange={handleChange} required aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? 'register-password-error' : undefined} className={fieldErrors.password ? 'input-error' : ''} />
              <button className="auth-password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                {showPassword ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.8 10.8 0 0 1 12 5c5.2 0 9 5.2 9 7a9.7 9.7 0 0 1-2.4 3.6M6.2 6.2C4.2 7.5 3 10.1 3 12c0 1.8 3.8 7 9 7 1 0 2-.2 2.8-.5" /></svg> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12s3.2-7 9-7 9 7 9 7-3.2 7-9 7-9-7-9-7Z" /><circle cx="12" cy="12" r="3" /></svg>}
              </button>
            </div>
            {fieldErrors.password && <p className="field-error" id="register-password-error">{fieldErrors.password}</p>}
            {status.message && <p role="alert" className={`auth-status auth-status-${status.type}`}>{status.message}</p>}
            <button className="button button-primary button-wide" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
            <button onClick={handleGoogleAuth} className="google-button" type="button">
              <span className="google-mark" aria-hidden="true">G</span>
              Continue with Google
            </button>
          </form>
          <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
        </section>
        <p className="auth-legal">By continuing, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</p>
      </main>
    </div>
  )
}
