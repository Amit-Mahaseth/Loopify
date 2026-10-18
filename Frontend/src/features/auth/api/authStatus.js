import axios from 'axios'

let pendingStatusRequest

export function getAuthStatus() {
  if (!pendingStatusRequest) {
    pendingStatusRequest = axios.get('/api/auth/status', { withCredentials: true })
      .finally(() => {
        pendingStatusRequest = null
      })
  }

  return pendingStatusRequest
}
