/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'

const MusicCatalogContext = createContext(null)

export function MusicCatalogProvider({ children }) {
  const [tracks, setTracks] = useState(null)

  return (
    <MusicCatalogContext.Provider value={{ tracks, setTracks }}>
      {children}
    </MusicCatalogContext.Provider>
  )
}

export function useMusicCatalog() {
  const catalog = useContext(MusicCatalogContext)
  if (!catalog) throw new Error('useMusicCatalog must be used within MusicCatalogProvider')
  return catalog
}
