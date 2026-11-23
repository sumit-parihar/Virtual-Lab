import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // allowedHosts: lets a Cloudflare quick tunnel (*.trycloudflare.com) reach the dev server for demos.
  server: { port: 5173, allowedHosts: [".trycloudflare.com"] },
  build: {
    rollupOptions: {
      output: {
        // Shared libraries get their own files so pages load only what they need.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.test.{js,jsx}'],
  },
})
