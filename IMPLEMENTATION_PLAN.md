# Offline-First Notes App - Implementation Plan

## Project Structure

```
notes-app/
├── client/                 # Vue 3 frontend
│   ├── src/
│   │   ├── components/     # Vue components
│   │   ├── views/          # Page views
│   │   ├── stores/         # Pinia stores
│   │   ├── services/       # IndexedDB, sync, API services
│   │   ├── utils/          # Utilities (hashing, etc.)
│   │   ├── router/         # Vue Router
│   │   ├── assets/         # Static assets
│   │   └── main.js         # Entry point
│   ├── public/
│   ├── service-worker.js   # Service worker for PWA
│   ├── vite.config.js
│   └── package.json
│
└── server/                 # Python backend
    ├── app/
    │   ├── routes/         # API routes
    │   ├── services/       # Business logic
    │   ├── models/         # Data models
    │   └── utils/          # Utilities (hashing, file ops)
    ├── notes/              # Markdown files storage
    ├── requirements.txt
    └── main.py             # Flask/FastAPI entry point
```

## Tech Stack

### Client
- Vue 3 (Composition API)
- Vite
- Pinia (state management)
- Vue Router
- Tailwind CSS
- idb (IndexedDB wrapper)
- Workbox or custom service worker

### Server
- Python 3.9+
- FastAPI (or Flask)
- SHA-256 hashing
- File-based storage (markdown files)

## Implementation Phases

1. **Phase 1**: Project setup and basic structure
2. **Phase 2**: IndexedDB storage layer
3. **Phase 3**: Service worker and PWA
4. **Phase 4**: Backend API with hashing
5. **Phase 5**: Sync endpoints
6. **Phase 6**: Client sync logic
7. **Phase 7**: Conflict resolution UI
8. **Phase 8**: Vue components (notes list, editor, tags, search)

