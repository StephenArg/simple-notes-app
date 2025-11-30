# Offline-First Notes App

A self-hosted, offline-first notes application inspired by [flatnotes](https://github.com/dullage/flatnotes). Notes are stored as markdown files on the server, and the app works seamlessly offline with automatic synchronization when connectivity returns.

## Features

- **Offline-First**: Full functionality without network connection
- **Markdown Storage**: Notes stored as markdown files on disk (no database)
- **Automatic Sync**: Syncs changes when online
- **Conflict Resolution**: UI for resolving conflicts when both local and server versions have changed
- **PWA Support**: Installable as a Progressive Web App
- **Clean UI**: Minimal, distraction-free interface similar to flatnotes

## Architecture

### Client (Vue 3)
- **Framework**: Vue 3 with Composition API
- **Build Tool**: Vite
- **State Management**: Pinia
- **Styling**: Tailwind CSS
- **Local Storage**: IndexedDB (via `idb`)
- **Service Worker**: PWA caching for offline support

### Server (Python)
- **Framework**: FastAPI
- **Storage**: Markdown files in `notes/` directory
- **Metadata**: JSON file for note metadata (title, tags, timestamps, hashes)
- **Hashing**: SHA-256 for change detection

## Setup

### Prerequisites
- Node.js 18+ (for client)
- Python 3.9+ (for server)

### Client Setup

```bash
cd client
npm install
npm run dev
```

The client will run on `http://localhost:5173` (or another port if 5173 is taken).

### Server Setup

```bash
cd server
pip install -r requirements.txt
python main.py
```

The server will run on `http://localhost:8000`.

### Production Build

**Client:**
```bash
cd client
npm run build
```

The built files will be in `client/dist/`.

**Server:**
The server can be run with uvicorn directly:
```bash
cd server
uvicorn main:app --host 0.0.0.0 --port 8000
```

Or use the included `main.py`:
```bash
python main.py
```

## Sync Protocol

The app uses a hash-based sync protocol to detect changes and conflicts:

1. **Content Hashing**: Each note's content is hashed using SHA-256
2. **Baseline Tracking**: The client tracks `originalHash` (last successful sync) and `currentLocalHash` (current state)
3. **Change Detection**: Compares hashes to determine:
   - No changes (skip)
   - Local-only changes (push to server)
   - Server-only changes (pull from server)
   - Both changed (conflict - requires user resolution)

### Sync Endpoints

- `GET /api/sync/notes?since=<timestamp>` - Get notes changed since timestamp
- `POST /api/sync/push` - Push local changes to server

## Conflict Resolution

When both local and server versions of a note have changed since the last sync, a conflict is detected. The user is presented with a side-by-side view to choose:
- Server version
- Local version

The chosen version becomes the authoritative copy and is synced to both sides.

## Offline Behavior

- **App Shell**: Cached by service worker for instant loading
- **Notes**: Stored in IndexedDB for offline access
- **Editing**: All CRUD operations work offline
- **Sync**: Automatically syncs when connection is restored
- **Manual Sync**: "Sync now" button in the UI

## File Structure

```
notes-app/
├── client/              # Vue 3 frontend
│   ├── src/
│   │   ├── components/  # Vue components
│   │   ├── views/       # Page views
│   │   ├── stores/      # Pinia stores
│   │   ├── services/    # IndexedDB, sync, API
│   │   └── utils/       # Utilities
│   └── public/          # Static assets
│
└── server/              # Python backend
    ├── main.py          # FastAPI app
    ├── notes/           # Markdown files storage
    └── requirements.txt
```

## Development

### Client Development
```bash
cd client
npm run dev
```

### Server Development
```bash
cd server
uvicorn main:app --reload
```

## Notes Storage

Notes are stored as markdown files with YAML frontmatter:

```markdown
---
id: note-1234567890-abc123
title: My Note
tags: tag1, tag2
---
# Note Content

This is the note content in markdown.
```

Metadata (timestamps, hashes) is stored in `notes/.metadata.json`.

## License

This project is inspired by flatnotes but is a separate implementation with offline-first capabilities.

