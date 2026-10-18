import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { getAuthStatus } from '../../auth/api/authStatus.js'
import { fetchArtistMusic } from '../../music/api/musicApi.js'
import { createPlaylist } from '../api/playlistApi.js'
import Logo from '../../../shared/components/common/Logo.jsx'
import { useTheme } from '../../theme/context/ThemeContext.jsx'
import '../../../styles/artistUpload.css'
import '../../../styles/playlist.css'

export default function CreatePlaylist() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [tracks, setTracks] = useState([])
  const [selected, setSelected] = useState([])
  const [title, setTitle] = useState('')
  const [coverImage, setCoverImage] = useState(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview)
  }, [coverPreview])

  useEffect(() => {
    getAuthStatus().then(async ({ data }) => {
      setUser(data.user || null)
      if (data.user?.role === 'artist') {
        const response = await fetchArtistMusic()
        setTracks(response.data.musics || [])
      }
    }).catch(() => setUser(null)).finally(() => setLoading(false))
  }, [])

  function toggleTrack(track) {
    const id = track._id || track.musicKey
    setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])
  }

  function selectCoverImage(file) {
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverImage(file || null)
    setCoverPreview(file ? URL.createObjectURL(file) : '')
  }

  function removeCoverImage() {
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverImage(null)
    setCoverPreview('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!title.trim() || !selected.length) {
      setMessage('Enter a playlist name and select at least one track.')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      const data = new FormData()
      data.append('title', title.trim())
      selected.forEach(trackId => data.append('musics', trackId))
      if (coverImage) data.append('coverImage', coverImage)
      await createPlaylist(data)
      navigate('/artist/dashboard', { replace: true })
    } catch (error) {
      setMessage(error.response?.data?.msg || 'Could not create the playlist. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!loading && user?.role !== 'artist') return <Navigate to="/" replace />

  return <main className={`artist-dashboard music-upload-page ${theme}-theme`}>
    <header className="artist-dashboard-header">
      <Link className="brand" to="/" aria-label="Loopify home"><Logo size="sm" /></Link>
      <Link className="artist-text-link back-navigation-link" to="/artist/dashboard"><span className="back-navigation-arrow" aria-hidden="true">←</span> Back to dashboard</Link>
    </header>
    {loading ? <section className="artist-empty-state">Loading your music...</section>
      : <section className="music-upload-card"><span className="eyebrow">NEW PLAYLIST</span><h1>Create a playlist</h1><p>Give your playlist a name and choose tracks from your catalog.</p>
        <form className="music-upload-form" onSubmit={handleSubmit}>
          <label htmlFor="playlist-title">Playlist name<input id="playlist-title" value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. Night drives" required /></label>
          <div className="file-field"><span>Playlist cover image <small>(optional)</small></span>{coverImage ? <div className="selected-file selected-image"><img src={coverPreview} alt="Playlist cover preview" /><div><strong>{coverImage.name}</strong><small>Playlist cover selected</small></div><button type="button" onClick={removeCoverImage}>Cancel</button></div> : <label className="file-picker" htmlFor="playlist-cover"><span>Select cover image</span><small>Choose a JPG, PNG, or WEBP image</small><input id="playlist-cover" type="file" accept="image/*" onChange={event => selectCoverImage(event.target.files?.[0])} /></label>}</div>
          <div className="playlist-selector"><span>Select tracks ({selected.length})</span>{tracks.length ? tracks.map(track => { const id = track._id || track.musicKey; return <label className="playlist-track" key={id}><input type="checkbox" checked={selected.includes(id)} onChange={() => toggleTrack(track)} /><img src={track.musicCoverImageUrl} alt="" /><span><strong>{track.title}</strong><small>{track.artist}</small></span></label> }) : <p>No uploaded tracks yet. <Link to="/artist/upload">Upload a track</Link> before creating a playlist.</p>}</div>
          {message && <p className="artist-message" role="alert">{message}</p>}
          <button className="button" type="submit" disabled={saving || !tracks.length}>{saving ? 'Creating...' : 'Create playlist'}</button>
        </form>
      </section>}
  </main>
}
