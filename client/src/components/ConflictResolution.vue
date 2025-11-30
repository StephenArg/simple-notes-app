<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-[90vh] flex flex-col">
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          Conflict Resolution
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          This note has been modified on both the server and locally. Choose which version to keep.
        </p>
      </div>
      
      <div class="flex-1 overflow-auto p-4">
        <div v-if="conflicts.length === 0" class="text-center text-gray-500 dark:text-gray-400 py-8">
          No conflicts to resolve
        </div>
        <div
          v-for="conflict in conflicts"
          :key="conflict.localNote?.id || conflict.id"
          class="mb-6 last:mb-0"
        >
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {{ conflict.localNote?.title || conflict.title || 'Untitled' }}
          </h3>
          
          <div class="grid grid-cols-2 gap-4">
            <!-- Server Version -->
            <div class="border border-gray-300 dark:border-gray-600 rounded p-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Server Version
                </span>
                <button
                  @click="resolveConflict(conflict.localNote?.id || conflict.id, 'server')"
                  class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Use This
                </button>
              </div>
              <pre class="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded max-h-64 overflow-auto">{{ conflict.serverNote?.content || '' }}</pre>
            </div>
            
            <!-- Local Version -->
            <div class="border border-gray-300 dark:border-gray-600 rounded p-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Local Version
                </span>
                <button
                  @click="resolveConflict(conflict.localNote?.id || conflict.id, 'local')"
                  class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Use This
                </button>
              </div>
              <pre class="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded max-h-64 overflow-auto">{{ conflict.localNote?.content || '' }}</pre>
            </div>
          </div>
        </div>
      </div>
      
      <div class="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useNotesStore } from '../stores/notes'
import { useSyncStore } from '../stores/sync'
import * as db from '../services/db.js'
import * as api from '../services/api.js'
import { sha256 } from '../utils/hash.js'

const props = defineProps({
  conflicts: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['resolved', 'close'])
const notesStore = useNotesStore()
const syncStore = useSyncStore()

async function resolveConflict(noteId, resolution) {
  const conflict = props.conflicts.find(c => (c.localNote?.id || c.id) === noteId)
  if (!conflict) return
  
  const localNote = conflict.localNote || conflict
  const serverNote = conflict.serverNote || {}
  
  let finalContent
  if (resolution === 'server') {
    finalContent = serverNote.content || ''
  } else {
    finalContent = localNote.content || ''
  }
  
  const finalHash = await sha256(finalContent)
  
  // Update local note
  const updatedNote = {
    ...localNote,
    content: finalContent,
    currentLocalHash: finalHash,
    originalHash: finalHash,
    title: resolution === 'server' ? (serverNote.title || localNote.title) : localNote.title,
    tags: resolution === 'server' ? (serverNote.tags || localNote.tags || []) : (localNote.tags || []),
    updatedAt: new Date().toISOString()
  }
  
  await db.saveNote(updatedNote)
  
  // Push to server
  try {
    await api.syncPush([{
      id: noteId,
      content: finalContent,
      hash: finalHash,
      originalHash: localNote.originalHash || '',
      title: updatedNote.title,
      tags: updatedNote.tags
    }])
  } catch (error) {
    console.error('Failed to push resolved conflict:', error)
  }
  
  // Remove from conflicts
  syncStore.resolveConflict(noteId)
  
  // Reload notes
  await notesStore.loadNotes()
  
  emit('resolved', noteId)
  
  // If no more conflicts, close modal
  if (syncStore.conflicts.length === 0) {
    emit('close')
  }
}
</script>

