import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as db from '../services/db.js'
import { syncAll } from '../services/sync.js'
import { useNotesStore } from './notes.js'
import { useAuthStore } from './auth.js'

export const useSyncStore = defineStore('sync', () => {
  const isSyncing = ref(false)
  const lastSyncAt = ref(null)
  const syncError = ref(null)
  const conflicts = ref([])
  
  async function loadLocalNotes() {
    const notesStore = useNotesStore()
    await notesStore.loadNotes()
    
    const meta = await db.getSyncMeta()
    lastSyncAt.value = meta.lastSyncAt
  }
  
  async function sync() {
    if (isSyncing.value) return
    if (typeof navigator === 'undefined' || !navigator.onLine) {
      console.log('Offline: cannot sync')
      return
    }
    
    // Check authentication
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated) {
      console.log('Not authenticated: cannot sync')
      return
    }
    
    isSyncing.value = true
    syncError.value = null
    
    try {
      const result = await syncAll()
      
      if (result.success) {
        lastSyncAt.value = new Date().toISOString()
        conflicts.value = result.conflicts || []
        
        // Reload notes after sync
        const notesStore = useNotesStore()
        await notesStore.loadNotes()
        
        return result
      } else {
        syncError.value = result.reason || 'Sync failed'
        return result
      }
    } catch (error) {
      syncError.value = error.message
      console.error('Sync error:', error)
      return { success: false, reason: error.message }
    } finally {
      isSyncing.value = false
    }
  }
  
  function resolveConflict(conflictId) {
    // Remove from conflicts list
    conflicts.value = conflicts.value.filter(c => {
      const id = c.localNote?.id || c.id
      return id !== conflictId
    })
  }
  
  return {
    isSyncing,
    lastSyncAt,
    syncError,
    conflicts,
    loadLocalNotes,
    sync,
    resolveConflict
  }
})

