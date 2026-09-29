import axios from 'axios'

let pendingStatusRequest

export function getAuthStatus() {
  if (!pendingStatusRequest) {
    pendingStatusRequest = axios.get('http://localhost:3000/api/auth/status', { withCredentials: true })
      .finally(() => {
        pendingStatusRequest = null
      })
  }

  return pendingStatusRequest
}
