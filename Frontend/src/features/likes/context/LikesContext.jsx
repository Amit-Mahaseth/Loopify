/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useState } from 'react'

const LikesContext = createContext(null)
const LIKED_SONGS_KEY = 'loopify_liked_song_ids'

function loadLikedSongIds() {
  try {
    const value = JSON.parse(localStorage.getItem(LIKED_SONGS_KEY))
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export function LikesProvider({ children }) {
  const [likedSongIds, setLikedSongIds] = useState(loadLikedSongIds)

  const toggleLike = useCallback((track) => {
    const id = String(track._id || track.musicKey)
    setLikedSongIds(current => {
      const next = current.includes(id) ? current.filter(item => item !== id) : [...current, id]
      localStorage.setItem(LIKED_SONGS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return <LikesContext.Provider value={{ likedSongIds, toggleLike }}>{children}</LikesContext.Provider>
}

export function useLikes() {
  const likes = useContext(LikesContext)
  if (!likes) throw new Error('useLikes must be used within LikesProvider')
  return likes
}
