import axios from 'axios'

const MUSIC_API = '/api/music'

export function fetchPlaylists() {
  return axios.get(`${MUSIC_API}/playlist`, { withCredentials: true })
}

export function createPlaylist(formData) {
  return axios.post(`${MUSIC_API}/playlist`, formData, { withCredentials: true })
}
