import axios from 'axios'

export function updateProfile(formData) {
  return axios.post('/api/auth/update', formData, { withCredentials: true })
}
