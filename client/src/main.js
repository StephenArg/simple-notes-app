import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

// Service worker registration is handled by vite-plugin-pwa
// It will automatically register in both dev and production
// Check if service worker is registered
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      if (registrations.length > 0) {
        console.log('Service Worker registered:', registrations[0].scope)
        // Check what's in the cache
        caches.keys().then(cacheNames => {
          console.log('Available caches:', cacheNames)
          cacheNames.forEach(cacheName => {
            caches.open(cacheName).then(cache => {
              cache.keys().then(keys => {
                console.log(`Cache "${cacheName}" contains ${keys.length} items`)
                if (keys.length > 0) {
                  console.log('Sample cached URLs:', keys.slice(0, 5).map(k => k.url))
                }
              })
            })
          })
        })
      } else {
        console.warn('No service worker registered')
      }
    })
  })
}

