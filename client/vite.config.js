import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt'],
      workbox: {
        // Precache all static assets - VitePWA automatically includes all build output
        // The globPatterns tell it what to include from the dist folder
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot,json,webmanifest}'
        ],
        // Exclude service worker files from precaching
        globIgnores: [
          '**/node_modules/**/*',
          '**/sw.js',
          '**/sw.js.map',
          '**/workbox-*.js',
          '**/workbox-*.js.map',
          '**/manifest.webmanifest'
        ],
        // Maximum file size to precache (50MB)
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,
        // Ensure all HTML files are precached
        manifestTransforms: [
          async (entries) => {
            // Ensure index.html is always in the manifest
            const hasIndex = entries.some(entry => entry.url === '/index.html' || entry.url === 'index.html')
            if (!hasIndex) {
              entries.push({
                url: '/index.html',
                revision: null // Let workbox handle revisioning
              })
            }
            return { manifest: entries }
          }
        ],
        runtimeCaching: [
          {
            urlPattern: /\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              }
            }
          }
        ],
        // Use navigateFallback to serve index.html for all routes when offline
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/_/, /\/[^/?]+\.[^/]+$/],
        // Clean up old caches
        cleanupOutdatedCaches: true,
        // Skip waiting to activate immediately
        skipWaiting: true,
        clientsClaim: true
      },
      manifest: {
        name: 'Notes App',
        short_name: 'Notes',
        description: 'Offline-first notes app',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})

