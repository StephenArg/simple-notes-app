const API_BASE = import.meta.env.VITE_API_BASE || '/api'

/**
 * Fetch notes from server
 */
export async function fetchNotes() {
  const response = await fetch(`${API_BASE}/notes`)
  if (!response.ok) throw new Error('Failed to fetch notes')
  return await response.json()
}

/**
 * Fetch a single note
 */
export async function fetchNote(id) {
  const response = await fetch(`${API_BASE}/notes/${id}`)
  if (!response.ok) throw new Error('Failed to fetch note')
  return await response.json()
}

/**
 * Create a note on server
 */
export async function createNote(note) {
  const response = await fetch(`${API_BASE}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note)
  })
  if (!response.ok) throw new Error('Failed to create note')
  return await response.json()
}

/**
 * Update a note on server
 */
export async function updateNote(id, note) {
  const response = await fetch(`${API_BASE}/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note)
  })
  if (!response.ok) throw new Error('Failed to update note')
  return await response.json()
}

/**
 * Delete a note on server
 */
export async function deleteNoteOnServer(id) {
  const response = await fetch(`${API_BASE}/notes/${id}`, {
    method: 'DELETE'
  })
  if (!response.ok) throw new Error('Failed to delete note')
  return await response.json()
}

/**
 * Sync: Get notes changed since timestamp
 */
export async function syncPull(since) {
  const url = since 
    ? `${API_BASE}/sync/notes?since=${encodeURIComponent(since)}`
    : `${API_BASE}/sync/notes`
  const response = await fetch(url)
  if (!response.ok) throw new Error('Failed to sync pull')
  return await response.json()
}

/**
 * Sync: Push local changes to server
 */
export async function syncPush(changes) {
  const response = await fetch(`${API_BASE}/sync/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ changes })
  })
  if (!response.ok) throw new Error('Failed to sync push')
  return await response.json()
}

