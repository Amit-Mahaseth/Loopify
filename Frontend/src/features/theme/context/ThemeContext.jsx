/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'

const ThemeContext = createContext(null)
const THEME_KEY = 'loopify_theme'

function getInitialTheme() {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return 'dark'
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme)

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const setTheme = useCallback((nextTheme) => {
    setThemeState(prev => {
      const resolved = typeof nextTheme === 'function' ? nextTheme(prev) : nextTheme
      return resolved === 'light' ? 'light' : 'dark'
    })
  }, [])

  const toggleTheme = useCallback((event) => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    const applyTheme = () => {
      flushSync(() => setThemeState(nextTheme))
      localStorage.setItem(THEME_KEY, nextTheme)
      document.documentElement.setAttribute('data-theme', nextTheme)
    }
    const button = event?.currentTarget

    if (
      !button
      || typeof document.startViewTransition !== 'function'
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      applyTheme()
      return
    }

    const bounds = button.getBoundingClientRect()
    const x = bounds.left + bounds.width / 2
    const y = bounds.top + bounds.height / 2
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    )
    const rootStyle = document.documentElement.style

    rootStyle.setProperty('--theme-reveal-x', `${x}px`)
    rootStyle.setProperty('--theme-reveal-y', `${y}px`)
    rootStyle.setProperty('--theme-reveal-radius', `${radius}px`)

    const transition = document.startViewTransition(applyTheme)
    const clearRevealPosition = () => {
      rootStyle.removeProperty('--theme-reveal-x')
      rootStyle.removeProperty('--theme-reveal-y')
      rootStyle.removeProperty('--theme-reveal-radius')
    }

    transition.finished.then(clearRevealPosition, clearRevealPosition)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
