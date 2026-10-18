import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes.jsx'
import { PlayerProvider } from '../features/player/context/PlayerContext.jsx'
import { MusicCatalogProvider } from '../features/music/context/MusicCatalogContext.jsx'
import GlobalPlayer from '../features/player/components/GlobalPlayer.jsx'
import { LikesProvider } from '../features/likes/context/LikesContext.jsx'
import { ThemeProvider } from '../features/theme/context/ThemeContext.jsx'
import '../styles/theme.css'
import '../styles/minimal.css'

export default function App() {
  useEffect(() => {
    const loader = document.getElementById('loopify-loader')
    if (!loader) return undefined

    let removalTimeoutId
    const exitFrameId = window.requestAnimationFrame(() => {
      loader.classList.add('is-exiting')
      removalTimeoutId = window.setTimeout(() => loader.remove(), 350)
    })

    return () => {
      window.cancelAnimationFrame(exitFrameId)
      window.clearTimeout(removalTimeoutId)
    }
  }, [])

  return (
    <BrowserRouter>
      <ThemeProvider>
        <PlayerProvider>
          <MusicCatalogProvider>
            <LikesProvider>
              <AppRoutes />
              <GlobalPlayer />
            </LikesProvider>
          </MusicCatalogProvider>
        </PlayerProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
