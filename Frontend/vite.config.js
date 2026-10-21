import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_')
  const authTarget = env.VITE_AUTH_API_URL || 'http://localhost:3000'
  const musicTarget = env.VITE_MUSIC_API_URL || 'http://localhost:3002'

  return {
    plugins: [react()],
    server: {
      host: true,
      proxy: {
        '/api/auth': {
          target: authTarget,
          changeOrigin: true,
        },
        '/api/music': {
          target: musicTarget,
          changeOrigin: true,
        },
        '/socket.io': {
          target: musicTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  }
})
