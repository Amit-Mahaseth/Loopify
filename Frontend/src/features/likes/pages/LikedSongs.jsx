import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchMusicCatalog } from '../../music/api/musicApi.js'
import Logo from '../../../shared/components/common/Logo.jsx'
import { useLikes } from '../context/LikesContext.jsx'
import { useTheme } from '../../theme/context/ThemeContext.jsx'
import '../../../styles/musicPlayer.css'

export default function LikedSongs() {
  const { theme } = useTheme()
  const { likedSongIds } = useLikes()
  const [tracks, setTracks] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    fetchMusicCatalog()
      .then(({ data }) => {
        setTracks((data.musics || []).filter(track => likedSongIds.includes(String(track._id || track.musicKey))))
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [likedSongIds])

  return <main className={`music-player-page ${theme}-theme`}><header className="music-player-header"><Link className="music-player-back back-navigation-link" to="/"><span className="back-navigation-arrow" aria-hidden="true">←</span> Back to home</Link><Link className="brand" to="/"><Logo size="sm" /></Link></header><section className="liked-songs-page"><span className="eyebrow">YOUR COLLECTION</span><h1>Liked songs</h1><p>Keep all the music you love in one place.</p>{status === 'loading' && <p className="catalog-message">Loading liked songs...</p>}{status === 'error' && <p className="catalog-message">Could not load liked songs.</p>}{status === 'ready' && (tracks.length ? <div className="playlist-song-list">{tracks.map((track, index) => { const trackId = track._id || track.musicKey; return <Link className="playlist-song-row" key={trackId} to={`/music/${trackId}`}><span className="playlist-song-number">{String(index + 1).padStart(2, '0')}</span>{track.musicCoverImageUrl ? <img src={track.musicCoverImageUrl} alt="" /> : <span className="playlist-song-fallback">♫</span>}<span className="playlist-song-copy"><strong>{track.title}</strong><small>{track.artist || 'Unknown artist'}</small></span><span className="playlist-song-play">▶</span></Link> })}</div> : <div className="liked-empty"><span>♡</span><h2>No liked songs yet</h2><p>Open a song and tap Like to add it here.</p><Link className="button" to="/">Browse songs</Link></div>)}</section></main>
}
