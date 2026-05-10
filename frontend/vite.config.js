import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/static/frontend/',
  build: {
    outDir: '../static/frontend',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/app.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/login': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/dashboard': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/register': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/forgot_password': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/logout': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/resume_builder': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/upload_resume': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/submit_feedback': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/chat': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/static': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      }

    }
  }
})
