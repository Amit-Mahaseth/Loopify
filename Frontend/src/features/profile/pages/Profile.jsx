import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAuthStatus } from '../../auth/api/authStatus.js'
import { updateProfile } from '../api/profileApi.js'
import Logo from '../../../shared/components/common/Logo.jsx'
import { useTheme } from '../../theme/context/ThemeContext.jsx'

function getSavedUser() {
  try {
    const cached = localStorage.getItem('loopify_user')
    if (cached) return JSON.parse(cached)
  } catch {
    return null
  }
  return null
}

export default function Profile() {
  const [user, setUser] = useState(getSavedUser)
  const [profileImageFailed, setProfileImageFailed] = useState(false)
  const [selectedProfileImage, setSelectedProfileImage] = useState(null)
  const [profileImagePreview, setProfileImagePreview] = useState('')
  const [removeProfileImage, setRemoveProfileImage] = useState(false)
  const profileImagePreviewUrl = useRef('')
  const profileImageInputRef = useRef(null)
  const toastTimeoutRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [form, setForm] = useState({ firstname: '', lastname: '', role: 'user', profileImage: '', password: '' })
  const { theme } = useTheme()

  useEffect(() => {
    getAuthStatus()
      .then(({ data }) => {
        if (data.user) {
          setUser(data.user)
          setProfileImageFailed(false)
          localStorage.setItem('loopify_user', JSON.stringify(data.user))
          const [firstname = '', ...rest] = (data.user.name || '').split(' ')
          setForm({ firstname, lastname: rest.join(' '), role: data.user.role || 'user', password: '' })
        }
      })
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => () => {
    if (profileImagePreviewUrl.current) URL.revokeObjectURL(profileImagePreviewUrl.current)
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current)
  }, [])

  function clearSelectedProfileImage() {
    if (profileImagePreviewUrl.current) URL.revokeObjectURL(profileImagePreviewUrl.current)
    profileImagePreviewUrl.current = ''
    setSelectedProfileImage(null)
    setProfileImagePreview('')
  }

  function startEditing() {
    const [firstname = '', ...rest] = (user?.name || '').split(' ')
    setForm({
      firstname,
      lastname: rest.join(' '),
      role: user?.role || 'user',
      password: ''
    })
    clearSelectedProfileImage()
    setRemoveProfileImage(false)
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current)
    setFieldErrors({})
    setStatus({ type: '', message: '' })
    setIsEditing(true)
  }

  function showToast(type, message) {
    setStatus({ type, message })
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current)
    toastTimeoutRef.current = window.setTimeout(() => setStatus({ type: '', message: '' }), 4000)
  }

  function openProfileImagePicker() {
    profileImageInputRef.current?.click()
  }

  function handleProfileImageChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 1024 * 1024) {
      clearSelectedProfileImage()
      setRemoveProfileImage(false)
      setFieldErrors((current) => ({
        ...current,
        profileImage: file.size > 1024 * 1024
          ? 'Choose an image that is 1 MB or smaller.'
          : 'Choose a JPEG, PNG, or WebP image.'
      }))
      event.target.value = ''
      return
    }
    clearSelectedProfileImage()
    const previewUrl = URL.createObjectURL(file)
    profileImagePreviewUrl.current = previewUrl
    setSelectedProfileImage(file)
    setProfileImagePreview(previewUrl)
    setRemoveProfileImage(false)
    setProfileImageFailed(false)
    setFieldErrors((current) => ({ ...current, profileImage: '' }))
    event.target.value = ''
  }

  function removeProfilePhoto() {
    clearSelectedProfileImage()
    setRemoveProfileImage(true)
    setProfileImageFailed(false)
  }

  async function handleSave(event) {
    event.preventDefault()
    const errors = {}
    if (!form.firstname.trim()) errors.firstname = 'Enter your first name.'
    if (!form.lastname.trim()) errors.lastname = 'Enter your last name.'
    if (form.password && form.password.length < 6) errors.password = 'Password must be at least 6 characters.'
    if (Object.keys(errors).length) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setStatus({ type: '', message: '' })
    setIsSaving(true)
    try {
      const updateForm = new FormData()
      updateForm.append('Fullname[firstname]', form.firstname.trim())
      updateForm.append('Fullname[lastname]', form.lastname.trim())
      updateForm.append('role', form.role)
      if (selectedProfileImage) updateForm.append('profileImage', selectedProfileImage)
      if (removeProfileImage) updateForm.append('removeProfileImage', 'true')
      if (form.password) updateForm.append('password', form.password)
      const { data } = await updateProfile(updateForm)
      const updated = data.user
      const nextUser = {
        ...user,
        name: [updated?.Fullname?.firstname || form.firstname.trim(), updated?.Fullname?.lastname || form.lastname.trim()].filter(Boolean).join(' '),
        email: updated?.email || user.email,
        role: updated?.role || user.role,
        profileImage: typeof updated?.profileImage === 'string' ? updated.profileImage : user?.profileImage || '',
      }
      setUser(nextUser)
      clearSelectedProfileImage()
      setRemoveProfileImage(false)
      setProfileImageFailed(false)
      localStorage.setItem('loopify_user', JSON.stringify(nextUser))
      window.dispatchEvent(new CustomEvent('loopify:user-updated', { detail: nextUser }))
      setIsEditing(false)
      showToast('success', 'Your profile has been updated.')
    } catch (error) {
      const backendErrors = error.response?.data?.errors
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
      const message = error.response?.data?.msg || error.response?.data?.message ||
        (error.response ? 'Unable to update your profile.' : 'Cannot reach the server. Check that the backend is running.')
      showToast('error', message)
    } finally {
      setIsSaving(false)
    }
  }

  const initials = (user?.name || user?.email || 'U').slice(0, 1).toUpperCase()
  const profileImage = typeof user?.profileImage === 'string' ? user.profileImage.trim() : ''
  const displayedProfileImage = profileImagePreview || (removeProfileImage ? '' : profileImage)
  const hasProfileImage = Boolean(displayedProfileImage && !profileImageFailed)
  const avatarImage = hasProfileImage
    ? <img src={displayedProfileImage} alt="" onError={() => setProfileImageFailed(true)} />
    : initials

  return (
    <main className={`profile-page ${theme}-theme`}>
      <header className="profile-page-header">
        <Link className="brand" to="/" aria-label="Loopify home"><Logo size="sm" /></Link>
        <Link className="profile-back-link back-navigation-link" to="/"><span className="back-navigation-arrow" aria-hidden="true">←</span> Back to home</Link>
      </header>
      <section className="profile-page-content">
        <span className="eyebrow">YOUR ACCOUNT</span>
        <h1>Profile</h1>
        {isLoading ? <div className="profile-page-card" aria-live="polite">Loading profile...</div>
          : user ? <article className="profile-page-card">
            <div className="profile-page-identity">
              <div className={`profile-photo-control${isEditing ? ' is-editing' : ''}`}>
                {isEditing ? <button
                  className={`profile-page-avatar${isSaving ? ' is-uploading' : ''}`}
                  type="button"
                  aria-label="Change profile photo"
                  aria-busy={isSaving}
                  aria-describedby={fieldErrors.profileImage ? 'profile-image-error' : 'profile-image-help'}
                  onClick={openProfileImagePicker}
                  disabled={isSaving}
                >
                  {avatarImage}
                  <span className="profile-avatar-overlay" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4h-4L8 7H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2-3Z" /><circle cx="12" cy="13" r="3" /></svg>
                    <span>Change</span>
                  </span>
                  <span className="profile-avatar-camera-badge" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4h-4L8 7H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2-3Z" /><circle cx="12" cy="13" r="3" /></svg>
                  </span>
                  {isSaving && <span className="profile-avatar-spinner" aria-hidden="true" />}
                </button> : <span className="profile-page-avatar is-readonly" aria-hidden="true">{avatarImage}</span>}
                {isEditing && <span className="profile-image-help" id="profile-image-help">JPEG, PNG, or WebP up to 1 MB</span>}
                {isEditing && profileImage && !removeProfileImage && <button className="profile-photo-remove" type="button" onClick={removeProfilePhoto}>Remove photo</button>}
                {fieldErrors.profileImage && <p className="field-error profile-photo-error" id="profile-image-error" role="alert">{fieldErrors.profileImage}</p>}
              </div>
              <div><h2>{user.name || 'Loopify listener'}</h2><p>{user.role || 'user'} account</p></div>
              {!isEditing && <button className="button button-small profile-edit-button" type="button" onClick={startEditing}>Edit profile</button>}
            </div>
            <input ref={profileImageInputRef} id="profile-image" type="file" accept="image/jpeg,image/png,image/webp" className="profile-image-input" aria-describedby={fieldErrors.profileImage ? 'profile-image-error' : 'profile-image-help'} onChange={handleProfileImageChange} />
            {isEditing ? <form className="profile-edit-form" onSubmit={handleSave}>
              <label htmlFor="profile-firstname">First name</label>
              <input id="profile-firstname" name="firstname" autoComplete="given-name" required value={form.firstname} onChange={(event) => { setForm({ ...form, firstname: event.target.value }); setFieldErrors((current) => ({ ...current, firstname: '' })) }} aria-invalid={Boolean(fieldErrors.firstname)} aria-describedby={fieldErrors.firstname ? 'profile-firstname-error' : undefined} className={fieldErrors.firstname ? 'input-error' : ''} />
              {fieldErrors.firstname && <p className="field-error" id="profile-firstname-error">{fieldErrors.firstname}</p>}
              <label htmlFor="profile-lastname">Last name</label>
              <input id="profile-lastname" name="lastname" autoComplete="family-name" required value={form.lastname} onChange={(event) => { setForm({ ...form, lastname: event.target.value }); setFieldErrors((current) => ({ ...current, lastname: '' })) }} aria-invalid={Boolean(fieldErrors.lastname)} aria-describedby={fieldErrors.lastname ? 'profile-lastname-error' : undefined} className={fieldErrors.lastname ? 'input-error' : ''} />
              {fieldErrors.lastname && <p className="field-error" id="profile-lastname-error">{fieldErrors.lastname}</p>}
              <fieldset className="profile-role-options">
                <legend>Account type</legend>
                <label><input type="radio" name="role" value="user" checked={form.role === 'user'} onChange={(event) => setForm({ ...form, role: event.target.value })} /> User</label>
                <label><input type="radio" name="role" value="artist" checked={form.role === 'artist'} onChange={(event) => setForm({ ...form, role: event.target.value })} /> Artist</label>
              </fieldset>
              <label htmlFor="profile-password">New password (optional)</label>
              <div className="profile-password-field">
                <input id="profile-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.password} onChange={(event) => { setForm({ ...form, password: event.target.value }); setFieldErrors((current) => ({ ...current, password: '' })) }} aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? 'profile-password-error' : undefined} className={fieldErrors.password ? 'input-error' : ''} />
                <button className="profile-password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.2 0 9 5.2 9 7a9.7 9.7 0 0 1-2.4 3.6M6.2 6.2C4.2 7.5 3 10.1 3 12c0 1.8 3.8 7 9 7 1 0 2-.2 2.8-.5" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12s3.2-7 9-7 9 7 9 7-3.2 7-9 7-9-7-9-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && <p className="field-error" id="profile-password-error">{fieldErrors.password}</p>}
              <div className="profile-edit-actions">
                <button className="button button-primary" type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save changes'}</button>
                <button className="button profile-cancel-button" type="button" onClick={() => {
                  clearSelectedProfileImage()
                  setRemoveProfileImage(false)
                  setProfileImageFailed(false)
                  setIsEditing(false)
                  setStatus({ type: '', message: '' })
                }} disabled={isSaving}>Cancel</button>
              </div>
            </form> : <dl className="profile-page-details">
              <div><dt>Full name</dt><dd>{user.name || 'Not provided'}</dd></div>
              <div><dt>Email address</dt><dd>{user.email || 'Not provided'}</dd></div>
              <div><dt>Account type</dt><dd>{user.role || 'User'}</dd></div>
            </dl>}
            {status.message && <p className={`profile-toast profile-toast-${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>{status.message}</p>}
          </article> : <article className="profile-page-card profile-empty">
            <h2>You are not signed in</h2>
            <p>Log in to view your account details.</p>
            <Link className="button" to="/login">Log in</Link>
          </article>}
      </section>
    </main>
  )
}
