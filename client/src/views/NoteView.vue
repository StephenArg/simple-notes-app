<template>
  <div v-if="note" class="h-full flex flex-col">
    <!-- Editor Header -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <input
        v-model="title"
        @input="updateTitle"
        type="text"
        placeholder="Note title..."
        class="w-full text-2xl font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
      />
      <div class="mt-2 flex items-center gap-2">
        <input
          v-model="tagsInput"
          @blur="updateTags"
          @keydown.enter.prevent="updateTags"
          type="text"
          placeholder="Tags (comma-separated)"
          class="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <button
          @click="deleteNote"
          class="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
        >
          Delete
        </button>
      </div>
    </div>
    
    <!-- Editor -->
    <div class="flex-1 overflow-auto p-4">
      <textarea
        v-model="content"
        @input="updateContent"
        placeholder="Start writing..."
        class="w-full h-full resize-none border-none outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400 font-mono text-sm leading-relaxed"
      />
    </div>
    
    <!-- Footer -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
      <div class="flex justify-between">
        <span>Updated: {{ formatTime(note.updatedAt) }}</span>
        <span v-if="note.currentLocalHash !== note.originalHash" class="text-yellow-600 dark:text-yellow-400">
          ● Unsaved changes
        </span>
      </div>
    </div>
  </div>
  
  <div v-else class="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
    <div class="text-center">
      <p class="text-lg mb-2">No note selected</p>
      <p class="text-sm">Create a new note or select one from the sidebar</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNotesStore } from '../stores/notes'

const route = useRoute()
const router = useRouter()
const notesStore = useNotesStore()

const note = computed(() => notesStore.selectedNote)
const title = ref('')
const content = ref('')
const tagsInput = ref('')

watch(note, (newNote) => {
  if (newNote) {
    title.value = newNote.title || ''
    content.value = newNote.content || ''
    tagsInput.value = newNote.tags?.join(', ') || ''
  }
}, { immediate: true })

watch(() => route.params.id, (id) => {
  if (id) {
    notesStore.selectNote(id)
  }
}, { immediate: true })

function updateTitle() {
  if (note.value) {
    notesStore.updateNote(note.value.id, { title: title.value })
  }
}

function updateContent() {
  if (note.value) {
    notesStore.updateNote(note.value.id, { content: content.value })
  }
}

function updateTags() {
  if (note.value) {
    const tags = tagsInput.value
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)
    notesStore.updateNote(note.value.id, { tags })
  }
}

async function deleteNote() {
  if (note.value && confirm('Are you sure you want to delete this note?')) {
    await notesStore.deleteNote(note.value.id)
    router.push('/')
  }
}

function formatTime(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleString()
}
</script>

