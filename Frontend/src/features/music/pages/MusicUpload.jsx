import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { getAuthStatus } from '../../auth/api/authStatus.js'
import { uploadMusic } from '../api/musicApi.js'
import Logo from '../../../shared/components/common/Logo.jsx'
import MediaIcon from '../../../shared/components/common/MediaIcon.jsx'
import { useTheme } from '../../theme/context/ThemeContext.jsx'
import { useMusicCatalog } from '../context/MusicCatalogContext.jsx'
import '../../../styles/artistUpload.css'
import '../../../styles/musicPreview.css'

export default function MusicUpload() {
  const { theme } = useTheme()
  const { setTracks } = useMusicCatalog()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ title: '', music: null, coverImage: null })
  const [musicPreview, setMusicPreview] = useState('')
  const [coverPreview, setCoverPreview] = useState('')

  useEffect(() => () => {
    if (musicPreview) URL.revokeObjectURL(musicPreview)
  }, [musicPreview])

  useEffect(() => () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview)
  }, [coverPreview])

  useEffect(() => {
    getAuthStatus().then(({ data }) => {
      setUser(data.user || null)
      if (data.user) localStorage.setItem('loopify_user', JSON.stringify(data.user))
    }).catch(() => setUser(null)).finally(() => setLoading(false))
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.title.trim() || !form.music || !form.coverImage) {
      setMessage('Please provide a title, music file, and cover image.')
      return
    }
    setUploading(true)
    setMessage('')
    const data = new FormData()
    data.append('title', form.title.trim())
    data.append('music', form.music)
    data.append('coverImage', form.coverImage)
    try {
      await uploadMusic(data)
      setTracks(null)
      navigate('/artist/dashboard', { replace: true })
    } catch (error) {
      setMessage(error.response?.data?.msg || 'Could not upload your track. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  function selectCoverImage(file) {
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setForm({ ...form, coverImage: file || null })
    setCoverPreview(file ? URL.createObjectURL(file) : '')
  }

  function selectMusic(file) {
    if (musicPreview) URL.revokeObjectURL(musicPreview)
    setForm({ ...form, music: file || null })
    setMusicPreview(file ? URL.createObjectURL(file) : '')
  }

  function removeMusic() {
    if (musicPreview) URL.revokeObjectURL(musicPreview)
    setMusicPreview('')
    setForm({ ...form, music: null })
  }

  function removeCoverImage() {
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverPreview('')
    setForm({ ...form, coverImage: null })
  }

  if (!loading && user?.role !== 'artist') return <Navigate to="/" replace />

  return <main className={`artist-dashboard music-upload-page ${theme}-theme`}>
    <header className="artist-dashboard-header">
      <Link className="brand" to="/" aria-label="Loopify home">
        <Logo size="sm" />
      </Link>
      <Link className="artist-text-link back-navigation-link" to="/artist/dashboard"><span className="back-navigation-arrow" aria-hidden="true">←</span> Back to dashboard</Link>
    </header>
    {loading ? <section className="artist-empty-state">Loading upload page...</section>
      : <section className="music-upload-card"><span className="eyebrow">NEW RELEASE</span><h1>Upload your music</h1><p>Share a new track with your listeners. Add a title, audio file, and cover image.</p>
        <form className="music-upload-form" onSubmit={handleSubmit}>
          <label htmlFor="music-title">Track title<input id="music-title" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="e.g. Midnight Loop" required /></label>
          <div className="file-field"><span>Music file</span>{form.music ? <div className="selected-file selected-audio"><div className="selected-file-summary"><span className="selected-file-icon" aria-hidden="true"><MediaIcon size={18} /></span><strong>{form.music.name}</strong><button type="button" onClick={removeMusic}>Cancel</button></div><audio controls preload="metadata" src={musicPreview}>Your browser does not support audio preview.</audio></div> : <label className="file-picker" htmlFor="music-file"><span>Select song</span><small>Choose an audio file</small><input id="music-file" type="file" accept="audio/*" onChange={event => selectMusic(event.target.files?.[0])} /></label>}</div>
          <div className="file-field"><span>Cover image</span>{form.coverImage ? <div className="selected-file selected-image"><img src={coverPreview} alt="Selected cover preview" /><div><strong>{form.coverImage.name}</strong><small>Cover image selected</small></div><button type="button" onClick={removeCoverImage}>Cancel</button></div> : <label className="file-picker" htmlFor="cover-image"><span>Select cover image</span><small>Choose a JPG, PNG, or WEBP image</small><input id="cover-image" type="file" accept="image/*" onChange={event => selectCoverImage(event.target.files?.[0])} /></label>}</div>
          {message && <p className="artist-message" role="alert">{message}</p>}
          <button className="button" type="submit" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload music'}</button>
        </form>
      </section>}
  </main>
}
