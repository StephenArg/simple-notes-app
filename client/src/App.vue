<template>
  <div id="app" class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useSyncStore } from './stores/sync'
import { useSettingsStore } from './stores/settings'

const syncStore = useSyncStore()
const settingsStore = useSettingsStore()

onMounted(() => {
  // Load settings
  settingsStore.loadSettings()
  
  // Load notes from IndexedDB on startup
  syncStore.loadLocalNotes()
  
  // If online, sync with server
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    syncStore.sync()
  }
  
  // Listen for online event
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      syncStore.sync()
    })
  }
})
</script>

