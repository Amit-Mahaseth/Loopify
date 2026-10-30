import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { getAuthStatus } from '../../features/auth/api/authStatus.js'
import { disconnectSocket, connectSocket } from '../../shared/services/socketClient.js'
import { usePlayer } from '../../features/player/context/PlayerContext.jsx'

const ArtistDashboard = lazy(() => import('../../features/artists/pages/ArtistDashboard.jsx'))
const ArtistDirectory = lazy(() => import('../../features/artists/pages/ArtistDirectory.jsx'))
const CreatePlaylist = lazy(() => import('../../features/playlists/pages/CreatePlaylist.jsx'))
const Home = lazy(() => import('../../features/music/pages/Home.jsx'))
const LikedSongs = lazy(() => import('../../features/likes/pages/LikedSongs.jsx'))
const Login = lazy(() => import('../../features/auth/pages/Login.jsx'))
const MusicPlayer = lazy(() => import('../../features/music/pages/MusicPlayer.jsx'))
const MusicUpload = lazy(() => import('../../features/music/pages/MusicUpload.jsx'))
const PlaylistDetail = lazy(() => import('../../features/playlists/pages/PlaylistDetail.jsx'))
const Profile = lazy(() => import('../../features/profile/pages/Profile.jsx'))
const Register = lazy(() => import('../../features/auth/pages/Register.jsx'))
const ForgotPassword = lazy(() => import('../../features/auth/pages/ForgotPassword.jsx'))

function RequireAuth() {
  const location = useLocation()
  const { clearTrack } = usePlayer()
  const [status, setStatus] = useState('checking')

  const checkAuthentication = useCallback(() => getAuthStatus()
    .then(({ data }) => {
      if (!data.authenticated) clearTrack()
      setStatus(data.authenticated ? 'authenticated' : 'unauthenticated')
    })
    .catch((error) => {
      const isUnauthenticated = error.response?.status === 401
      // A visitor without a previously established client session should be sent
      // to login if the status endpoint cannot be reached. The network error page
      // is reserved for a session that was already authenticated in this browser.
      const hasSignedInSession = Boolean(localStorage.getItem('loopify_user'))
      if (isUnauthenticated || !hasSignedInSession) clearTrack()
      setStatus(isUnauthenticated || !hasSignedInSession ? 'unauthenticated' : 'error')
    }), [clearTrack])

  const retryAuthentication = useCallback(() => {
    setStatus('checking')
    checkAuthentication()
  }, [checkAuthentication])

  useEffect(() => {
    checkAuthentication()
    window.addEventListener('loopify:auth-changed', retryAuthentication)
    return () => window.removeEventListener('loopify:auth-changed', retryAuthentication)
  }, [checkAuthentication, retryAuthentication])

  if (status === 'checking') {
    return (
      <main className="auth-route-status is-checking" role="status" aria-live="polite">
        <section className="auth-status-card">
          <span className="auth-status-icon auth-status-spinner" aria-hidden="true" />
          <p className="auth-status-eyebrow">LOOPIFY ACCOUNT</p>
          <h1>Verifying your account</h1>
          <p className="auth-status-description">Just a moment while we check your session.</p>
        </section>
      </main>
    )
  }
  if (status === 'error') {
    return (
      <main className="auth-route-status is-error" role="alert">
        <section className="auth-status-card">
          <span className="auth-status-icon" aria-hidden="true">!</span>
          <p className="auth-status-eyebrow">LOOPIFY ACCOUNT</p>
          <h1>Network issue</h1>
          <p className="auth-status-description">We couldn’t reach Loopify to restore your signed-in session. Check your connection and try again.</p>
          <button className="button auth-status-retry" type="button" onClick={retryAuthentication}>Try again</button>
        </section>
      </main>
    )
  }
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}${location.hash}` }} />
  }
  return <Outlet />
}

export default function AppRoutes() {
  const navigate = useNavigate()
  const { pauseFromRemote } = usePlayer()

  useEffect(() => {
    let cancelled = false
    let socket
    let remotePlaybackToken = 0

    async function connectAuthenticatedUser() {
      try {
        const { data } = await getAuthStatus()
        if (cancelled || !data.authenticated) return

        socket = await connectSocket()
        if (cancelled || !socket) return
        const handlePlay = ({ musicId, position } = {}) => {
          if (!musicId) return
          navigate(`/music/${encodeURIComponent(String(musicId))}`, {
            state: {
              remotePlaybackToken: ++remotePlaybackToken,
              remotePlaybackMode: 'resume',
              remotePlaybackPosition: position,
            },
          })
        }
        const handleChangeSong = ({ musicId } = {}) => {
          if (!musicId) return
          navigate(`/music/${encodeURIComponent(String(musicId))}`, {
            state: {
              remotePlaybackToken: ++remotePlaybackToken,
              remotePlaybackMode: 'change',
            },
          })
        }
        const handlePause = ({ musicId, position } = {}) => pauseFromRemote(musicId, position)
        const handleConnectError = (error) => {
          console.error('Socket connection failed:', error.message)
        }

        socket.on('play', handlePlay)
        socket.on('change-song', handleChangeSong)
        socket.on('pause', handlePause)
        socket.on('connect_error', handleConnectError)
      } catch (error) {
        if (!cancelled && error.response?.status !== 401) {
          console.error('Could not check authentication before connecting socket:', error)
        }
      }
    }

    function handleAuthChanged() {
      if (socket) {
        disconnectSocket()
        socket = undefined
      }
      connectAuthenticatedUser()
    }

    connectAuthenticatedUser()
    window.addEventListener('loopify:auth-changed', handleAuthChanged)

    return () => {
      cancelled = true
      window.removeEventListener('loopify:auth-changed', handleAuthChanged)
      disconnectSocket()
    }
  }, [navigate, pauseFromRemote])

  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register" element={<Register />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/artist" element={<ArtistDirectory />} />
          <Route path="/artist/dashboard" element={<ArtistDashboard />} />
          <Route path="/artist/upload" element={<MusicUpload />} />
          <Route path="/artist/playlists/new" element={<CreatePlaylist />} />
          <Route path="/music/:id" element={<MusicPlayer />} />
          <Route path="/playlist/:id" element={<PlaylistDetail />} />
          <Route path="/liked" element={<LikedSongs />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
