<template>
  <div v-if="note" class="h-full flex flex-col">
    <!-- Editor Header -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-2 mb-2">
        <button
          @click="goHome"
          class="px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Back to notes"
        >
          ← Back
        </button>
        <input
          v-model="title"
          @input="onTitleChange"
          type="text"
          placeholder="Note title..."
          class="flex-1 text-2xl font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
        />
        <button
          @click="manualSave"
          :disabled="!hasUnsavedChanges"
          class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Save now"
        >
          Save
        </button>
        <button
          @click="deleteNote"
          class="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
          title="Delete note"
        >
          Delete
        </button>
      </div>
      <div class="flex items-center gap-2">
        <input
          v-model="tagsInput"
          @blur="updateTags"
          @keydown.enter.prevent="updateTags"
          type="text"
          placeholder="Tags (comma-separated)"
          class="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <div class="flex items-center gap-2">
          <button
            @click="toggleEditMode"
            class="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            {{ editorMode === 'edit' ? 'Preview' : 'Edit' }}
          </button>
          <button
            @click="toggleSplitView"
            v-if="editorMode === 'preview'"
            class="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            {{ splitView ? 'Single' : 'Split' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Editor/Preview Area -->
    <div class="flex-1 overflow-hidden flex" :class="{ 'flex-row': splitView && editorMode === 'preview' }">
      <!-- Editor -->
      <div 
        v-if="editorMode === 'edit' || (editorMode === 'preview' && splitView)"
        class="flex-1 overflow-auto p-4 border-r border-gray-200 dark:border-gray-700"
        :class="{ 'w-1/2': splitView && editorMode === 'preview' }"
      >
        <textarea
          ref="editorRef"
          v-model="content"
          @input="onContentChange"
          placeholder="Start writing markdown..."
          class="w-full h-full resize-none border-none outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400 font-mono text-sm leading-relaxed"
        />
      </div>
      
      <!-- Preview -->
      <div 
        v-if="editorMode === 'preview'"
        class="flex-1 overflow-auto p-4 prose prose-sm dark:prose-invert max-w-none"
        :class="{ 'w-1/2': splitView }"
      >
        <div v-html="renderedMarkdown" class="markdown-content"></div>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
      <div class="flex justify-between items-center">
        <span>Updated: {{ formatTime(note.updatedAt) }}</span>
        <div class="flex items-center gap-3">
          <span v-if="hasUnsavedChanges" class="text-yellow-600 dark:text-yellow-400">
            ● Unsaved changes
            <span v-if="autoSaveEnabled && autoSaveCountdown > 0">
              (auto-saving in {{ Math.ceil(autoSaveCountdown / 1000) }}s)
            </span>
          </span>
          <span v-else class="text-green-600 dark:text-green-400">
            ✓ Saved
          </span>
        </div>
      </div>
    </div>
  </div>
  
  <div v-else class="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
    <div class="text-center">
      <p class="text-lg mb-2">No note selected</p>
      <p class="text-sm">Create a new note or select one from the sidebar</p>
      <button
        @click="goHome"
        class="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Go to Notes
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNotesStore } from '../stores/notes'
import { useSettingsStore } from '../stores/settings'
import { marked } from 'marked'

const route = useRoute()
const router = useRouter()
const notesStore = useNotesStore()
const settingsStore = useSettingsStore()

const note = computed(() => notesStore.selectedNote)
const title = ref('')
const content = ref('')
const tagsInput = ref('')
const editorRef = ref(null)
const editorMode = ref('edit') // 'edit' or 'preview'
const splitView = ref(false)

// Auto-save
const autoSaveTimer = ref(null)
const autoSaveCountdown = ref(0)
const countdownTimer = ref(null)
const hasUnsavedChanges = computed(() => {
  if (!note.value) return false
  return note.value.currentLocalHash !== note.value.originalHash
})

const autoSaveEnabled = computed(() => settingsStore.autoSaveEnabled)
const autoSaveDelay = computed(() => settingsStore.autoSaveDelay)

// Markdown rendering
const renderedMarkdown = computed(() => {
  if (!content.value) return '<p class="text-gray-400 italic">No content</p>'
  try {
    return marked.parse(content.value)
  } catch (error) {
    return '<p class="text-red-400">Error rendering markdown</p>'
  }
})

watch(note, (newNote) => {
  if (newNote) {
    title.value = newNote.title || ''
    content.value = newNote.content || ''
    tagsInput.value = newNote.tags?.join(', ') || ''
    cancelAutoSave()
  }
}, { immediate: true })

watch(() => route.params.id, (id) => {
  if (id) {
    notesStore.selectNote(id)
  }
}, { immediate: true })

onMounted(() => {
  settingsStore.loadSettings()
})

onUnmounted(() => {
  cancelAutoSave()
})

function onTitleChange() {
  if (note.value) {
    notesStore.updateNote(note.value.id, { title: title.value })
    scheduleAutoSave()
  }
}

function onContentChange() {
  if (note.value) {
    // Don't update immediately - wait for auto-save or manual save
    scheduleAutoSave()
  }
}

function scheduleAutoSave() {
  cancelAutoSave()
  
  if (!autoSaveEnabled.value) {
    return
  }
  
  // Start countdown
  autoSaveCountdown.value = autoSaveDelay.value
  countdownTimer.value = setInterval(() => {
    autoSaveCountdown.value -= 1000
    if (autoSaveCountdown.value <= 0) {
      clearInterval(countdownTimer.value)
      countdownTimer.value = null
    }
  }, 1000)
  
  // Schedule actual save
  autoSaveTimer.value = setTimeout(() => {
    saveNote()
  }, autoSaveDelay.value)
}

function cancelAutoSave() {
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value)
    autoSaveTimer.value = null
  }
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
    countdownTimer.value = null
  }
  autoSaveCountdown.value = 0
}

async function saveNote() {
  if (!note.value) return
  
  cancelAutoSave()
  await notesStore.updateNote(note.value.id, { 
    content: content.value,
    title: title.value
  })
}

async function manualSave() {
  await saveNote()
}

function updateTags() {
  if (note.value) {
    const tags = tagsInput.value
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)
    notesStore.updateNote(note.value.id, { tags })
    scheduleAutoSave()
  }
}

async function deleteNote() {
  if (note.value && confirm('Are you sure you want to delete this note?')) {
    cancelAutoSave()
    await notesStore.deleteNote(note.value.id)
    router.push('/')
  }
}

function goHome() {
  router.push('/')
}

function toggleEditMode() {
  editorMode.value = editorMode.value === 'edit' ? 'preview' : 'edit'
}

function toggleSplitView() {
  splitView.value = !splitView.value
}

function formatTime(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleString()
}
</script>

<style>
.markdown-content {
  @apply text-gray-900 dark:text-gray-100;
}

.markdown-content h1 {
  @apply text-3xl font-bold mt-6 mb-4;
}

.markdown-content h2 {
  @apply text-2xl font-bold mt-5 mb-3;
}

.markdown-content h3 {
  @apply text-xl font-bold mt-4 mb-2;
}

.markdown-content p {
  @apply mb-4;
}

.markdown-content ul, .markdown-content ol {
  @apply mb-4 ml-6;
}

.markdown-content li {
  @apply mb-2;
}

.markdown-content code {
  @apply bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono;
}

.markdown-content pre {
  @apply bg-gray-100 dark:bg-gray-800 p-4 rounded mb-4 overflow-x-auto;
}

.markdown-content pre code {
  @apply bg-transparent p-0;
}

.markdown-content blockquote {
  @apply border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-4;
}

.markdown-content a {
  @apply text-blue-600 dark:text-blue-400 hover:underline;
}

.markdown-content table {
  @apply w-full border-collapse mb-4;
}

.markdown-content th,
.markdown-content td {
  @apply border border-gray-300 dark:border-gray-600 px-4 py-2;
}

.markdown-content th {
  @apply bg-gray-100 dark:bg-gray-800 font-bold;
}
</style>
