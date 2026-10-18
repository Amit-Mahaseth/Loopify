import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { fetchMusicCatalog } from '../api/musicApi.js'
import '../../../styles/musicPlayer.css'
import { usePlayer, usePlayerProgress } from '../../player/context/PlayerContext.jsx'
import { useMusicCatalog } from '../context/MusicCatalogContext.jsx'
import { useLikes } from '../../likes/context/LikesContext.jsx'
import { useTheme } from '../../theme/context/ThemeContext.jsx'
import Logo from '../../../shared/components/common/Logo.jsx'

function getTrackId(track) {
  return track?._id || track?.musicId || track?.id || track?.musicKey
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${remainingSeconds}`
}

export default function MusicPlayer() {
  const { theme } = useTheme()
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const handledRemotePlaybackRef = useRef(null)
  const remotePlaybackToken = location.state?.remotePlaybackToken
  const remotePlaybackMode = location.state?.remotePlaybackMode
  const remotePlaybackPosition = location.state?.remotePlaybackPosition
  const [status, setStatus] = useState('loading')
  const { tracks: cachedTracks, setTracks: setCachedTracks } = useMusicCatalog()
  const { currentTrack, isPlaying, volume, speed, playbackError, selectTrack, playFromRemote, togglePlayback: togglePlayerPlayback, seek, setVolume, setSpeed, setQueue, canPlayPrevious, canPlayNext } = usePlayer()
  const { currentTime, duration } = usePlayerProgress()
  const { likedSongIds, toggleLike } = useLikes()

  useEffect(() => {
    let cancelled = false
    if (cachedTracks !== null) {
      setQueue(cachedTracks)
      const selectedTrack = cachedTracks.find(item => String(getTrackId(item)) === id)
      if (selectedTrack && remotePlaybackMode === 'resume' && remotePlaybackToken && handledRemotePlaybackRef.current !== remotePlaybackToken
        && String(getTrackId(currentTrack)) === String(getTrackId(selectedTrack))) {
        handledRemotePlaybackRef.current = remotePlaybackToken
        playFromRemote(remotePlaybackPosition)
      } else if (selectedTrack && remotePlaybackMode && remotePlaybackToken && handledRemotePlaybackRef.current !== remotePlaybackToken) {
        handledRemotePlaybackRef.current = remotePlaybackToken
        selectTrack(selectedTrack, true, false)
      } else if (selectedTrack && String(getTrackId(currentTrack)) !== String(getTrackId(selectedTrack))) {
        selectTrack(selectedTrack, true)
      }
      return () => { cancelled = true }
    }

    fetchMusicCatalog()
      .then(({ data }) => {
        if (cancelled) return
        setCachedTracks(Array.isArray(data.musics) ? data.musics : [])
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => { cancelled = true }
  }, [cachedTracks, currentTrack, id, playFromRemote, remotePlaybackMode, remotePlaybackPosition, remotePlaybackToken, selectTrack, setCachedTracks, setQueue])

  const displayedTrack = cachedTracks?.find(item => String(getTrackId(item)) === id) || null
  const displayedStatus = cachedTracks === null ? status : displayedTrack ? 'ready' : 'missing'

  function togglePlayback() {
    const currentTrackId = getTrackId(currentTrack)
    const selectedTrackId = getTrackId(displayedTrack)
    if (String(currentTrackId) !== String(selectedTrackId)) selectTrack(displayedTrack, true)
    else togglePlayerPlayback()
  }

  function changeProgress(event) {
    const nextTime = Number(event.target.value)
    seek(nextTime)
  }

  function changeVolume(event) {
    const nextVolume = Number(event.target.value)
    setVolume(nextVolume)
  }

  function switchTrack(direction) {
    const trackIndex = cachedTracks.findIndex(item => String(getTrackId(item)) === id)
    const nextTrack = cachedTracks[trackIndex + direction]
    if (!nextTrack) return
    selectTrack(nextTrack, true)
    navigate(`/music/${encodeURIComponent(String(getTrackId(nextTrack)))}`)
  }

  if (displayedStatus === 'loading') return <main className={`music-player-page ${theme}-theme`}><p className="music-player-state">Loading song...</p></main>
  if (displayedStatus !== 'ready') return <main className={`music-player-page ${theme}-theme`}><section className="music-player-state"><h1>{displayedStatus === 'missing' ? 'Song not found' : 'Could not load this song'}</h1><Link className="button" to="/">Back to home</Link></section></main>

  const isLiked = likedSongIds.includes(String(getTrackId(displayedTrack)))

  return <main className={`music-player-page ${theme}-theme`}>
    <header className="music-player-header"><Link className="music-player-back back-navigation-link" to="/"><span className="back-navigation-arrow" aria-hidden="true">←</span> Back to home</Link><Link className="brand" to="/"><Logo size="sm" /></Link></header>
    <section className={`music-player-card ${isPlaying ? 'is-playing' : ''}`}>
      <div className={`music-player-art ${isPlaying ? 'is-playing' : ''}`}>{displayedTrack.musicCoverImageUrl ? <img src={displayedTrack.musicCoverImageUrl} alt={`${displayedTrack.title} cover`} /> : <span>♫</span>}</div>
      <div className="music-player-content">
        <div className="now-playing-badge-row">
          <span className="eyebrow">NOW PLAYING</span>
          {isPlaying && (
            <span className="music-player-eq-pill" aria-label="Audio playing">
              <span className="eq-bar bar-1" />
              <span className="eq-bar bar-2" />
              <span className="eq-bar bar-3" />
              <span className="eq-bar bar-4" />
            </span>
          )}
        </div>
        <h1>{displayedTrack.title}</h1>
        <div className="song-detail-meta"><p>{displayedTrack.artist || 'Unknown artist'}</p><button className={`like-song-button ${isLiked ? 'liked' : ''}`} type="button" onClick={() => toggleLike(displayedTrack)} aria-pressed={isLiked}>{isLiked ? '♥ Liked' : '♡ Like song'}</button></div>
        <div className="player-progress"><span>{formatTime(currentTime)}</span><input aria-label="Song progress" type="range" min="0" max={duration || 0} step="0.1" value={Math.min(currentTime, duration || 0)} onChange={changeProgress} /><span>{formatTime(duration)}</span></div>
        {playbackError && <p className="music-player-state" role="status">{playbackError}</p>}
        <div className="player-controls">
          <div className="player-track-navigation" aria-label="Song navigation">
            <button className="player-track-button" type="button" onClick={() => switchTrack(-1)} disabled={!canPlayPrevious} aria-label="Play previous song" title="Previous song">|◀</button>
            <button className="player-main-button" type="button" onClick={togglePlayback} aria-label={isPlaying ? 'Pause song' : 'Play song'}>{isPlaying ? 'Ⅱ' : '▶'}</button>
            <button className="player-track-button" type="button" onClick={() => switchTrack(1)} disabled={!canPlayNext} aria-label="Play next song" title="Next song">▶|</button>
          </div>
          <label className="player-volume"><span>Volume</span><input aria-label="Volume" type="range" min="0" max="1" step="0.05" value={volume} onChange={changeVolume} /></label>
          <label className="player-speed"><span>Speed</span><select value={speed} onChange={event => setSpeed(Number(event.target.value))}>{[0.75, 1, 1.25, 1.5, 2].map(value => <option key={value} value={value}>{value}x</option>)}</select></label>
        </div>
      </div>
    </section>
  </main>
}
