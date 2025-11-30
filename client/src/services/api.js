const API_BASE = import.meta.env.VITE_API_BASE || '/api'

/**
 * Get auth token from localStorage
 */
function getAuthToken() {
  return localStorage.getItem('auth_token')
}

/**
 * Get headers with authentication
 */
function getAuthHeaders() {
  const token = getAuthToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

/**
 * Login
 */
export async function login(username, password) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Login failed' }))
    throw new Error(error.detail || 'Login failed')
  }
  return await response.json()
}

/**
 * Get current user info
 */
export async function getCurrentUser() {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: getAuthHeaders()
  })
  if (!response.ok) throw new Error('Not authenticated')
  return await response.json()
}

/**
 * Fetch notes from server
 */
export async function fetchNotes() {
  const response = await fetch(`${API_BASE}/notes`, {
    headers: getAuthHeaders()
  })
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized')
    throw new Error('Failed to fetch notes')
  }
  return await response.json()
}

/**
 * Fetch a single note
 */
export async function fetchNote(id) {
  const response = await fetch(`${API_BASE}/notes/${id}`, {
    headers: getAuthHeaders()
  })
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized')
    throw new Error('Failed to fetch note')
  }
  return await response.json()
}

/**
 * Create a note on server
 */
export async function createNote(note) {
  const response = await fetch(`${API_BASE}/notes`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(note)
  })
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized')
    throw new Error('Failed to create note')
  }
  return await response.json()
}

/**
 * Update a note on server
 */
export async function updateNote(id, note) {
  const response = await fetch(`${API_BASE}/notes/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(note)
  })
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized')
    throw new Error('Failed to update note')
  }
  return await response.json()
}

/**
 * Delete a note on server
 */
export async function deleteNoteOnServer(id) {
  const response = await fetch(`${API_BASE}/notes/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  })
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized')
    throw new Error('Failed to delete note')
  }
  return await response.json()
}

/**
 * Sync: Get notes changed since timestamp
 */
export async function syncPull(since) {
  const url = since 
    ? `${API_BASE}/sync/notes?since=${encodeURIComponent(since)}`
    : `${API_BASE}/sync/notes`
  const response = await fetch(url, {
    headers: getAuthHeaders()
  })
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized')
    throw new Error('Failed to sync pull')
  }
  return await response.json()
}

/**
 * Sync: Push local changes to server
 */
export async function syncPush(changes) {
  const response = await fetch(`${API_BASE}/sync/push`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ changes })
  })
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized')
    throw new Error('Failed to sync push')
  }
  return await response.json()
}

