import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { getAuthStatus } from '../authStatus.js'

const playlists = [
  { title: 'Golden Hour', artist: 'Chill edits', cover: 'cover-gold', symbol: 'sun' },
  { title: 'After Dark', artist: 'Late night sounds', cover: 'cover-night', symbol: 'moon' },
  { title: 'Soft Focus', artist: 'Lo-fi essentials', cover: 'cover-soft', symbol: 'wave' },
  { title: 'Fresh Finds', artist: 'Made for you', cover: 'cover-green', symbol: 'leaf' },
]

function Icon({ name, size = 18 }) {
  const paths = {
    check: <path d="m5 12 4 4L19 6" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />,
    home: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1z" />,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>,
    library: <><path d="M4 5h16M4 10h16M4 15h10M4 20h10" /><path d="M18 15v6m-3-3h6" /></>,
    heart: <path d="M20.8 8.8c0 5.2-8.8 10.2-8.8 10.2S3.2 14 3.2 8.8a4.4 4.4 0 0 1 8.8-.4 4.4 4.4 0 0 1 8.8.4Z" />,
    account: <><circle cx="12" cy="8" r="4" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>,
    back: <path d="m14.5 5-7 7 7 7" />,
    forward: <path d="m9.5 5 7 7-7 7" />,
    play: <path d="m8 5 11 7-11 7z" fill="currentColor" stroke="none" />,
    music: <><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function getSavedUser() {
  try {
    const savedUser = localStorage.getItem('loopify_user')
    if (savedUser) return JSON.parse(savedUser)
  } catch {
  }
  return null
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(getSavedUser()))
  const [loggedInUser, setLoggedInUser] = useState(getSavedUser)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutMessage, setLogoutMessage] = useState('')
  const [theme, setTheme] = useState(() => localStorage.getItem('loopify_theme') || 'dark')

  useEffect(() => {
    getAuthStatus()
      .then(({ data }) => {
        setIsLoggedIn(Boolean(data.authenticated))
        setLoggedInUser(data.user || null)
        if (data.user) localStorage.setItem('loopify_user', JSON.stringify(data.user))
        else localStorage.removeItem('loopify_user')
      })
      .catch((error) => {
        if (error.response?.status === 401) {
          setIsLoggedIn(false)
          setLoggedInUser(null)
          localStorage.removeItem('loopify_user')
        }
      })
  }, [])

  function toggleTheme() {
    setTheme(current => {
      const nextTheme = current === 'dark' ? 'light' : 'dark'
      localStorage.setItem('loopify_theme', nextTheme)
      return nextTheme
    })
  }

  async function handleLogout() {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await axios.post('http://localhost:3000/api/auth/logout', {}, { withCredentials: true })
      setIsLoggedIn(false)
      setLoggedInUser(null)
      setLogoutMessage('You are now signed out')
      window.setTimeout(() => setLogoutMessage(''), 2800)
    } catch (error) {
      console.error('Logout failed:', error)
      setLogoutMessage('Could not sign out. Please try again.')
      window.setTimeout(() => setLogoutMessage(''), 3200)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className={`home-shell ${theme}-theme`}>
      <aside className="sidebar">
        <Link className="brand" to="/"><span className="brand-mark">L</span><span>loopify</span></Link>
        <nav className="side-nav" aria-label="Main navigation">
          <Link className="nav-item active" to="/"><Icon name="home" />Home</Link>
          <a className="nav-item" href="#discover"><Icon name="search" />Discover</a>
          <a className="nav-item" href="#library"><Icon name="library" />Your library</a>
        </nav>
        <div className="sidebar-divider" />
        <p className="sidebar-caption">YOUR MUSIC</p>
        <a className="nav-item" href="#liked"><Icon name="heart" />Liked songs</a>
        {isLoggedIn && <Link className="nav-item" to="/profile"><Icon name="account" />Profile</Link>}
        {!isLoggedIn && <div className="sidebar-bottom guest-prompt">
          <span className="sidebar-note">Listening as a guest</span>
          <Link className="sidebar-join" to="/register">Join Loopify <span>+</span></Link>
        </div>}
        {isLoggedIn && loggedInUser && <div className="sidebar-bottom account-summary">
          <span className="account-label">SIGNED IN</span>
          <Link className="account-summary-user" to="/profile" aria-label="Open profile">
            <span className="user-avatar" aria-hidden="true">{(loggedInUser.name || loggedInUser.email || 'U').slice(0, 1).toUpperCase()}</span>
            <span className="user-copy"><strong>{loggedInUser.name || 'Loopify listener'}</strong><span>{loggedInUser.email}</span></span>
          </Link>
        </div>}
      </aside>

      <main className="home-main">
        <header className="topbar">
          <div className="history-buttons"><button type="button" aria-label="Go back"><Icon name="back" size={16} /></button><button type="button" aria-label="Go forward"><Icon name="forward" size={16} /></button></div>
          <div className="topbar-actions">
            <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} /><span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
            </button>
            {isLoggedIn
              ? <>
                  {loggedInUser && <div className="user-profile" key={loggedInUser.email}>
                    <span className="user-avatar" aria-hidden="true">{(loggedInUser.name || loggedInUser.email || 'U').slice(0, 1).toUpperCase()}</span>
                    <span className="user-copy"><strong>{loggedInUser.name}</strong><span>{loggedInUser.email}</span></span>
                  </div>}
                  <button className="button button-small logout-button" type="button" onClick={handleLogout} disabled={isLoggingOut}>
                    {isLoggingOut ? <><span className="logout-spinner" />Signing out...</> : 'Log out'}
                  </button>
                </>
              : <><Link className="top-signup" to="/login">Log in</Link><Link className="button button-small" to="/register">Sign up</Link></>}
          </div>
        </header>

        <div className="home-content">
          <section className="welcome">
            <span className="eyebrow">GOOD EVENING</span>
            <h1>What do you want to hear?</h1>
            <p>Ease into the evening with something made for the moment.</p>
            <Link className="button" to="#discover">Explore music</Link>
            <div className="welcome-orb" aria-hidden="true"><img src="/sound-wave.svg" alt="" /></div>
          </section>

          <section className="music-section" id="discover">
            <div className="section-heading"><div><span className="eyebrow">CURATED FOR YOU</span><h2>Made for your mood</h2></div><a href="#all-playlists">See all <span>→</span></a></div>
            <div className="playlist-grid">
              {playlists.map((playlist) => (
                <article className="playlist-card" key={playlist.title}>
                  <div className={`playlist-cover ${playlist.cover}`}><svg className="cover-art" viewBox="0 0 120 90" aria-hidden="true"><path d={playlist.cover === 'cover-gold' ? 'M20 65c18-30 27-30 40 0s22 30 40 0' : playlist.cover === 'cover-night' ? 'M25 60c10-30 20-30 30 0s20 30 30 0 20-30 30 0' : playlist.cover === 'cover-soft' ? 'M15 48h90M25 35v26m15-38v50m15-34v18m15-28v38m15-48v58' : 'M60 15v60M35 35h50M42 24l36 48m0-48L42 72'} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg><button className="cover-play" type="button" aria-label={`Play ${playlist.title}`}><Icon name="play" size={15} /></button></div>
                  <strong>{playlist.title}</strong><p>{playlist.artist}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="artist-banner" id="library">
            <div><span className="eyebrow">ARTIST SPOTLIGHT</span><h2>Meet your next favorite artist.</h2><p>Discover a fresh voice selected for your listening journey.</p><a className="artist-link" href="#artist">Listen now <span>→</span></a></div>
            <div className="banner-note" aria-hidden="true"><Icon name="music" size={36} /></div>
          </section>
          <footer className="home-footer"><span>© 2026 Loopify</span><span>Made for listeners.</span></footer>
        </div>
        {logoutMessage && <div className={`logout-toast ${logoutMessage.startsWith('You') ? 'logout-toast-success' : 'logout-toast-error'}`} role="status"><Icon name="check" size={17} />{logoutMessage}</div>}
      </main>

      <div className="mini-player"><div className="now-playing-art"><Icon name="music" /></div><div className="now-playing"><strong>Night Drive</strong><span>Loopify radio</span></div><button className="play-button" type="button" aria-label="Play"><Icon name="play" size={14} /></button><div className="player-line"><span /></div><span className="player-time">1:24</span></div>
    </div>
  )
}
