import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,  // Allow external access (Docker)
    open: true,
    proxy: {
      '/api': {
        target: 'http://server:5000',  // Matches the backend service name in docker-compose.yml
        changeOrigin: true,
        secure: false
      },
    },
    allowedHosts: true
  }
})
