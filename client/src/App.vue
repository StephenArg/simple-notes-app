<template>
  <div id="app" class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useSyncStore } from './stores/sync'
import { useSettingsStore } from './stores/settings'
import { useAuthStore } from './stores/auth'

const syncStore = useSyncStore()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()

onMounted(async () => {
  // Load settings
  settingsStore.loadSettings()
  
  // Check authentication
  await authStore.checkAuth()
  
  // Load notes from IndexedDB on startup
  syncStore.loadLocalNotes()
  
  // If online and authenticated, sync with server
  if (typeof navigator !== 'undefined' && navigator.onLine && authStore.isAuthenticated) {
    syncStore.sync()
  }
  
  // Listen for online event
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      if (authStore.isAuthenticated) {
        syncStore.sync()
      }
    })
  }
})
</script>

