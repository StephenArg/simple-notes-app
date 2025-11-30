import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as db from '../services/db.js'
import { sha256 } from '../utils/hash.js'

export const useNotesStore = defineStore('notes', () => {
  const notes = ref([])
  const selectedNoteId = ref(null)
  const searchQuery = ref('')
  const selectedTag = ref(null)
  
  const selectedNote = computed(() => {
    return notes.value.find(n => n.id === selectedNoteId.value)
  })
  
  const filteredNotes = computed(() => {
    let filtered = notes.value.filter(n => {
      // Filter out deleted notes
      if (n.locallyDeleted || n.serverDeleted) return false
      // Filter out empty notes (Untitled with no content)
      const hasContent = n.content && n.content.trim().length > 0
      const hasTitle = n.title && n.title.trim().length > 0 && n.title.trim() !== 'Untitled'
      return hasContent || hasTitle
    })
    
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query)
      )
    }
    
    if (selectedTag.value) {
      filtered = filtered.filter(n => n.tags?.includes(selectedTag.value))
    }
    
    return filtered.sort((a, b) => 
      new Date(b.updatedAt) - new Date(a.updatedAt)
    )
  })
  
  const allTags = computed(() => {
    const tagSet = new Set()
    notes.value.forEach(note => {
      if (note.tags) {
        note.tags.forEach(tag => tagSet.add(tag))
      }
    })
    return Array.from(tagSet).sort()
  })
  
  async function loadNotes() {
    notes.value = await db.getAllNotes()
  }
  
  async function createNote(title = 'Untitled') {
    const id = `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    const content = ''
    const hash = await sha256(content)
    
    const note = {
      id,
      title,
      content,
      tags: [],
      createdAt: now,
      updatedAt: now,
      originalHash: hash,
      currentLocalHash: hash,
      serverDeleted: false,
      locallyDeleted: false
    }
    
    // Save to IndexedDB first
    await db.saveNote(note)
    // Then add to reactive array (use spread to ensure reactivity)
    notes.value = [...notes.value, note]
    selectedNoteId.value = id
    return note
  }
  
  async function updateNote(id, updates) {
    const note = notes.value.find(n => n.id === id)
    if (!note) return
    
    const updatedNote = {
      ...note,
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    // Recompute hash if content changed
    if (updates.content !== undefined) {
      updatedNote.currentLocalHash = await sha256(updates.content)
    }
    
    await db.saveNote(updatedNote)
    const index = notes.value.findIndex(n => n.id === id)
    if (index !== -1) {
      // Use Vue's reactive update - replace the entire array to ensure reactivity
      notes.value = [
        ...notes.value.slice(0, index),
        updatedNote,
        ...notes.value.slice(index + 1)
      ]
    }
  }
  
  async function deleteNote(id) {
    const note = notes.value.find(n => n.id === id)
    if (!note) return
    
    // Remove from local store immediately
    notes.value = notes.value.filter(n => n.id !== id)
    await db.deleteNote(id)
    
    if (selectedNoteId.value === id) {
      selectedNoteId.value = null
    }
    
    // Mark as locally deleted and try to sync
    const deletedNote = {
      ...note,
      locallyDeleted: true,
      updatedAt: new Date().toISOString()
    }
    await db.saveNote(deletedNote)
    
    // If online, try to delete on server immediately
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const { syncPush } = await import('../services/api.js')
        await syncPush([{ id, deleted: true }])
      } catch (error) {
        console.error('Failed to delete on server:', error)
        // Keep locally deleted flag for sync later
      }
    }
  }
  
  function selectNote(id) {
    selectedNoteId.value = id
  }
  
  function setSearchQuery(query) {
    searchQuery.value = query
  }
  
  function setSelectedTag(tag) {
    selectedTag.value = tag
  }
  
  return {
    notes,
    selectedNoteId,
    selectedNote,
    filteredNotes,
    allTags,
    searchQuery,
    selectedTag,
    loadNotes,
    createNote,
    updateNote,
    deleteNote,
    selectNote,
    setSearchQuery,
    setSelectedTag
  }
})

