from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os
import json
import hashlib
from pathlib import Path

app = FastAPI(title="Notes App API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
NOTES_DIR = Path("notes")
NOTES_DIR.mkdir(exist_ok=True)
METADATA_FILE = NOTES_DIR / ".metadata.json"

# Load metadata
def load_metadata():
    if METADATA_FILE.exists():
        with open(METADATA_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_metadata(metadata):
    with open(METADATA_FILE, 'w') as f:
        json.dump(metadata, f, indent=2)

def compute_hash(content: str) -> str:
    """Compute SHA-256 hash of content"""
    return hashlib.sha256(content.encode('utf-8')).hexdigest()

def get_note_path(note_id: str) -> Path:
    """Get file path for a note"""
    return NOTES_DIR / f"{note_id}.md"

def parse_markdown_file(file_path: Path) -> dict:
    """Parse a markdown file and extract frontmatter and content"""
    content = file_path.read_text(encoding='utf-8')
    
    # Simple frontmatter parsing (YAML-like)
    frontmatter = {}
    body = content
    
    if content.startswith('---'):
        parts = content.split('---', 2)
        if len(parts) >= 3:
            frontmatter_text = parts[1]
            body = parts[2].strip()
            
            # Parse simple key: value pairs
            for line in frontmatter_text.split('\n'):
                if ':' in line:
                    key, value = line.split(':', 1)
                    key = key.strip()
                    value = value.strip().strip('"').strip("'")
                    if key == 'tags':
                        frontmatter[key] = [t.strip() for t in value.split(',') if t.strip()]
                    else:
                        frontmatter[key] = value
    
    return {
        'content': body,
        'frontmatter': frontmatter
    }

def write_markdown_file(file_path: Path, note_id: str, title: str, content: str, tags: List[str]):
    """Write a markdown file with frontmatter"""
    tags_str = ', '.join(tags) if tags else ''
    frontmatter = f"""---
id: {note_id}
title: {title}
tags: {tags_str}
---
"""
    file_path.write_text(frontmatter + content, encoding='utf-8')

# Pydantic models
class NoteCreate(BaseModel):
    title: str
    content: str
    tags: List[str] = []

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None

class NoteResponse(BaseModel):
    id: str
    title: str
    content: str
    tags: List[str]
    createdAt: str
    updatedAt: str
    hash: str
    deleted: bool = False

class SyncNote(BaseModel):
    id: str
    title: str
    content: str
    tags: List[str]
    updatedAt: str
    hash: str
    deleted: bool = False

class SyncPushItem(BaseModel):
    id: str
    content: str
    hash: str
    originalHash: str
    title: Optional[str] = None
    tags: Optional[List[str]] = None
    deleted: Optional[bool] = False
    undelete: Optional[bool] = False

class SyncPushRequest(BaseModel):
    changes: List[SyncPushItem]

# API Routes

@app.get("/")
async def root():
    return {"message": "Notes App API"}

@app.get("/api/notes", response_model=List[NoteResponse])
async def get_notes():
    """Get all notes"""
    metadata = load_metadata()
    notes = []
    
    for note_id, meta in metadata.items():
        if meta.get('deleted', False):
            continue
            
        file_path = get_note_path(note_id)
        if not file_path.exists():
            continue
        
        parsed = parse_markdown_file(file_path)
        content = parsed['content']
        hash_value = compute_hash(content)
        
        notes.append(NoteResponse(
            id=note_id,
            title=meta.get('title', parsed['frontmatter'].get('title', 'Untitled')),
            content=content,
            tags=meta.get('tags', parsed['frontmatter'].get('tags', [])),
            createdAt=meta.get('createdAt', datetime.now().isoformat()),
            updatedAt=meta.get('updatedAt', datetime.now().isoformat()),
            hash=hash_value,
            deleted=meta.get('deleted', False)
        ))
    
    return notes

@app.get("/api/notes/{note_id}", response_model=NoteResponse)
async def get_note(note_id: str):
    """Get a single note"""
    metadata = load_metadata()
    file_path = get_note_path(note_id)
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Note not found")
    
    meta = metadata.get(note_id, {})
    if meta.get('deleted', False):
        raise HTTPException(status_code=404, detail="Note deleted")
    
    parsed = parse_markdown_file(file_path)
    content = parsed['content']
    hash_value = compute_hash(content)
    
    return NoteResponse(
        id=note_id,
        title=meta.get('title', parsed['frontmatter'].get('title', 'Untitled')),
        content=content,
        tags=meta.get('tags', parsed['frontmatter'].get('tags', [])),
        createdAt=meta.get('createdAt', datetime.now().isoformat()),
        updatedAt=meta.get('updatedAt', datetime.now().isoformat()),
        hash=hash_value,
        deleted=meta.get('deleted', False)
    )

@app.post("/api/notes", response_model=NoteResponse)
async def create_note(note: NoteCreate):
    """Create a new note"""
    note_id = f"note-{int(datetime.now().timestamp() * 1000)}-{os.urandom(4).hex()}"
    file_path = get_note_path(note_id)
    
    write_markdown_file(file_path, note_id, note.title, note.content, note.tags)
    
    metadata = load_metadata()
    now = datetime.now().isoformat()
    hash_value = compute_hash(note.content)
    
    metadata[note_id] = {
        'title': note.title,
        'tags': note.tags,
        'createdAt': now,
        'updatedAt': now,
        'hash': hash_value,
        'deleted': False
    }
    save_metadata(metadata)
    
    return NoteResponse(
        id=note_id,
        title=note.title,
        content=note.content,
        tags=note.tags,
        createdAt=now,
        updatedAt=now,
        hash=hash_value,
        deleted=False
    )

@app.put("/api/notes/{note_id}", response_model=NoteResponse)
async def update_note(note_id: str, note: NoteUpdate):
    """Update a note"""
    metadata = load_metadata()
    file_path = get_note_path(note_id)
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Note not found")
    
    meta = metadata.get(note_id, {})
    if meta.get('deleted', False):
        raise HTTPException(status_code=404, detail="Note deleted")
    
    # Get current content
    parsed = parse_markdown_file(file_path)
    current_content = parsed['content']
    current_title = meta.get('title', parsed['frontmatter'].get('title', 'Untitled'))
    current_tags = meta.get('tags', parsed['frontmatter'].get('tags', []))
    
    # Update fields
    new_content = note.content if note.content is not None else current_content
    new_title = note.title if note.title is not None else current_title
    new_tags = note.tags if note.tags is not None else current_tags
    
    # Write updated file
    write_markdown_file(file_path, note_id, new_title, new_content, new_tags)
    
    # Update metadata
    now = datetime.now().isoformat()
    hash_value = compute_hash(new_content)
    
    meta['title'] = new_title
    meta['tags'] = new_tags
    meta['updatedAt'] = now
    meta['hash'] = hash_value
    metadata[note_id] = meta
    save_metadata(metadata)
    
    return NoteResponse(
        id=note_id,
        title=new_title,
        content=new_content,
        tags=new_tags,
        createdAt=meta.get('createdAt', now),
        updatedAt=now,
        hash=hash_value,
        deleted=False
    )

@app.delete("/api/notes/{note_id}")
async def delete_note(note_id: str):
    """Soft delete a note"""
    metadata = load_metadata()
    
    if note_id not in metadata:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Soft delete
    metadata[note_id]['deleted'] = True
    metadata[note_id]['updatedAt'] = datetime.now().isoformat()
    save_metadata(metadata)
    
    return {"message": "Note deleted"}

# Sync endpoints

@app.get("/api/sync/notes", response_model=List[SyncNote])
async def sync_notes(since: Optional[str] = None):
    """Get notes changed since timestamp"""
    metadata = load_metadata()
    notes = []
    since_dt = datetime.fromisoformat(since) if since else None
    
    for note_id, meta in metadata.items():
        updated_at = datetime.fromisoformat(meta.get('updatedAt', datetime.now().isoformat()))
        
        if since_dt and updated_at <= since_dt:
            continue
        
        file_path = get_note_path(note_id)
        if not file_path.exists() and not meta.get('deleted', False):
            continue
        
        # Include deleted notes in sync
        if meta.get('deleted', False):
            notes.append(SyncNote(
                id=note_id,
                title=meta.get('title', 'Untitled'),
                content='',
                tags=meta.get('tags', []),
                updatedAt=meta.get('updatedAt', datetime.now().isoformat()),
                hash='',
                deleted=True
            ))
            continue
        
        parsed = parse_markdown_file(file_path)
        content = parsed['content']
        hash_value = compute_hash(content)
        
        notes.append(SyncNote(
            id=note_id,
            title=meta.get('title', parsed['frontmatter'].get('title', 'Untitled')),
            content=content,
            tags=meta.get('tags', parsed['frontmatter'].get('tags', [])),
            updatedAt=meta.get('updatedAt', datetime.now().isoformat()),
            hash=hash_value,
            deleted=False
        ))
    
    return notes

@app.post("/api/sync/push")
async def sync_push(request: SyncPushRequest):
    """Push local changes to server"""
    metadata = load_metadata()
    results = []
    
    for change in request.changes:
        note_id = change.id
        
        # Handle deletion
        if change.deleted:
            if note_id in metadata:
                metadata[note_id]['deleted'] = True
                metadata[note_id]['updatedAt'] = datetime.now().isoformat()
                save_metadata(metadata)
            results.append({"id": note_id, "status": "deleted"})
            continue
        
        # Handle undelete/resurrection
        if change.undelete:
            if note_id in metadata:
                metadata[note_id]['deleted'] = False
        
        # Check for conflicts
        if note_id in metadata:
            current_hash = metadata[note_id].get('hash', '')
            if change.originalHash and current_hash != change.originalHash:
                # Conflict detected
                results.append({
                    "id": note_id,
                    "status": "conflict",
                    "message": "Server version has changed"
                })
                continue
        
        # Apply update
        file_path = get_note_path(note_id)
        title = change.title or metadata.get(note_id, {}).get('title', 'Untitled')
        tags = change.tags or metadata.get(note_id, {}).get('tags', [])
        
        write_markdown_file(file_path, note_id, title, change.content, tags)
        
        now = datetime.now().isoformat()
        hash_value = compute_hash(change.content)
        
        if note_id not in metadata:
            metadata[note_id] = {
                'createdAt': now,
            }
        
        metadata[note_id].update({
            'title': title,
            'tags': tags,
            'updatedAt': now,
            'hash': hash_value,
            'deleted': False
        })
        
        save_metadata(metadata)
        
        results.append({
            "id": note_id,
            "status": "updated",
            "hash": hash_value,
            "updatedAt": now
        })
    
    return {"results": results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

