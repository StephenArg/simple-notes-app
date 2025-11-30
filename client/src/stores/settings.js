import { defineStore } from 'pinia'
import { ref } from 'vue'
import { openDB } from 'idb'

const DB_NAME = 'notes-app'
const DB_VERSION = 1
const STORE_SYNC_META = 'syncMeta'

export const useSettingsStore = defineStore('settings', () => {
  const autoSaveEnabled = ref(true)
  const autoSaveDelay = ref(25000) // 25 seconds in milliseconds
  const editorMode = ref('wysiwyg') // 'wysiwyg' or 'markdown'
  const showPreview = ref(true) // Show preview pane
  
  const SETTINGS_KEY = 'app-settings'
  
  async function loadSettings() {
    try {
      const db = await openDB(DB_NAME, DB_VERSION)
      const stored = await db.get(STORE_SYNC_META, 'settings')
      if (stored?.value) {
        autoSaveEnabled.value = stored.value.autoSaveEnabled ?? true
        autoSaveDelay.value = stored.value.autoSaveDelay ?? 25000
        editorMode.value = stored.value.editorMode ?? 'wysiwyg'
        showPreview.value = stored.value.showPreview ?? true
      }
    } catch (error) {
      // If no settings exist, use defaults
      console.log('No saved settings, using defaults')
    }
  }
  
  async function saveSettings() {
    try {
      const db = await openDB(DB_NAME, DB_VERSION)
      await db.put(STORE_SYNC_META, {
        key: 'settings',
        value: {
          autoSaveEnabled: autoSaveEnabled.value,
          autoSaveDelay: autoSaveDelay.value,
          editorMode: editorMode.value,
          showPreview: showPreview.value
        }
      })
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }
  
  function setAutoSaveEnabled(enabled) {
    autoSaveEnabled.value = enabled
    saveSettings()
  }
  
  function setAutoSaveDelay(delay) {
    autoSaveDelay.value = delay
    saveSettings()
  }
  
  function setEditorMode(mode) {
    editorMode.value = mode
    saveSettings()
  }
  
  function setShowPreview(show) {
    showPreview.value = show
    saveSettings()
  }
  
  return {
    autoSaveEnabled,
    autoSaveDelay,
    editorMode,
    showPreview,
    loadSettings,
    saveSettings,
    setAutoSaveEnabled,
    setAutoSaveDelay,
    setEditorMode,
    setShowPreview
  }
})

