import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/entries': 'http://localhost:3000',
      '/auth': 'http://localhost:3000',
      '/settings': 'http://localhost:3000',
      '/absences': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
    },
  },
})
