import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchMusicCatalog } from '../../music/api/musicApi.js'
import Logo from '../../../shared/components/common/Logo.jsx'
import { useTheme } from '../../theme/context/ThemeContext.jsx'
import { fetchPlaylists } from '../api/playlistApi.js'
import '../../../styles/musicPlayer.css'

export default function PlaylistDetail() {
  const { theme } = useTheme()
  const { id } = useParams()
  const [playlist, setPlaylist] = useState(null)
  const [tracks, setTracks] = useState([])
  const [status, setStatus] = useState('loading')
  const displayedPlaylist = playlist
  const displayedTracks = tracks
  const displayedStatus = status

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchPlaylists(),
      fetchMusicCatalog(),
    ]).then(([playlistResponse, musicResponse]) => {
      if (cancelled) return
      const selectedPlaylist = (playlistResponse.data.playlists || []).find(item => String(item._id) === id)
      if (!selectedPlaylist) {
        setStatus('missing')
        return
      }
      const playlistTrackIds = new Set((selectedPlaylist.musics || []).map(item => String(item?._id || item)))
      setPlaylist(selectedPlaylist)
      setTracks((musicResponse.data.musics || []).filter(track => playlistTrackIds.has(String(track._id || track.musicKey))))
      setStatus('ready')
    }).catch(() => {
      if (!cancelled) setStatus('error')
    })
    return () => { cancelled = true }
  }, [id])

  if (displayedStatus === 'loading') return <main className={`music-player-page ${theme}-theme`}><p className="music-player-state">Loading playlist...</p></main>
  if (displayedStatus !== 'ready') return <main className={`music-player-page ${theme}-theme`}><section className="music-player-state"><h1>{displayedStatus === 'missing' ? 'Playlist not found' : 'Could not load this playlist'}</h1><Link className="button" to="/">Back to home</Link></section></main>

  return <main className={`music-player-page ${theme}-theme`}>
    <header className="music-player-header"><Link className="music-player-back back-navigation-link" to="/"><span className="back-navigation-arrow" aria-hidden="true">←</span> Back to home</Link><Link className="brand" to="/"><Logo size="sm" /></Link></header>
    <section className="playlist-detail-hero">
      <div className="playlist-detail-art">{displayedPlaylist.coverImageUrl ? <img src={displayedPlaylist.coverImageUrl} alt={`${displayedPlaylist.title} cover`} /> : <span>≡</span>}</div>
      <div><span className="eyebrow">PLAYLIST</span><h1>{displayedPlaylist.title}</h1><p>{displayedPlaylist.artist || 'Loopify'} · {displayedTracks.length} {displayedTracks.length === 1 ? 'song' : 'songs'}</p></div>
    </section>
    <section className="playlist-song-section"><div className="playlist-detail-heading"><span>SONGS</span><strong>{displayedTracks.length} tracks</strong></div>{displayedTracks.length ? <div className="playlist-song-list">{displayedTracks.map((track, index) => { const trackId = track._id || track.musicKey; return <Link className="playlist-song-row" key={trackId} to={`/music/${trackId}`}><span className="playlist-song-number">{String(index + 1).padStart(2, '0')}</span>{track.musicCoverImageUrl ? <img src={track.musicCoverImageUrl} alt="" /> : <span className="playlist-song-fallback">♫</span>}<span className="playlist-song-copy"><strong>{track.title}</strong><small>{track.artist || 'Unknown artist'}</small></span><span className="playlist-song-play">▶</span></Link> })}</div> : <p className="catalog-message">This playlist has no available songs.</p>}</section>
  </main>
}
