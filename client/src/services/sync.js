import * as db from './db.js'
import * as api from './api.js'
import { sha256 } from '../utils/hash.js'

/**
 * Sync service implementing the sync state machine
 */

/**
 * Determine sync action for a note
 */
export function determineSyncAction(note, serverNote) {
  const {
    originalHash,
    currentLocalHash,
    locallyDeleted,
    serverDeleted
  } = note
  
  const serverHash = serverNote?.hash
  const isServerDeleted = serverNote?.deleted || false
  
  // Case A: No changes anywhere
  if (
    originalHash === currentLocalHash &&
    originalHash === serverHash &&
    !isServerDeleted &&
    !locallyDeleted
  ) {
    return { action: 'none' }
  }
  
  // Case B: Local-only edits (server unchanged)
  if (
    originalHash === serverHash &&
    currentLocalHash !== originalHash &&
    !isServerDeleted &&
    !locallyDeleted
  ) {
    return { action: 'push', note }
  }
  
  // Case C: Server-only edits (client unchanged)
  if (
    originalHash === currentLocalHash &&
    serverHash !== originalHash &&
    !isServerDeleted &&
    !locallyDeleted
  ) {
    return { action: 'pull', serverNote }
  }
  
  // Case D: Both sides changed → conflict
  if (
    originalHash !== currentLocalHash &&
    serverHash &&
    originalHash !== serverHash &&
    !isServerDeleted &&
    !locallyDeleted
  ) {
    return { 
      action: 'conflict', 
      localNote: note, 
      serverNote: serverNote || { id: note.id, hash: '', content: '', deleted: false }
    }
  }
  
  // Case E: Server says deleted, no local changes
  if (
    isServerDeleted &&
    currentLocalHash === originalHash &&
    !locallyDeleted
  ) {
    return { action: 'delete_local', noteId: note.id }
  }
  
  // Case F: Server says deleted, but local edits exist (resurrection)
  if (
    isServerDeleted &&
    currentLocalHash !== originalHash &&
    !locallyDeleted
  ) {
    return { action: 'resurrect', note }
  }
  
  // Case G: Local deletion while server has no changes
  if (
    locallyDeleted &&
    serverHash === originalHash &&
    !isServerDeleted
  ) {
    return { action: 'delete_server', noteId: note.id }
  }
  
  // Default: push local changes
  if (locallyDeleted && !isServerDeleted) {
    return { action: 'delete_server', noteId: note.id }
  }
  
  if (currentLocalHash !== originalHash && !locallyDeleted) {
    return { action: 'push', note }
  }
  
  return { action: 'none' }
}

/**
 * Sync all notes
 */
export async function syncAll() {
  if (typeof navigator === 'undefined' || !navigator.onLine) {
    console.log('Offline: skipping sync')
    return { success: false, reason: 'offline' }
  }
  
  try {
    // Get sync metadata
    const syncMeta = await db.getSyncMeta()
    const lastSyncAt = syncMeta.lastSyncAt
    
    // Pull changes from server
    const serverNotes = await api.syncPull(lastSyncAt)
    
    // Get all local notes
    const localNotes = await db.getAllNotes()
    
    // Build server notes map
    const serverNotesMap = new Map()
    serverNotes.forEach(note => {
      serverNotesMap.set(note.id, note)
    })
    
    // Determine actions for each note
    const actions = []
    const conflicts = []
    
    // Process local notes
    for (const localNote of localNotes) {
      const serverNote = serverNotesMap.get(localNote.id)
      const action = determineSyncAction(localNote, serverNote)
      
      if (action.action === 'conflict') {
        conflicts.push(action)
      } else {
        actions.push(action)
      }
    }
    
    // Process server-only notes (new notes from server)
    for (const serverNote of serverNotes) {
      if (!localNotes.find(n => n.id === serverNote.id)) {
        if (!serverNote.deleted) {
          actions.push({ action: 'pull', serverNote })
        }
      }
    }
  
    // Prepare push changes
    const pushChanges = []
    for (const action of actions) {
      if (action.action === 'push') {
        pushChanges.push({
          id: action.note.id,
          content: action.note.content,
          hash: action.note.currentLocalHash,
          originalHash: action.note.originalHash,
          tags: action.note.tags,
          title: action.note.title
        })
      } else if (action.action === 'resurrect') {
        pushChanges.push({
          id: action.note.id,
          content: action.note.content,
          hash: action.note.currentLocalHash,
          originalHash: action.note.originalHash,
          tags: action.note.tags,
          title: action.note.title,
          undelete: true
        })
      } else if (action.action === 'delete_server') {
        pushChanges.push({
          id: action.noteId,
          deleted: true
        })
      }
    }
    
    // Push changes to server
    if (pushChanges.length > 0) {
      await api.syncPush(pushChanges)
    }
    
    // Apply pull actions locally
    for (const action of actions) {
      if (action.action === 'pull') {
        const serverNote = action.serverNote
        const newHash = serverNote.hash
        await db.saveNote({
          id: serverNote.id,
          title: serverNote.title,
          content: serverNote.content,
          tags: serverNote.tags || [],
          createdAt: serverNote.createdAt,
          updatedAt: serverNote.updatedAt,
          originalHash: newHash,
          currentLocalHash: newHash,
          serverDeleted: serverNote.deleted || false,
          locallyDeleted: false
        })
      } else if (action.action === 'delete_local') {
        await db.deleteNote(action.noteId)
      } else if (action.action === 'push' || action.action === 'resurrect') {
        // Update local note after successful push
        const note = action.note
        const newHash = note.currentLocalHash
        await db.saveNote({
          ...note,
          originalHash: newHash,
          serverDeleted: false,
          locallyDeleted: false
        })
      }
    }
    
    // Update sync metadata
    await db.saveSyncMeta({
      lastSyncAt: new Date().toISOString()
    })
    
    return {
      success: true,
      conflicts,
      actionsProcessed: actions.length
    }
  } catch (error) {
    console.error('Sync failed:', error)
    return {
      success: false,
      reason: error.message
    }
  }
}

