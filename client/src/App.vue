<template>
  <div id="app" class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useSyncStore } from './stores/sync'

const syncStore = useSyncStore()

onMounted(() => {
  // Load notes from IndexedDB on startup
  syncStore.loadLocalNotes()
  
  // If online, sync with server
  if (navigator.onLine) {
    syncStore.sync()
  }
  
  // Listen for online event
  window.addEventListener('online', () => {
    syncStore.sync()
  })
})
</script>

