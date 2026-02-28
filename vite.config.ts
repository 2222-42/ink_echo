/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // When running npm run dev (Vite), proxy /api to the local Vercel server (vercel dev)
      // Note: You must run `vercel dev` in a separate terminal OR we map Vite as the frontend explicitly.
      // Usually, `vercel dev` takes over the frontend completely on port 3000, but if you access Vite directly on 5173, it needs this:
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
  },
})
