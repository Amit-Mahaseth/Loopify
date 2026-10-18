import axios from 'axios'

export function fetchArtists() {
  return axios.get('/api/auth/artist', { withCredentials: true })
}

export function fetchArtistPlaylists() {
  return axios.get('/api/music/artist-playlists', { withCredentials: true })
}
