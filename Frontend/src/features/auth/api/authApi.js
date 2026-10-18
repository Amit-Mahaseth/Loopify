import axios from 'axios'

export function loginUser(form) {
  return axios.post('/api/auth/login', form, {
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  })
}

export function registerUser(form) {
  return axios.post('/api/auth/register', form, { withCredentials: true })
}

export function requestPasswordReset(email) {
  return axios.post('/api/auth/forgot-password', { email })
}

export function resetPassword(form) {
  return axios.post('/api/auth/reset-password', form)
}

export function logoutUser() {
  return axios.post('/api/auth/logout', {}, { withCredentials: true })
}
