import axios from 'axios'

const MUSIC_API = '/api/music'

export function fetchMusicCatalog() {
  return axios.get(MUSIC_API, { withCredentials: true })
}

export function fetchArtistMusic() {
  return axios.get(`${MUSIC_API}/artist-music`, { withCredentials: true })
}

export function uploadMusic(formData) {
  return axios.post(`${MUSIC_API}/upload`, formData, { withCredentials: true })
}
