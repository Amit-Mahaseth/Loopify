import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { getAuthStatus } from '../../auth/api/authStatus.js'
import { fetchArtistPlaylists } from '../api/artistApi.js'
import { fetchArtistMusic } from '../../music/api/musicApi.js'
import Logo from '../../../shared/components/common/Logo.jsx'
import { usePlayer } from '../../player/context/PlayerContext.jsx'
import { useTheme } from '../../theme/context/ThemeContext.jsx'
import MediaIcon from '../../../shared/components/common/MediaIcon.jsx'
import '../../../styles/artistDashboard.css'

export default function ArtistDashboard() {
  const { theme } = useTheme()
  const [user, setUser] = useState(null)
  const [tracks, setTracks] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const { currentTrack, isPlaying, selectTrack, setQueue, togglePlayback } = usePlayer()

  async function loadTracks() {
    const { data } = await fetchArtistMusic()
    setTracks(data.musics || [])
  }

  async function loadPlaylists() {
    const { data } = await fetchArtistPlaylists()
    setPlaylists(data.playlists || [])
  }

  function playTrack(track) {
    const trackId = track._id || track.musicKey
    const currentTrackId = currentTrack?._id || currentTrack?.musicKey
    if (String(currentTrackId) === String(trackId)) {
      togglePlayback()
      return
    }
    setQueue(tracks)
    selectTrack(track, true)
  }

  useEffect(() => {
    getAuthStatus().then(async ({ data }) => {
      const activeUser = data.user || null
      setUser(activeUser)
      if (activeUser) localStorage.setItem('loopify_user', JSON.stringify(activeUser))
      if (activeUser?.role === 'artist') {
        try {
          await Promise.all([loadTracks(), loadPlaylists()])
        } catch {
          setMessage('Could not load your tracks. Check that the music service is running.')
        }
      }
    }).catch(() => setUser(null)).finally(() => setLoading(false))
  }, [])

  if (!loading && user?.role !== 'artist') return <Navigate to="/" replace />

  const artistName = user?.name || 'Artist'

  return (
    <main className={`artist-dashboard ${theme}-theme`}>
      <header className="artist-dashboard-header">
        <Link className="brand" to="/"><Logo size="sm" /></Link>
        <div className="artist-dashboard-actions">
          <Link className="artist-text-link artist-back-home back-navigation-link" to="/"><span className="back-navigation-arrow" aria-hidden="true">←</span> Back to home</Link>
          <Link className="button button-small" to="/artist/upload">Upload music</Link>
          <Link className="button button-small" to="/artist/playlists/new">Create playlist</Link>
        </div>
      </header>

      {loading ? <section className="artist-empty-state">Loading your artist space...</section>
        : <div className="artist-dashboard-content">
          <section className="artist-hero">
            <div className="artist-hero-copy">
              <span className="eyebrow">ARTIST DASHBOARD</span>
              <h1>Welcome back, {artistName.split(' ')[0]}.</h1>
              <p>Your creative space. Keep sharing your sound with the world.</p>
              <div className="artist-stats">
                <div className="artist-stat-card"><strong>{tracks.length}</strong><span>Tracks uploaded</span></div>
                <div className="artist-stat-card"><strong>{playlists.length}</strong><span>Playlists created</span></div>
                <div className="artist-stat-card"><strong>{tracks.length ? 'Live' : 'Ready'}</strong><span>Artist status</span></div>
              </div>
            </div>
            <div className="artist-hero-art" aria-hidden="true">
              <span className="artist-hero-orbit artist-hero-orbit-one" />
              <span className="artist-hero-orbit artist-hero-orbit-two" />
              <div className="artist-hero-vinyl">
                <span className="artist-hero-vinyl-center">L</span>
              </div>
              <div className="artist-hero-wave">
                {Array.from({ length: 21 }, (_, index) => <span key={index} />)}
              </div>
              <span className="artist-hero-art-label">MADE TO BE HEARD</span>
            </div>
          </section>

          <section className="artist-panel artist-catalog-panel">
            <div className="artist-panel-heading"><div><span className="eyebrow">YOUR CATALOG</span><h2>Published tracks</h2></div><span className="artist-track-count">{tracks.length} total</span></div>
            {tracks.length ? <div className="artist-track-list">{tracks.map(track => {
              const trackId = track._id || track.musicKey
              const isCurrentTrack = String(currentTrack?._id || currentTrack?.musicKey) === String(trackId)
              const isCurrentPlaying = isCurrentTrack && isPlaying
              return <article className="artist-track" key={trackId}><img src={track.musicCoverImageUrl} alt="" /><div><strong>{track.title}</strong><span>{track.artist || artistName}</span></div><button type="button" onClick={() => playTrack(track)} aria-label={`${isCurrentPlaying ? 'Pause' : 'Play'} ${track.title}`}>{isCurrentPlaying ? 'Pause' : 'Play'}</button></article>
            })}</div>
              : <div className="artist-catalog-empty"><span aria-hidden="true"><MediaIcon /></span><p>You have not uploaded a track yet.</p><small>Your releases will appear here once published.</small></div>}
            {message && <p className="artist-message">{message}</p>}
          </section>
          <section className="artist-panel artist-playlists-panel">
            <div className="artist-panel-heading"><div><span className="eyebrow">YOUR PLAYLISTS</span><h2>Created playlists</h2></div><span className="artist-track-count">{playlists.length} total</span></div>
            {playlists.length ? <div className="artist-playlist-grid">{playlists.map(playlist => <Link className="artist-playlist-card" key={playlist._id} to={`/playlist/${playlist._id}`}><div className="artist-playlist-cover">{playlist.coverImageUrl ? <img src={playlist.coverImageUrl} alt="" /> : <span aria-hidden="true"><MediaIcon type="playlist" size={32} /></span>}</div><div><strong>{playlist.title}</strong><span>{playlist.musics?.length || 0} tracks</span></div></Link>)}</div>
              : <div className="artist-catalog-empty"><span aria-hidden="true"><MediaIcon type="playlist" /></span><p>You have not created a playlist yet.</p><small>Use Create playlist to group your tracks.</small></div>}
          </section>
        </div>}
    </main>
  )
}
