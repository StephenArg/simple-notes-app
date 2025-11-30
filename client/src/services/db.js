import { openDB } from 'idb'

const DB_NAME = 'notes-app'
const DB_VERSION = 1
const STORE_NOTES = 'notes'
const STORE_SYNC_META = 'syncMeta'

/**
 * Initialize IndexedDB
 */
export async function initDB() {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Notes store
      if (!db.objectStoreNames.contains(STORE_NOTES)) {
        const notesStore = db.createObjectStore(STORE_NOTES, { keyPath: 'id' })
        notesStore.createIndex('updatedAt', 'updatedAt')
        notesStore.createIndex('tags', 'tags', { multiEntry: true })
      }
      
      // Sync metadata store
      if (!db.objectStoreNames.contains(STORE_SYNC_META)) {
        db.createObjectStore(STORE_SYNC_META, { keyPath: 'key' })
      }
    }
  })
  return db
}

/**
 * Get all notes from IndexedDB
 */
export async function getAllNotes() {
  const db = await initDB()
  return await db.getAll(STORE_NOTES)
}

/**
 * Get a note by ID
 */
export async function getNote(id) {
  const db = await initDB()
  return await db.get(STORE_NOTES, id)
}

/**
 * Save a note to IndexedDB
 */
export async function saveNote(note) {
  const db = await initDB()
  return await db.put(STORE_NOTES, note)
}

/**
 * Delete a note from IndexedDB
 */
export async function deleteNote(id) {
  const db = await initDB()
  return await db.delete(STORE_NOTES, id)
}

/**
 * Get sync metadata
 */
export async function getSyncMeta() {
  const db = await initDB()
  const meta = await db.get(STORE_SYNC_META, 'meta')
  return meta?.value || { lastSyncAt: null }
}

/**
 * Save sync metadata
 */
export async function saveSyncMeta(meta) {
  const db = await initDB()
  return await db.put(STORE_SYNC_META, { key: 'meta', value: meta })
}

/**
 * Get notes by tag
 */
export async function getNotesByTag(tag) {
  const db = await initDB()
  const tx = db.transaction(STORE_NOTES, 'readonly')
  const index = tx.store.index('tags')
  return await index.getAll(tag)
}

/**
 * Search notes by title/content
 */
export async function searchNotes(query) {
  const notes = await getAllNotes()
  const lowerQuery = query.toLowerCase()
  return notes.filter(note => 
    note.title.toLowerCase().includes(lowerQuery) ||
    note.content.toLowerCase().includes(lowerQuery)
  )
}

