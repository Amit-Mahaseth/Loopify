import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { logoutUser } from '../../auth/api/authApi.js'
import { getAuthStatus } from '../../auth/api/authStatus.js'
import { fetchMusicCatalog } from '../api/musicApi.js'
import { fetchPlaylists } from '../../playlists/api/playlistApi.js'
import Logo from '../../../shared/components/common/Logo.jsx'
import { usePlayer, usePlayerProgress } from '../../player/context/PlayerContext.jsx'
import { useMusicCatalog } from '../context/MusicCatalogContext.jsx'
import { useLikes } from '../../likes/context/LikesContext.jsx'
import { useTheme } from '../../theme/context/ThemeContext.jsx'
import '../../../styles/homeMusic.css'

const HERO_PARTICLES = Array.from({ length: 18 }, (_, index) => ({
  left: `${8 + ((index * 47) % 88)}%`,
  delay: `${-((index * 1.73) % 12)}s`,
  duration: `${10 + ((index * 7) % 9)}s`,
  size: `${2 + (index % 3)}px`,
}))

function WaveformCanvas({ isPlaying, pointerXRef }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return undefined

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mobileQuery = window.matchMedia('(max-width: 767px)')
    let width = 0
    let height = 0
    let frame = 0
    let isVisible = !document.hidden
    let reducedMotion = motionQuery.matches
    let mobile = mobileQuery.matches
    function resize() {
      const bounds = canvas.getBoundingClientRect()
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      width = bounds.width
      height = bounds.height
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      if (reducedMotion) draw(performance.now())
    }

    function draw(timestamp) {
      if (!width || !height) return
      context.clearRect(0, 0, width, height)
      const count = mobile ? 30 : 72
      const slot = width / count
      const gap = Math.max(2, slot * .34)
      const barWidth = Math.max(1, slot - gap)
      const elapsed = reducedMotion ? 0 : timestamp / 1000
      const gradient = context.createLinearGradient(0, height, 0, 0)
      gradient.addColorStop(0, '#0f7a55')
      gradient.addColorStop(1, '#22c55e')
      context.fillStyle = gradient

      for (let index = 0; index < count; index += 1) {
        const position = (index + .5) / count
        const ambient = .16 + Math.abs(Math.sin(index * .49)) * .27 + Math.abs(Math.cos(index * .17)) * .14
        const breath = reducedMotion ? 0 : Math.sin(elapsed * 1.25 + index * .36) * .055
        const beat = isPlaying && !reducedMotion
          ? Math.max(0, Math.sin(elapsed * 7.2 + index * .095)) * .22
          : 0
        const pointerX = pointerXRef.current
        const distance = Math.abs(position - pointerX)
        const cursorWave = pointerX >= 0
          ? Math.max(0, 1 - distance * 5.5) * Math.sin(elapsed * 5 - distance * 17) * .42
          : 0
        const barHeight = Math.max(4, Math.min(height - 5, height * (ambient + breath + beat + cursorWave)))
        const x = index * slot + (slot - barWidth) / 2
        context.globalAlpha = .45 + Math.min(.5, barHeight / height)
        context.beginPath()
        context.roundRect(x, height - barHeight, barWidth, barHeight, Math.min(3, barWidth / 2))
        context.fill()
      }
      context.globalAlpha = 1
    }

    function animate(timestamp) {
      if (!isVisible || reducedMotion) {
        draw(timestamp)
        frame = 0
        return
      }
      draw(timestamp)
      frame = window.requestAnimationFrame(animate)
    }

    function start() {
      if (frame || !isVisible || reducedMotion) {
        if (reducedMotion) draw(performance.now())
        return
      }
      frame = window.requestAnimationFrame(animate)
    }

    function updateMotion() {
      reducedMotion = motionQuery.matches
      if (frame) window.cancelAnimationFrame(frame)
      frame = 0
      if (reducedMotion) draw(performance.now())
      else start()
    }

    function updateViewport() {
      mobile = mobileQuery.matches
      resize()
      start()
    }

    function updateVisibility() {
      isVisible = !document.hidden
      if (frame) window.cancelAnimationFrame(frame)
      frame = 0
      if (isVisible) start()
    }

    resize()
    start()
    window.addEventListener('resize', updateViewport)
    document.addEventListener('visibilitychange', updateVisibility)
    motionQuery.addEventListener('change', updateMotion)
    mobileQuery.addEventListener('change', updateViewport)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', updateViewport)
      document.removeEventListener('visibilitychange', updateVisibility)
      motionQuery.removeEventListener('change', updateMotion)
      mobileQuery.removeEventListener('change', updateViewport)
    }
  }, [isPlaying, pointerXRef])

  return (
    <canvas
      ref={canvasRef}
      className="welcome-waveform"
      aria-hidden="true"
    />
  )
}

function getTimeOfDay(hour) {
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  if (hour < 21) return 'evening'
  return 'night'
}

function setArtworkGlow(event) {
  const image = event.currentTarget
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 24
    canvas.height = 24
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
    let red = 0
    let green = 0
    let blue = 0
    let count = 0
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index + 3] < 160) continue
      red += pixels[index]
      green += pixels[index + 1]
      blue += pixels[index + 2]
      count += 1
    }
    if (count) {
      image.closest('.home-track-card, .home-playlist-card')?.style.setProperty(
        '--cover-shadow',
        `rgba(${Math.round(red / count)}, ${Math.round(green / count)}, ${Math.round(blue / count)}, .3)`,
      )
    }
  } catch {
    image.closest('.home-track-card, .home-playlist-card')?.style.setProperty('--cover-shadow', 'rgba(34, 197, 94, .24)')
  }
}

function getPlaylistCovers(playlist, tracks) {
  return (playlist.musics || []).slice(0, 4).map(item => {
    const id = item?._id || item?.musicKey || item
    return tracks.find(track => String(track._id || track.musicKey) === String(id))
      || (typeof item === 'object' ? item : null)
  }).filter(track => track?.musicCoverImageUrl)
}

function TrackProgressIndicator() {
  const { currentTime, duration } = usePlayerProgress()
  const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0
  return <span className="home-track-progress-ring" style={{ '--track-progress': `${progress}%` }} aria-hidden="true" />
}

function Icon({ name, size = 18 }) {
  const paths = {
    check: <path d="m5 12 4 4L19 6" />,
    menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
    close: <><path d="m18 6-12 12" /><path d="m6 6 12 12" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />,
    home: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1z" />,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>,
    heart: <path d="M20.8 8.8c0 5.2-8.8 10.2-8.8 10.2S3.2 14 3.2 8.8a4.4 4.4 0 0 1 8.8-.4 4.4 4.4 0 0 1 8.8.4Z" />,
    account: <><circle cx="12" cy="8" r="4" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>,
    back: <path d="m14.5 5-7 7 7 7" />,
    forward: <path d="m9.5 5 7 7-7 7" />,
    play: <path d="m8 5 11 7-11 7z" fill="currentColor" stroke="none" />,
    pause: <path d="M6 5h3.5v14H6zm8.5 0H18v14h-3.5z" fill="currentColor" stroke="none" />,
    music: <><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function getSavedUser() {
  try {
    const savedUser = localStorage.getItem('loopify_user')
    if (savedUser) return JSON.parse(savedUser)
  } catch {
    return null
  }
  return null
}

function UserAvatar({ src, initial }) {
  const [imageFailed, setImageFailed] = useState(false)
  const safeImage = typeof src === 'string' ? src.trim() : ''

  return (
    <span className="user-avatar" aria-hidden="true">
      {safeImage && !imageFailed ? <img src={safeImage} alt="" onError={() => setImageFailed(true)} /> : initial}
    </span>
  )
}

export default function Home() {
  const location = useLocation()
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false)
  const mobileNavigationRef = useRef(null)
  const mobileMenuButtonRef = useRef(null)
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(getSavedUser()))
  const [loggedInUser, setLoggedInUser] = useState(getSavedUser)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutMessage, setLogoutMessage] = useState('')
  const { theme, toggleTheme } = useTheme()
  const { tracks: cachedTracks, setTracks: setCachedTracks } = useMusicCatalog()
  const { likedSongIds, toggleLike } = useLikes()
  const [catalogStatus, setCatalogStatus] = useState(() => getSavedUser() ? 'loading' : 'ready')
  const [songSearch, setSongSearch] = useState('')
  const [trendingIndex, setTrendingIndex] = useState(0)
  const [typedCharacters, setTypedCharacters] = useState(0)
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours())
  const [reduceHeroMotion, setReduceHeroMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const waveformPointerRef = useRef(-1)
  const [playlists, setPlaylists] = useState([])
  const [playlistStatus, setPlaylistStatus] = useState(() => getSavedUser() ? 'loading' : 'ready')
  const tracks = cachedTracks || []
  const normalizedSearch = songSearch.trim().toLocaleLowerCase()
  const filteredTracks = normalizedSearch
    ? tracks.filter(track => `${track.title || ''} ${track.artist || ''}`.toLocaleLowerCase().includes(normalizedSearch))
    : tracks
  const visibleCatalogStatus = 'ready'
  const visiblePlaylistStatus = 'ready'
  const { setQueue, selectTrack, currentTrack, isPlaying, togglePlayback } = usePlayer()
  const timeOfDay = getTimeOfDay(currentHour)
  const timeGreeting = currentHour < 12 ? 'Good morning'
    : currentHour < 17 ? 'Good afternoon'
      : currentHour < 21 ? 'Good evening'
        : 'Good night'
  const firstName = loggedInUser?.name?.trim().split(/\s+/)[0]
  const headline = firstName ? `${timeGreeting}, ${firstName}.` : `${timeGreeting}!`
  const headlinePrefixLength = firstName ? `${timeGreeting}, `.length : 0
  const visibleCharacterCount = reduceHeroMotion ? headline.length : Math.min(typedCharacters, headline.length)
  const headlineVisible = headline.slice(0, visibleCharacterCount)
  const typedPrefix = firstName ? headlineVisible.slice(0, headlinePrefixLength) : headlineVisible
  const typedName = firstName
    ? headlineVisible.slice(headlinePrefixLength, headlinePrefixLength + firstName.length)
    : ''
  const typedSuffix = firstName
    ? headlineVisible.slice(headlinePrefixLength + firstName.length)
    : ''
  const isTypingHeadline = !reduceHeroMotion && typedCharacters < headline.length
  const trendingSongs = [...new Set([currentTrack?.title, ...tracks.map((track) => track.title)].filter(Boolean))].slice(0, 8)
  const trendingLabel = trendingSongs.length
    ? trendingSongs[trendingIndex % trendingSongs.length]
    : 'Fresh sounds for your next loop'

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentHour(new Date().getHours()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motionQuery.matches) return undefined
    const timer = window.setInterval(() => {
      setTrendingIndex((index) => index + 1)
    }, 4000)
    return () => window.clearInterval(timer)
  }, [trendingSongs.length])

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    function updateMotionPreference(event) {
      setReduceHeroMotion(event.matches)
    }
    motionQuery.addEventListener('change', updateMotionPreference)
    return () => motionQuery.removeEventListener('change', updateMotionPreference)
  }, [])

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motionQuery.matches) return undefined
    let position = 0
    let timer

    function typeNextCharacter() {
      position += 1
      setTypedCharacters(position)
      if (position < headline.length) timer = window.setTimeout(typeNextCharacter, 58)
    }

    timer = window.setTimeout(() => {
      setTypedCharacters(0)
      timer = window.setTimeout(typeNextCharacter, 160)
    }, 0)
    return () => {
      window.clearTimeout(timer)
    }
  }, [headline, reduceHeroMotion])

  useEffect(() => {
    if (!isMobileNavigationOpen) return undefined

    const previousOverflow = document.body.style.overflow
    const previousPosition = document.body.style.position
    const previousTop = document.body.style.top
    const previousWidth = document.body.style.width
    const scrollY = window.scrollY
    const menuButton = mobileMenuButtonRef.current
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    mobileNavigationRef.current?.querySelector('button, a[href]')?.focus()

    function handleNavigationKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setIsMobileNavigationOpen(false)
        menuButton?.focus()
        return
      }

      if (event.key !== 'Tab') return

      const focusableElements = mobileNavigationRef.current?.querySelectorAll('a[href], button:not(:disabled)')
      if (!focusableElements?.length) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const focusIsInsideDrawer = mobileNavigationRef.current.contains(document.activeElement)

      if (event.shiftKey && (!focusIsInsideDrawer || document.activeElement === firstElement)) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && (!focusIsInsideDrawer || document.activeElement === lastElement)) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    function handleViewportResize() {
      if (window.innerWidth >= 768) setIsMobileNavigationOpen(false)
    }

    document.addEventListener('keydown', handleNavigationKeyDown)
    window.addEventListener('resize', handleViewportResize)

    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.position = previousPosition
      document.body.style.top = previousTop
      document.body.style.width = previousWidth
      document.removeEventListener('keydown', handleNavigationKeyDown)
      window.removeEventListener('resize', handleViewportResize)
      window.scrollTo(0, scrollY)
      if (menuButton?.isConnected) menuButton.focus()
    }
  }, [isMobileNavigationOpen])

  useEffect(() => {
    getAuthStatus()
      .then(({ data }) => {
        setIsLoggedIn(Boolean(data.authenticated))
        setLoggedInUser(data.user || null)
        if (data.user) localStorage.setItem('loopify_user', JSON.stringify(data.user))
        else {
          localStorage.removeItem('loopify_user')
          setCachedTracks(null)
          setCatalogStatus('ready')
          setPlaylists([])
          setPlaylistStatus('ready')
        }
      })
      .catch((error) => {
        if (error.response?.status === 401) {
          setIsLoggedIn(false)
          setLoggedInUser(null)
          setCachedTracks(null)
          setCatalogStatus('ready')
          setPlaylists([])
          setPlaylistStatus('ready')
          localStorage.removeItem('loopify_user')
        }
      })
  }, [setCachedTracks])

  useEffect(() => {
    function handleUserUpdated(event) {
      if (!event.detail) return
      setLoggedInUser(event.detail)
      setIsLoggedIn(true)
    }

    window.addEventListener('loopify:user-updated', handleUserUpdated)
    return () => window.removeEventListener('loopify:user-updated', handleUserUpdated)
  }, [])

  useEffect(() => {
    if (!isLoggedIn) return undefined

    let cancelled = false
    fetchMusicCatalog()
      .then(({ data }) => {
        if (cancelled) return
        setCachedTracks(Array.isArray(data.musics) ? data.musics : [])
        setCatalogStatus('ready')
      })
      .catch((error) => {
        if (cancelled) return
        setCatalogStatus(error.response?.status === 400 || error.response?.status === 401 ? 'guest' : 'error')
      })

    return () => {
      cancelled = true
    }
  }, [isLoggedIn, setCachedTracks])

  useEffect(() => {
    if (!isLoggedIn) return undefined

    let cancelled = false
    fetchPlaylists()
      .then(({ data }) => {
        if (cancelled) return
        setPlaylists(Array.isArray(data.playlists) ? data.playlists : [])
        setPlaylistStatus('ready')
      })
      .catch((error) => {
        if (cancelled) return
        setPlaylistStatus(error.response?.status === 400 || error.response?.status === 401 ? 'guest' : 'error')
      })

    return () => {
      cancelled = true
    }
  }, [isLoggedIn])

  async function handleLogout() {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await logoutUser()
      window.dispatchEvent(new Event('loopify:auth-changed'))
      setIsLoggedIn(false)
      setLoggedInUser(null)
      setCachedTracks(null)
      setCatalogStatus('ready')
      setPlaylists([])
      setPlaylistStatus('ready')
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

  function playTrack(track) {
    const trackId = track._id || track.musicKey
    const currentId = currentTrack?._id || currentTrack?.musicKey
    if (currentTrack && String(currentId) === String(trackId)) {
      togglePlayback()
    } else {
      setQueue(tracks)
      selectTrack(track, true)
    }
  }

  function exploreMusic() {
    document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleHeroPointerMove(event) {
    if (event.pointerType === 'touch' ||
      window.matchMedia('(max-width: 767px)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const hero = event.currentTarget
    const bounds = hero.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width))
    const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height))
    waveformPointerRef.current = x
    hero.style.setProperty('--hero-parallax-x', `${(x - .5) * -8}px`)
    hero.style.setProperty('--hero-parallax-y', `${(y - .5) * -8}px`)
  }

  function handleHeroPointerLeave(event) {
    waveformPointerRef.current = -1
    event.currentTarget.style.setProperty('--hero-parallax-x', '0px')
    event.currentTarget.style.setProperty('--hero-parallax-y', '0px')
  }

  return (
    <div className={`home-shell ${theme}-theme`}>
      <button
        className={`mobile-drawer-backdrop ${isMobileNavigationOpen ? 'is-open' : ''}`}
        type="button"
        aria-label="Close navigation menu"
        tabIndex={isMobileNavigationOpen ? 0 : -1}
        disabled={!isMobileNavigationOpen}
        onClick={() => setIsMobileNavigationOpen(false)}
      />
      <aside
        className={`mobile-drawer ${isMobileNavigationOpen ? 'is-open' : ''}`}
        id="mobile-navigation-drawer"
        ref={mobileNavigationRef}
        role="dialog"
        aria-modal={isMobileNavigationOpen ? 'true' : undefined}
        aria-label="Mobile navigation"
        aria-hidden={!isMobileNavigationOpen}
        inert={!isMobileNavigationOpen}
      >
        <div className="mobile-drawer-header">
          <Link className="brand" to="/" onClick={() => setIsMobileNavigationOpen(false)}>
            <Logo size="sm" />
          </Link>
          <button className="mobile-drawer-close" type="button" onClick={() => setIsMobileNavigationOpen(false)} aria-label="Close navigation menu">
            <Icon name="close" size={20} />
          </button>
        </div>
        <nav className="mobile-drawer-nav" aria-label="Main navigation">
          <Link className={`nav-item ${location.pathname === '/' && location.hash !== '#discover' ? 'active' : ''}`} to="/" onClick={() => setIsMobileNavigationOpen(false)}><Icon name="home" />Home</Link>
          <a className={`nav-item ${location.hash === '#discover' ? 'active' : ''}`} href="#discover" onClick={() => setIsMobileNavigationOpen(false)}><Icon name="search" />Discover</a>
          <div className="sidebar-divider" />
          <p className="sidebar-caption">YOUR MUSIC</p>
          <Link className={`nav-item ${location.pathname === '/liked' ? 'active' : ''}`} to="/liked" onClick={() => setIsMobileNavigationOpen(false)}><Icon name="heart" />Liked songs</Link>
          <Link className={`nav-item ${location.pathname === '/artist' ? 'active' : ''}`} to="/artist" onClick={() => setIsMobileNavigationOpen(false)}><Icon name="music" />Artists</Link>
          {isLoggedIn && <Link className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`} to="/profile" onClick={() => setIsMobileNavigationOpen(false)}><Icon name="account" />Profile</Link>}
          {isLoggedIn && loggedInUser?.role === 'artist' && <Link className={`nav-item ${location.pathname === '/artist/dashboard' ? 'active' : ''}`} to="/artist/dashboard" onClick={() => setIsMobileNavigationOpen(false)}><Icon name="music" />Artist dashboard</Link>}
        </nav>
        {isLoggedIn ? (
          <div className="mobile-drawer-account">
            <span className="account-label">SIGNED IN</span>
            <Link className="account-summary-user" to="/profile" onClick={() => setIsMobileNavigationOpen(false)} aria-label="Open profile">
              <UserAvatar
                src={typeof loggedInUser?.profileImage === 'string' ? loggedInUser.profileImage.trim() : ''}
                initial={(loggedInUser?.name || loggedInUser?.email || 'U').slice(0, 1).toUpperCase()}
              />
              <span className="user-copy">
                <strong>{loggedInUser?.name || 'Loopify listener'}</strong>
                <span>{loggedInUser?.email || ''}</span>
              </span>
            </Link>
            <button className="button button-small logout-button mobile-drawer-logout" type="button" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? <><span className="logout-spinner" />Signing out...</> : 'Log out'}
            </button>
          </div>
        ) : (
          <div className="mobile-drawer-account guest-prompt">
            <span className="sidebar-note">Listening as a guest</span>
            <Link className="sidebar-join" to="/register" onClick={() => setIsMobileNavigationOpen(false)}>Join Loopify <span>+</span></Link>
          </div>
        )}
      </aside>
      <aside className="sidebar">
        <Link className="brand" to="/"><Logo size="sm" /></Link>
        <nav className="side-nav" aria-label="Main navigation">
          <Link className="nav-item active" to="/"><Icon name="home" />Home</Link>
          <a className="nav-item" href="#discover"><Icon name="search" />Discover</a>
        </nav>
        <div className="sidebar-divider" />
        <p className="sidebar-caption">YOUR MUSIC</p>
        <Link className="nav-item" to="/liked"><Icon name="heart" />Liked songs</Link>
        <Link className="nav-item" to="/artist"><Icon name="music" />Artists</Link>
        {isLoggedIn && <Link className="nav-item" to="/profile"><Icon name="account" />Profile</Link>}
        {isLoggedIn && loggedInUser?.role === 'artist' && <Link className="nav-item" to="/artist/dashboard"><Icon name="music" />Artist dashboard</Link>}
        {!isLoggedIn && <div className="sidebar-bottom guest-prompt">
          <span className="sidebar-note">Listening as a guest</span>
          <Link className="sidebar-join" to="/register">Join Loopify <span>+</span></Link>
        </div>}
        {isLoggedIn && loggedInUser && <div className="sidebar-bottom account-summary">
          <span className="account-label">SIGNED IN</span>
          <Link className="account-summary-user" to="/profile" aria-label="Open profile">
              <UserAvatar
                src={typeof loggedInUser.profileImage === 'string' ? loggedInUser.profileImage.trim() : ''}
                initial={(loggedInUser.name || loggedInUser.email || 'U').slice(0, 1).toUpperCase()}
              />
              <span className="user-copy"><strong>{loggedInUser.name || 'Loopify listener'}</strong><span>{loggedInUser.email}</span></span>
            </Link>
          </div>}
      </aside>

      <main className="home-main">
        <header className="topbar">
          <div className="topbar-leading">
            <div className="history-buttons"><button type="button" aria-label="Go back"><Icon name="back" size={16} /></button><button type="button" aria-label="Go forward"><Icon name="forward" size={16} /></button></div>
            <button
              className="mobile-menu-button"
              type="button"
              ref={mobileMenuButtonRef}
              aria-label="Open navigation menu"
              aria-controls="mobile-navigation-drawer"
              aria-expanded={isMobileNavigationOpen}
              onClick={() => setIsMobileNavigationOpen(true)}
            >
              <Icon name="menu" size={21} />
            </button>
            <Link className="brand mobile-header-brand" to="/" aria-label="Loopify home">
              <Logo size="sm" />
            </Link>
          </div>
          <div className="topbar-actions">
            <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
            </button>
            {isLoggedIn
              ? <>
                  {loggedInUser && <div className="user-profile" key={loggedInUser.email}>
                    <span className="user-avatar" aria-hidden="true">{(loggedInUser.name || loggedInUser.email || 'U').slice(0, 1).toUpperCase()}</span>
                    <span className="user-copy"><strong>{loggedInUser.name}</strong><span>{loggedInUser.email}</span></span>
                  </div>}
                  {loggedInUser && <Link className="mobile-profile-link" to="/profile" aria-label="Open profile" title="Open profile">
                    <UserAvatar
                      src={typeof loggedInUser.profileImage === 'string' ? loggedInUser.profileImage.trim() : ''}
                      initial={(loggedInUser.name || loggedInUser.email || 'U').slice(0, 1).toUpperCase()}
                    />
                  </Link>}
                  <button className="button button-small logout-button" type="button" onClick={handleLogout} disabled={isLoggingOut}>
                    {isLoggingOut ? <><span className="logout-spinner" />Signing out...</> : 'Log out'}
                  </button>
                </>
              : <><Link className="top-signup" to="/login">Log in</Link><Link className="button button-small" to="/register">Sign up</Link></>}
          </div>
        </header>

        <div className="home-content">
          <section
            className="welcome"
            data-time={timeOfDay}
            onPointerMove={handleHeroPointerMove}
            onPointerLeave={handleHeroPointerLeave}
          >
            {HERO_PARTICLES.map((particle, index) => (
              <span
                className="welcome-particle"
                key={index}
                style={{
                  '--particle-left': particle.left,
                  '--particle-delay': particle.delay,
                  '--particle-duration': particle.duration,
                  '--particle-size': particle.size,
                }}
              />
            ))}
            <span className="eyebrow">YOUR PERSONAL SOUNDTRACK</span>
            <h1 className={isTypingHeadline ? 'is-typing' : ''} aria-label={headline}>
              <span aria-hidden="true">{typedPrefix}</span>
              {firstName && typedName && <span className="welcome-name" aria-hidden="true">{typedName}</span>}
              {firstName && <span aria-hidden="true">{typedSuffix}</span>}
              {isTypingHeadline && <span className="welcome-typing-cursor" aria-hidden="true" />}
            </h1>
            <p>What do you want to hear today?</p>
            <div className="welcome-trending" aria-live="polite">
              <span className="welcome-trending-label">Now trending</span>
              <span className="welcome-trending-track" key={`${trendingIndex}-${trendingLabel}`}>{trendingLabel}</span>
            </div>
            <a className="welcome-explore-link" href="#discover" onClick={(event) => { event.preventDefault(); exploreMusic() }}>
              <span>Explore all music</span><span className="welcome-explore-arrow" aria-hidden="true">→</span>
            </a>
            <div className="welcome-atmosphere" aria-hidden="true">
              <span className="welcome-visual-ring welcome-visual-ring-one" />
              <span className="welcome-visual-ring welcome-visual-ring-two" />
              <span className="welcome-visual-ring welcome-visual-ring-three" />
              <div className="welcome-vinyl"><span className="welcome-vinyl-label"><span>♪</span></span></div>
              <span className="welcome-note welcome-note-one">♪</span>
              <span className="welcome-note welcome-note-two">♫</span>
            </div>
            <WaveformCanvas isPlaying={isPlaying} pointerXRef={waveformPointerRef} />
          </section>

          <section className="music-section home-playlist-section" id="playlists">
            <div className="section-heading">
              <div><span className="eyebrow">YOUR COLLECTION</span><h2>Playlists</h2></div>
              {visiblePlaylistStatus === 'ready' && <div className="home-section-actions"><span className="home-track-count">{playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}</span><a href="#playlists" aria-label="See all playlists">See all <span aria-hidden="true">→</span></a></div>}
            </div>
            {playlistStatus === 'error' && isLoggedIn && <p className="home-catalog-message" role="alert">Could not load your playlists.</p>}
            {playlistStatus === 'loading' && isLoggedIn ? <div className="home-playlist-grid home-skeleton-grid" role="status" aria-label="Loading playlists">
              {Array.from({ length: 3 }, (_, index) => <div className="home-skeleton-card" key={index}><span className="home-skeleton-art" /><span className="home-skeleton-line" /><span className="home-skeleton-line short" /><span className="home-skeleton-pill" /></div>)}
            </div> : visiblePlaylistStatus === 'ready' && (playlists.length ? <div className="home-playlist-grid">
              {playlists.map((playlist, index) => {
                const covers = getPlaylistCovers(playlist, tracks)
                const songCount = playlist.musics?.length || 0
                const playlistCover = !covers.length ? playlist.coverImageUrl : ''
                return <Link className="home-playlist-card" key={playlist._id} to={`/playlist/${playlist._id}`} aria-label={`Open playlist ${playlist.title}`} style={{ '--card-index': index }}>
                  <div className="home-playlist-mosaic" aria-hidden="true">
                    {covers.length ? covers.map((track, coverIndex) => <span className={`home-playlist-tile ${covers.length === 1 ? 'is-single' : ''}`} key={track._id || track.musicKey || coverIndex}>
                      <img src={track.musicCoverImageUrl} alt="" loading="lazy" decoding="async" onLoad={setArtworkGlow} />
                    </span>) : playlistCover ? <span className="home-playlist-tile is-single"><img src={playlistCover} alt="" loading="lazy" decoding="async" onLoad={setArtworkGlow} /></span> : <span className="home-playlist-tile is-single home-playlist-fallback">♫</span>}
                    <span className="home-playlist-open-indicator"><Icon name="play" size={16} /></span>
                  </div>
                  <span className="home-playlist-title">{playlist.title}</span>
                  <span className="home-playlist-meta">Created by Arjit Singh</span>
                  <span className="home-playlist-count">{songCount} {songCount === 1 ? 'song' : 'songs'}</span>
                </Link>
              })}
            </div> : <p className="home-catalog-message">No playlists have been created yet.</p>)}
          </section>

          <section className="music-section" id="discover">
            <div className="section-heading">
              <div><span className="eyebrow">YOUR MUSIC</span><h2>All songs</h2></div>
              <div className="home-track-count-wrap">
                {visibleCatalogStatus === 'ready' && <span className="home-track-count">{normalizedSearch ? `${filteredTracks.length} ${filteredTracks.length === 1 ? 'result' : 'results'}` : `${tracks.length} ${tracks.length === 1 ? 'song' : 'songs'}`}</span>}
                <a href="#discover" aria-label="See all songs">See all <span aria-hidden="true">→</span></a>
              </div>
            </div>
            {catalogStatus === 'error' && isLoggedIn && <p className="home-catalog-message" role="alert">Could not load your music library.</p>}
            {visibleCatalogStatus === 'ready' && tracks.length > 0 && <label className="song-search">
              <Icon name="search" size={18} />
              <input aria-label="Search songs by title or artist" type="search" value={songSearch} onChange={event => setSongSearch(event.target.value)} placeholder="Search songs or artists" />
            </label>}
            {catalogStatus === 'loading' && isLoggedIn ? <div className="home-track-grid home-skeleton-grid" role="status" aria-label="Loading songs">
              {Array.from({ length: 6 }, (_, index) => <div className="home-skeleton-card" key={index}><span className="home-skeleton-art" /><span className="home-skeleton-line" /><span className="home-skeleton-line short" /></div>)}
            </div> : visibleCatalogStatus === 'ready' && (tracks.length ? filteredTracks.length ? <div className="home-track-grid">
              {filteredTracks.map((track) => {
                const trackId = track._id || track.musicKey
                const isCurrentTrack = Boolean(currentTrack && String(currentTrack._id || currentTrack.musicKey) === String(trackId))
                const isCurrentPlaying = isCurrentTrack && isPlaying
                const isLiked = likedSongIds.includes(String(trackId))
                const artist = track.artist || 'Unknown artist'
                return <article className={`home-track-card ${isCurrentTrack ? 'has-track' : ''} ${isCurrentPlaying ? 'is-playing' : ''}`} key={trackId} style={{ '--card-index': tracks.indexOf(track) }}>
                  <div className="home-track-art">
                    {track.musicCoverImageUrl ? <img src={track.musicCoverImageUrl} alt="" loading="lazy" decoding="async" onLoad={setArtworkGlow} /> : <span className="home-track-fallback" aria-hidden="true">♫</span>}
                    {isCurrentPlaying && (
                      <span className="home-track-equalizer" aria-label="Playing">
                        <span className="eq-bar bar-1" />
                        <span className="eq-bar bar-2" />
                        <span className="eq-bar bar-3" />
                      </span>
                    )}
                    <button className={`home-track-liked-sticker ${isLiked ? 'is-liked' : ''}`} type="button" onClick={() => toggleLike(track)} aria-label={`${isLiked ? 'Unlike' : 'Like'} ${track.title} by ${artist}`} aria-pressed={isLiked}><Icon name="heart" size={15} /></button>
                    <button className={`home-track-play ${isCurrentTrack ? 'playing' : ''}`} type="button" onClick={() => playTrack(track)} aria-label={`${isCurrentPlaying ? 'Pause' : 'Play'} ${track.title} by ${artist}`}>{isCurrentTrack && <TrackProgressIndicator />}<Icon name={isCurrentPlaying ? 'pause' : 'play'} size={15} /></button>
                  </div>
                  <Link className="home-track-title" to={`/music/${trackId}`} aria-label={`View ${track.title} by ${artist}`}>{track.title}</Link>
                  <span className="home-track-artist">{artist}</span>
                </article>
              })}
            </div> : <p className="home-catalog-message" role="status">No songs match “{songSearch.trim()}”. Try another title or artist.</p> : <p className="home-catalog-message">No songs have been uploaded yet.</p>)}
          </section>

          <section className="artist-banner">
            <div><span className="eyebrow">ARTIST SPOTLIGHT</span><h2>Meet your next favorite artist.</h2><p>Discover a fresh voice selected for your listening journey.</p><Link className="artist-link" to="/artist">Explore artists <span>→</span></Link></div>
            <div className="banner-note" aria-hidden="true"><Icon name="music" size={36} /></div>
          </section>
          <footer className="home-footer"><span>© 2026 Loopify</span><span>Made for listeners.</span></footer>
        </div>
        {logoutMessage && <div className={`logout-toast ${logoutMessage.startsWith('You') ? 'logout-toast-success' : 'logout-toast-error'}`} role="status"><Icon name="check" size={17} />{logoutMessage}</div>}
      </main>

    </div>
  )
}
