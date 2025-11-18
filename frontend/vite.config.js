import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  root: './',
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps in production for security
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // UI library
          mui: [
            '@mui/material',
            '@mui/icons-material',
            '@mui/x-data-grid',
            '@mui/x-date-pickers',
            '@emotion/react',
            '@emotion/styled'
          ],
          // Mapping libraries
          maps: ['leaflet', 'react-leaflet'],
          // Charts and visualization
          charts: ['chart.js', 'react-chartjs-2'],
          // Utilities
          utils: ['axios', 'date-fns', 'dayjs', 'lodash']
        }
      }
    },
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000,
    // Proxy API requests to backend during development
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@mui/icons-material',
      'leaflet',
      'chart.js'
    ]
  }
})
