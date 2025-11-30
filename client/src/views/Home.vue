<template>
  <div class="flex h-screen">
    <!-- Sidebar -->
    <aside class="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <!-- Header -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Notes</h1>
        <div class="mt-2 flex gap-2">
          <button
            @click="createNewNote"
            class="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            New Note
          </button>
          <button
            @click="syncNow"
            :disabled="isSyncing"
            class="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
            :title="isSyncing ? 'Syncing...' : 'Sync now'"
          >
            {{ isSyncing ? '⏳' : '🔄' }}
          </button>
          <button
            @click="showSettings = !showSettings"
            class="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            title="Settings"
          >
            ⚙️
          </button>
        </div>
        
        <!-- Settings Panel -->
        <div v-if="showSettings" class="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Settings</h3>
          <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              v-model="settingsStore.autoSaveEnabled"
              @change="settingsStore.setAutoSaveEnabled(settingsStore.autoSaveEnabled)"
              class="rounded"
            />
            <span>Auto-save enabled</span>
          </label>
          <div v-if="settingsStore.autoSaveEnabled" class="mt-2">
            <label class="text-xs text-gray-600 dark:text-gray-400">
              Auto-save delay: {{ settingsStore.autoSaveDelay / 1000 }}s
            </label>
            <input
              type="range"
              :value="settingsStore.autoSaveDelay"
              @input="settingsStore.setAutoSaveDelay(parseInt($event.target.value))"
              min="5000"
              max="60000"
              step="5000"
              class="w-full mt-1"
            />
          </div>
        </div>
      </div>
      
      <!-- Search -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <input
          v-model="searchQuery"
          @input="notesStore.setSearchQuery(searchQuery)"
          type="text"
          placeholder="Search notes..."
          class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
        />
      </div>
      
      <!-- Tags -->
      <div v-if="allTags.length > 0" class="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Tags</h2>
        <div class="flex flex-wrap gap-1">
          <button
            v-for="tag in allTags"
            :key="tag"
            @click="toggleTag(tag)"
            :class="[
              'px-2 py-1 text-xs rounded',
              selectedTag === tag
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            ]"
          >
            {{ tag }}
          </button>
        </div>
      </div>
      
      <!-- Notes List -->
      <div class="flex-1 overflow-y-auto">
        <div v-if="filteredNotes.length === 0" class="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
          No notes found
        </div>
        <button
          v-for="note in filteredNotes"
          :key="note.id"
          @click="selectNote(note.id)"
          :class="[
            'w-full text-left p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
            selectedNoteId === note.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
          ]"
        >
          <div class="font-medium text-gray-900 dark:text-white truncate">
            {{ note.title || 'Untitled' }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
            {{ previewContent(note.content) }}
          </div>
          <div v-if="note.tags && note.tags.length > 0" class="flex gap-1 mt-2">
            <span
              v-for="tag in note.tags"
              :key="tag"
              class="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
            >
              {{ tag }}
            </span>
          </div>
        </button>
      </div>
      
      <!-- Status -->
      <div class="p-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        <div class="flex items-center gap-2">
          <span :class="isOnline ? 'text-green-500' : 'text-red-500'">
            {{ isOnline ? '●' : '○' }}
          </span>
          <span>{{ isOnline ? 'Online' : 'Offline' }}</span>
        </div>
        <div v-if="lastSyncAt" class="mt-1">
          Synced: {{ formatTime(lastSyncAt) }}
        </div>
      </div>
    </aside>
    
    <!-- Main Content -->
    <main class="flex-1 overflow-hidden">
      <router-view />
    </main>
    
    <!-- Conflict Resolution Modal -->
    <ConflictResolution
      v-if="conflicts.length > 0"
      :conflicts="conflicts"
      @resolved="handleConflictResolved"
      @close="handleConflictClose"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotesStore } from '../stores/notes'
import { useSyncStore } from '../stores/sync'
import { useSettingsStore } from '../stores/settings'
import ConflictResolution from '../components/ConflictResolution.vue'

const router = useRouter()
const notesStore = useNotesStore()
const syncStore = useSyncStore()
const settingsStore = useSettingsStore()

const searchQuery = ref('')
const showSettings = ref(false)
const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
const selectedNoteId = computed(() => notesStore.selectedNoteId)
const filteredNotes = computed(() => notesStore.filteredNotes)
const allTags = computed(() => notesStore.allTags)
const selectedTag = computed(() => notesStore.selectedTag)
const isSyncing = computed(() => syncStore.isSyncing)
const lastSyncAt = computed(() => syncStore.lastSyncAt)
const conflicts = computed(() => syncStore.conflicts)

// Update online status
function updateOnlineStatus() {
  if (typeof navigator !== 'undefined') {
    isOnline.value = navigator.onLine
  }
}

onMounted(() => {
  updateOnlineStatus()
  if (typeof window !== 'undefined') {
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('online', updateOnlineStatus)
    window.removeEventListener('offline', updateOnlineStatus)
  }
})

function previewContent(content) {
  if (!content) return 'No content'
  const text = content.replace(/#{1,6}\s+/g, '').replace(/\*\*/g, '').trim()
  return text.substring(0, 60) + (text.length > 60 ? '...' : '')
}

function formatTime(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString()
}

async function createNewNote() {
  const note = await notesStore.createNote()
  router.push(`/note/${note.id}`)
}

function selectNote(id) {
  notesStore.selectNote(id)
  router.push(`/note/${id}`)
}

function toggleTag(tag) {
  if (selectedTag.value === tag) {
    notesStore.setSelectedTag(null)
  } else {
    notesStore.setSelectedTag(tag)
  }
}

async function syncNow() {
  await syncStore.sync()
}

function handleConflictResolved() {
  // Conflicts handled by component
  // Reload notes after resolution
  notesStore.loadNotes()
}

function handleConflictClose() {
  // Close handler if needed
}
</script>

