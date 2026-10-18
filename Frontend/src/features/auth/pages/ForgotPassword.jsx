import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { requestPasswordReset, resetPassword as submitPasswordReset } from '../api/authApi.js'
import Logo from '../../../shared/components/common/Logo.jsx'
import { useTheme } from '../../theme/context/ThemeContext.jsx'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [errors, setErrors] = useState({})
  const { theme } = useTheme()
  const navigate = useNavigate()

  async function requestOtp(event) {
    event.preventDefault()
    const cleanEmail = email.trim()
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setErrors({ email: 'Enter a valid email address.' })
      return
    }
    setBusy(true)
    setErrors({})
    setStatus({ type: '', message: '' })
    try {
      const response = await requestPasswordReset(cleanEmail)
      setEmail(cleanEmail)
      setOtpSent(true)
      setStatus({ type: 'success', message: response.data?.msg || 'OTP sent. Check your email.' })
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.msg || error.response?.data?.message || 'Could not send OTP. Please try again.' })
    } finally {
      setBusy(false)
    }
  }

  async function resetPassword(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!/^\d{6}$/.test(otp.trim())) nextErrors.otp = 'Enter the 6-digit code from your email.'
    if (password.length < 6) nextErrors.password = 'Password must be at least 6 characters.'
    if (password !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.'
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }
    setBusy(true)
    setErrors({})
    setStatus({ type: '', message: '' })
    try {
      const response = await submitPasswordReset({ email, otp: otp.trim(), password })
      setStatus({ type: 'success', message: response.data?.msg || 'Password changed. You can log in now.' })
      window.setTimeout(() => navigate('/login'), 1000)
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.msg || error.response?.data?.message || 'Unable to reset password. Request a new code and try again.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`auth-shell ${theme}-theme`}>
      <aside className="auth-aside">
        <Link className="brand" to="/"><Logo size="sm" /></Link>
        <div className="aside-copy">
          <span className="eyebrow">ACCOUNT RECOVERY</span>
          <h2>Back to the music you love.</h2>
          <p>Verify your email with a one-time code, then choose a new password.</p>
        </div>
        <span className="aside-foot">A better way to listen.</span>
      </aside>
      <main className="auth-main">
        <section className="auth-card">
          <span className="eyebrow">{otpSent ? 'VERIFY YOUR EMAIL' : 'PASSWORD RESET'}</span>
          <h1>{otpSent ? 'Enter your code' : 'Forgot your password?'}</h1>
          <p className="auth-subtitle">{otpSent ? `We sent a 6-digit code to ${email}.` : 'Enter your account email and we’ll send you a reset code.'}</p>
          {!otpSent ? (
            <form className="auth-form" onSubmit={requestOtp} noValidate>
              <label htmlFor="reset-email">Email address</label>
              <input id="reset-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => { setEmail(event.target.value); setErrors({}); setStatus({ type: '', message: '' }) }} aria-invalid={Boolean(errors.email)} className={errors.email ? 'input-error' : ''} />
              {errors.email && <p className="field-error">{errors.email}</p>}
              {status.message && <p role="alert" className={`auth-status auth-status-${status.type}`}>{status.message}</p>}
              <button className="button button-primary button-wide" type="submit" disabled={busy}>{busy ? 'Sending code...' : 'Send reset code'}</button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={resetPassword} noValidate>
              <label htmlFor="reset-otp">6-digit code</label>
              <input id="reset-otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" value={otp} onChange={(event) => { setOtp(event.target.value.replace(/\D/g, '').slice(0, 6)); setErrors((current) => ({ ...current, otp: '' })) }} aria-invalid={Boolean(errors.otp)} className={errors.otp ? 'input-error' : ''} />
              {errors.otp && <p className="field-error">{errors.otp}</p>}
              <label htmlFor="new-password">New password</label>
              <input id="new-password" type="password" autoComplete="new-password" placeholder="At least 6 characters" value={password} onChange={(event) => { setPassword(event.target.value); setErrors((current) => ({ ...current, password: '' })) }} aria-invalid={Boolean(errors.password)} className={errors.password ? 'input-error' : ''} />
              {errors.password && <p className="field-error">{errors.password}</p>}
              <label htmlFor="confirm-password">Confirm new password</label>
              <input id="confirm-password" type="password" autoComplete="new-password" placeholder="Re-enter your password" value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setErrors((current) => ({ ...current, confirmPassword: '' })) }} aria-invalid={Boolean(errors.confirmPassword)} className={errors.confirmPassword ? 'input-error' : ''} />
              {errors.confirmPassword && <p className="field-error">{errors.confirmPassword}</p>}
              {status.message && <p role="alert" className={`auth-status auth-status-${status.type}`}>{status.message}</p>}
              <button className="button button-primary button-wide" type="submit" disabled={busy}>{busy ? 'Updating password...' : 'Change password'}</button>
              <button className="reset-resend" type="button" disabled={busy} onClick={requestOtp}>Send a new code</button>
            </form>
          )}
          <p className="auth-switch"><Link to="/login">Back to log in</Link></p>
        </section>
        <p className="auth-legal">Reset codes expire after 5 minutes.</p>
      </main>
    </div>
  )
}
