import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchArtists } from '../api/artistApi.js'
import { fetchMusicCatalog } from '../../music/api/musicApi.js'
import Logo from '../../../shared/components/common/Logo.jsx'
import { usePlayer } from '../../player/context/PlayerContext.jsx'
import { useTheme } from '../../theme/context/ThemeContext.jsx'
import '../../../styles/artistDirectory.css'

function getArtistName(artist) {
  return [artist.Fullname?.firstname, artist.Fullname?.lastname].filter(Boolean).join(' ') || artist.email || 'Loopify artist'
}

function ArtistPhoto({ artist, name }) {
  const [imageFailed, setImageFailed] = useState(false)
  const image = typeof artist.profileImage === 'string' ? artist.profileImage.trim() : ''

  return (
    <span className="artist-directory-photo">
      {image && !imageFailed
        ? <img src={image} alt="" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} />
        : name.slice(0, 1).toUpperCase()}
    </span>
  )
}

export default function ArtistDirectory() {
  const { theme } = useTheme()
  const { setQueue, selectTrack, currentTrack, isPlaying, togglePlayback } = usePlayer()
  const [artists, setArtists] = useState([])
  const [tracks, setTracks] = useState([])
  const [status, setStatus] = useState('loading')
  const [requiresLogin, setRequiresLogin] = useState(false)

  useEffect(() => {
    let cancelled = false

    Promise.all([
      fetchArtists(),
      fetchMusicCatalog(),
    ]).then(([artistResponse, musicResponse]) => {
      if (cancelled) return
      setArtists(Array.isArray(artistResponse.data?.Artists) ? artistResponse.data.Artists : [])
      setTracks(Array.isArray(musicResponse.data?.musics) ? musicResponse.data.musics : [])
      setStatus('ready')
    }).catch((error) => {
      if (cancelled) return
      if ([400, 401].includes(error.response?.status)) {
        setRequiresLogin(true)
        setStatus('error')
        return
      }
      setStatus('error')
    })

    return () => {
      cancelled = true
    }
  }, [])

  function playTrack(track, artistTracks) {
    const trackId = track._id || track.musicKey
    const currentTrackId = currentTrack?._id || currentTrack?.musicKey
    if (currentTrack && String(currentTrackId) === String(trackId)) {
      togglePlayback()
      return
    }
    setQueue(artistTracks)
    selectTrack(track, true)
  }

  return (
    <main className={`artist-directory-page ${theme}-theme`}>
      <header className="artist-directory-header">
        <Link className="brand" to="/"><Logo size="sm" /></Link>
        <Link className="artist-directory-back back-navigation-link" to="/"><span className="back-navigation-arrow" aria-hidden="true">←</span> Back to home</Link>
      </header>

      <section className="artist-directory-content">
        <span className="eyebrow">DISCOVER</span>
        <h1>Artists</h1>
        <p className="artist-directory-intro">Meet the artists behind the music and explore their songs.</p>

        {status === 'loading' && <p className="artist-directory-message" role="status">Loading artists and songs...</p>}
        {status === 'error' && (requiresLogin
          ? <div className="artist-directory-message"><p>Log in to explore artists and their songs.</p><Link className="button button-small" to="/login">Log in</Link></div>
          : <p className="artist-directory-message" role="alert">Could not load artists right now. Please refresh and try again.</p>)}
        {status === 'ready' && !artists.length && <p className="artist-directory-message">No artists have joined yet.</p>}

        {status === 'ready' && artists.map((artist) => {
          const artistName = getArtistName(artist)
          const normalizedArtistName = artistName.trim().toLowerCase()
          const artistTracks = tracks.filter((track) => {
            if (track.artistId) return String(track.artistId) === String(artist._id)
            return track.artist?.trim().toLowerCase() === normalizedArtistName
          })

          return (
            <article className="artist-directory-card" key={artist._id}>
              <div className="artist-directory-identity">
                <ArtistPhoto artist={artist} name={artistName} />
                <div className="artist-directory-details">
                  <h2>{artistName}</h2>
                  <p>{artist.email}</p>
                  <span className="artist-directory-account">Artist</span>
                  {artist.createdAt && <span className="artist-directory-joined">Joined {new Date(artist.createdAt).toLocaleDateString()}</span>}
                </div>
                <span className="artist-directory-count">{artistTracks.length} {artistTracks.length === 1 ? 'song' : 'songs'}</span>
              </div>

              <div className="artist-directory-songs">
                <h3>Songs</h3>
                {artistTracks.length
                  ? <div className="artist-directory-track-list">
                    {artistTracks.map((track) => {
                      const trackId = track._id || track.musicKey
                      const active = Boolean(isPlaying && String(currentTrack?._id || currentTrack?.musicKey) === String(trackId))
                      return (
                        <article className="artist-directory-track" key={trackId}>
                          {track.musicCoverImageUrl
                            ? <img src={track.musicCoverImageUrl} alt="" />
                            : <span className="artist-directory-cover-fallback" aria-hidden="true">♫</span>}
                          <div className="artist-directory-track-copy">
                            <strong>{track.title}</strong>
                            <span>{track.artist || artistName}</span>
                          </div>
                          <button
                            className="artist-directory-play"
                            type="button"
                            onClick={() => playTrack(track, artistTracks)}
                            aria-label={`${active ? 'Pause' : 'Play'} ${track.title}`}
                          >{active ? 'Ⅱ' : '▶'}</button>
                        </article>
                      )
                    })}
                  </div>
                  : <p className="artist-directory-no-songs">No songs uploaded yet.</p>}
              </div>
            </article>
          )
        })}
      </section>
    </main>
  )
}
