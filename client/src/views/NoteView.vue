<template>
  <div v-if="note" class="h-full flex flex-col">
    <!-- Editor Header -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-2">
        <button
          @click="goHome"
          class="px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Back to notes"
        >
          ← Back
        </button>
        <input
          ref="titleInputRef"
          v-model="title"
          @input="onTitleChange"
          @focus="onTitleFocus"
          type="text"
          placeholder="Note title..."
          class="flex-1 text-2xl font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
        />
        <button
          @click="manualSave"
          :disabled="!canSave"
          class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Save now"
        >
          Save
        </button>
        <button
          @click="deleteNote"
          class="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
          title="Delete note"
        >
          Delete
        </button>
      </div>
      <div class="flex items-center gap-2 mt-2">
        <div class="flex items-center gap-2">
          <button
            @click="toggleEditMode"
            class="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            {{ editorMode === 'edit' ? 'Preview' : 'Edit' }}
          </button>
          <button
            @click="toggleSplitView"
            class="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            {{ splitView ? 'Single' : 'Split' }}
          </button>
        </div>
      </div>
      <!-- Duplicate title warning -->
      <div v-if="duplicateTitleWarning" class="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-700 rounded text-sm text-yellow-800 dark:text-yellow-200">
        ⚠️ A note with this title already exists: "{{ duplicateTitleWarning }}"
      </div>
    </div>
    
    <!-- Editor/Preview Area -->
    <div class="flex-1 overflow-hidden flex" :class="{ 'flex-row': splitView, 'flex-col': !splitView }">
      <!-- Editor -->
      <div 
        v-if="editorMode === 'edit' || splitView"
        class="flex-1 overflow-hidden flex flex-col"
        :class="{ 'w-1/2 border-r border-gray-200 dark:border-gray-700': splitView }"
      >
        <!-- Markdown Toolbar -->
        <div class="flex items-center gap-1 p-2 border-b border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 flex-wrap">
          <button
            @click="insertMarkdown('**', '**')"
            class="px-2.5 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            @click="insertMarkdown('*', '*')"
            class="px-2.5 py-1.5 text-sm font-semibold italic text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Italic"
          >
            I
          </button>
          <button
            @click="insertMarkdown('`', '`')"
            class="px-2.5 py-1.5 text-sm font-mono text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Inline code"
          >
            &lt;/&gt;
          </button>
          <div class="w-px h-5 bg-gray-400 dark:bg-gray-600 mx-1"></div>
          <button
            @click="insertMarkdown('# ', '')"
            class="px-2.5 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Heading"
          >
            H
          </button>
          <button
            @click="insertMarkdown('## ', '')"
            class="px-2.5 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Heading 2"
          >
            H2
          </button>
          <button
            @click="insertMarkdown('### ', '')"
            class="px-2.5 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Heading 3"
          >
            H3
          </button>
          <div class="w-px h-5 bg-gray-400 dark:bg-gray-600 mx-1"></div>
          <button
            @click="insertMarkdown('- ', '')"
            class="px-2.5 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Bullet list"
          >
            •
          </button>
          <button
            @click="insertMarkdown('1. ', '')"
            class="px-2.5 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Numbered list"
          >
            1.
          </button>
          <button
            @click="insertMarkdown('> ', '')"
            class="px-2.5 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Blockquote"
          >
            "
          </button>
          <div class="w-px h-5 bg-gray-400 dark:bg-gray-600 mx-1"></div>
          <button
            @click="insertMarkdown('[', '](url)')"
            class="px-2.5 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Link"
          >
            🔗
          </button>
          <button
            @click="insertMarkdown('![', '](url)')"
            class="px-2.5 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Image"
          >
            🌃
          </button>
          <button
            @click="insertCodeBlock"
            class="px-2.5 py-1.5 text-sm font-mono text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Code block"
          >
            ```
          </button>
          <button
            @click="insertHorizontalRule"
            class="px-2.5 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Horizontal rule"
          >
            ─
          </button>
          <button
            @click="insertCheckbox"
            class="px-2.5 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Checkbox"
          >
            ☐
          </button>
        </div>
        <textarea
          ref="editorRef"
          v-model="content"
          @input="onContentChange"
          @keydown="handleKeydown"
          placeholder="Start writing markdown..."
          class="flex-1 p-4 resize-none border-none outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400 font-mono text-sm leading-relaxed"
        />
      </div>
      
      <!-- Preview -->
      <div 
        v-if="editorMode === 'preview' || splitView"
        class="flex-1 overflow-auto p-4 prose prose-sm dark:prose-invert max-w-none"
        :class="{ 'w-1/2': splitView }"
        @click="handlePreviewClick"
      >
        <div v-html="renderedMarkdown" class="markdown-content"></div>
      </div>
    </div>
    
    <!-- Footer with Tags -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-2 mb-2">
        <input
          v-model="tagsInput"
          @blur="updateTags"
          @keydown.enter.prevent="updateTags"
          type="text"
          placeholder="Tags (comma-separated)"
          class="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
      <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
        <span>Updated: {{ formatTime(note.updatedAt) }}</span>
        <div class="flex items-center gap-3">
          <span v-if="hasUnsavedChanges" class="text-yellow-600 dark:text-yellow-400">
            ● Unsaved changes
            <span v-if="autoSaveEnabled && autoSaveCountdown > 0">
              (auto-saving in {{ Math.ceil(autoSaveCountdown / 1000) }}s)
            </span>
          </span>
          <span v-else class="text-green-600 dark:text-green-400">
            ✓ Saved
          </span>
        </div>
      </div>
    </div>
  </div>
  
  <div v-else class="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
    <div class="text-center">
      <p class="text-lg mb-2">No note selected</p>
      <p class="text-sm">Create a new note or select one from the sidebar</p>
      <button
        @click="goHome"
        class="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Go to Notes
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNotesStore } from '../stores/notes'
import { useSettingsStore } from '../stores/settings'
import { marked } from 'marked'

// Configure marked for GFM (GitHub Flavored Markdown) with checkbox support
marked.setOptions({
  gfm: true,
  breaks: true
})

const route = useRoute()
const router = useRouter()
const notesStore = useNotesStore()
const settingsStore = useSettingsStore()

const note = computed(() => notesStore.selectedNote)
const title = ref('')
const content = ref('')
const tagsInput = ref('')
const editorRef = ref(null)
const titleInputRef = ref(null)
const editorMode = ref('edit') // 'edit' or 'preview'
const splitView = ref(false)
const localTitle = ref('')
const localContent = ref('')

// Auto-save
const autoSaveTimer = ref(null)
const autoSaveCountdown = ref(0)
const countdownTimer = ref(null)

// Track if we have local changes that haven't been saved
// Compare current input values with the last saved values (localTitle/localContent)
const hasLocalChanges = computed(() => {
  if (!note.value) return false
  const titleTrimmed = title.value.trim()
  const contentTrimmed = content.value.trim()
  return titleTrimmed !== localTitle.value || contentTrimmed !== localContent.value
})

const hasUnsavedChanges = computed(() => {
  if (!note.value) return false
  return hasLocalChanges.value
})

// Check if save is allowed (needs title and content)
const canSave = computed(() => {
  const titleTrimmed = title.value.trim()
  const contentTrimmed = content.value.trim()
  return hasLocalChanges.value && titleTrimmed.length > 0 && contentTrimmed.length > 0
})

// Check for duplicate titles
const duplicateTitleWarning = computed(() => {
  if (!title.value.trim() || !note.value) return null
  const trimmedTitle = title.value.trim()
  const duplicate = notesStore.notes.find(n => 
    n.id !== note.value.id && 
    !n.locallyDeleted && 
    !n.serverDeleted &&
    n.title?.trim().toLowerCase() === trimmedTitle.toLowerCase()
  )
  return duplicate ? duplicate.title : null
})

const autoSaveEnabled = computed(() => settingsStore.autoSaveEnabled)
const autoSaveDelay = computed(() => settingsStore.autoSaveDelay)

// Markdown rendering
const renderedMarkdown = computed(() => {
  if (!content.value) return '<p class="text-gray-400 italic">No content</p>'
  try {
    return marked.parse(content.value)
  } catch (error) {
    return '<p class="text-red-400">Error rendering markdown</p>'
  }
})

const previousNoteId = ref(null)

watch(note, (newNote, oldNote) => {
  if (newNote) {
    // Only update if we switched to a different note (avoid overwriting user input while editing)
    if (previousNoteId.value !== newNote.id) {
      title.value = newNote.title || ''
      content.value = newNote.content || ''
      tagsInput.value = newNote.tags?.join(', ') || ''
      localTitle.value = newNote.title || ''
      localContent.value = newNote.content || ''
      previousNoteId.value = newNote.id
      cancelAutoSave()
    } else if (oldNote && newNote.id === oldNote.id) {
      // Same note but content might have been updated externally
      // Only update if the note actually changed (not just a reactive update)
      if (newNote.title !== oldNote.title || newNote.content !== oldNote.content) {
        // Only update if user hasn't made local changes
        const titleTrimmed = title.value.trim()
        const contentTrimmed = content.value.trim()
        if (titleTrimmed === oldNote.title && contentTrimmed === oldNote.content) {
          title.value = newNote.title || ''
          content.value = newNote.content || ''
          localTitle.value = newNote.title || ''
          localContent.value = newNote.content || ''
        }
      }
    }
  } else {
    previousNoteId.value = null
  }
}, { immediate: true, deep: true })

watch(() => route.params.id, (id) => {
  if (id) {
    notesStore.selectNote(id)
  }
}, { immediate: true })

onMounted(() => {
  settingsStore.loadSettings()
})

onUnmounted(() => {
  cancelAutoSave()
})

function onTitleFocus() {
  // Clear "Untitled" placeholder when focused
  if (title.value.trim() === 'Untitled' || title.value.trim() === '') {
    title.value = ''
  }
}

function onTitleChange() {
  scheduleAutoSave()
}

function onContentChange() {
  scheduleAutoSave()
}

function scheduleAutoSave() {
  cancelAutoSave()
  
  if (!autoSaveEnabled.value) {
    return
  }
  
  // Start countdown
  autoSaveCountdown.value = autoSaveDelay.value
  countdownTimer.value = setInterval(() => {
    autoSaveCountdown.value -= 1000
    if (autoSaveCountdown.value <= 0) {
      clearInterval(countdownTimer.value)
      countdownTimer.value = null
    }
  }, 1000)
  
  // Schedule actual save
  autoSaveTimer.value = setTimeout(() => {
    saveNote()
  }, autoSaveDelay.value)
}

function cancelAutoSave() {
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value)
    autoSaveTimer.value = null
  }
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
    countdownTimer.value = null
  }
  autoSaveCountdown.value = 0
}

async function saveNote() {
  if (!note.value) return
  
  const titleTrimmed = title.value.trim()
  const contentTrimmed = content.value.trim()
  
  // Don't save if title or content is empty
  if (!titleTrimmed || !contentTrimmed) {
    console.log('Save blocked: title or content empty', { titleTrimmed, contentTrimmed })
    return
  }
  
  cancelAutoSave()
  
  try {
    await notesStore.updateNote(note.value.id, { 
      content: contentTrimmed,
      title: titleTrimmed,
      tags: note.value.tags || [] // Preserve existing tags
    })
    
    // Update local tracking
    localTitle.value = titleTrimmed
    localContent.value = contentTrimmed
    console.log('Note saved successfully')
  } catch (error) {
    console.error('Failed to save note:', error)
  }
}

async function manualSave() {
  if (!canSave.value) return
  await saveNote()
}

function updateTags() {
  if (note.value) {
    const tags = tagsInput.value
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)
    // Update tags only - don't require title/content
    notesStore.updateNote(note.value.id, { 
      tags: tags || []
    })
    scheduleAutoSave()
  }
}

async function deleteNote() {
  if (note.value && confirm('Are you sure you want to delete this note?')) {
    cancelAutoSave()
    await notesStore.deleteNote(note.value.id)
    router.push('/')
  }
}

function goHome() {
  router.push('/')
}

function toggleEditMode() {
  // If split view is enabled, keep it enabled but switch the primary mode
  if (splitView.value) {
    editorMode.value = editorMode.value === 'edit' ? 'preview' : 'edit'
  } else {
    editorMode.value = editorMode.value === 'edit' ? 'preview' : 'edit'
  }
}

function toggleSplitView() {
  splitView.value = !splitView.value
  // When enabling split view, ensure we're in edit mode so both show
  if (splitView.value && editorMode.value === 'preview') {
    editorMode.value = 'edit'
  }
}

function formatTime(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleString()
}

function insertMarkdown(before, after) {
  if (!editorRef.value) return
  
  const textarea = editorRef.value
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = content.value.substring(start, end)
  const beforeText = content.value.substring(0, start)
  const afterText = content.value.substring(end)
  
  // If text is selected, wrap it
  if (selectedText) {
    const newText = beforeText + before + selectedText + after + afterText
    content.value = newText
    
    // Set cursor position after the inserted markdown
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + before.length + selectedText.length + after.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  } else {
    // No selection, insert markdown and place cursor in the middle
    const newText = beforeText + before + after + afterText
    content.value = newText
    
    // Set cursor position between the markdown symbols
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + before.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }
  
  onContentChange()
}

function insertCodeBlock() {
  if (!editorRef.value) return
  
  const textarea = editorRef.value
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = content.value.substring(start, end)
  const beforeText = content.value.substring(0, start)
  const afterText = content.value.substring(end)
  
  if (selectedText) {
    // Wrap selected text in code block
    const newText = beforeText + '```\n' + selectedText + '\n```' + afterText
    content.value = newText
    
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + 4 + selectedText.length + 1
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  } else {
    // Insert empty code block
    const newText = beforeText + '```\n\n```' + afterText
    content.value = newText
    
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + 4
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }
  
  onContentChange()
}

function insertHorizontalRule() {
  if (!editorRef.value) return
  
  const textarea = editorRef.value
  const start = textarea.selectionStart
  const beforeText = content.value.substring(0, start)
  const afterText = content.value.substring(start)
  
  // Insert horizontal rule with newlines
  const newText = beforeText + (beforeText && !beforeText.endsWith('\n') ? '\n' : '') + '---\n' + afterText
  content.value = newText
  
  setTimeout(() => {
    textarea.focus()
    const newCursorPos = start + (beforeText && !beforeText.endsWith('\n') ? 1 : 0) + 4
    textarea.setSelectionRange(newCursorPos, newCursorPos)
  }, 0)
  
  onContentChange()
}

function insertCheckbox() {
  if (!editorRef.value) return
  
  const textarea = editorRef.value
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const beforeText = content.value.substring(0, start)
  const afterText = content.value.substring(end)
  
  // Insert checkbox at the start of the line
  const lines = beforeText.split('\n')
  const currentLine = lines[lines.length - 1]
  const indent = currentLine.match(/^(\s*)/)?.[1] || ''
  const checkbox = indent + '- [ ] '
  
  const newText = beforeText + checkbox + afterText
  content.value = newText
  
  setTimeout(() => {
    textarea.focus()
    const newCursorPos = start + checkbox.length
    textarea.setSelectionRange(newCursorPos, newCursorPos)
  }, 0)
  
  onContentChange()
}

function handlePreviewClick(event) {
  // Handle checkbox clicks in preview
  const target = event.target
  if (target && target.type === 'checkbox') {
    event.preventDefault()
    event.stopPropagation()
    
    // Get all checkboxes in the preview in order
    const markdownContent = target.closest('.markdown-content')
    if (!markdownContent) return
    
    const allCheckboxes = Array.from(markdownContent.querySelectorAll('input[type="checkbox"]'))
    const checkboxIndex = allCheckboxes.indexOf(target)
    
    if (checkboxIndex === -1) return
    
    // Find all checkbox lines in markdown in order
    const lines = content.value.split('\n')
    const checkboxLineIndices = []
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // Match checkbox pattern: - [ ] or - [x] or * [ ] etc.
      if (line.match(/^(\s*)([-*+])\s+\[([ x])\]\s/)) {
        checkboxLineIndices.push(i)
      }
    }
    
    // Update the checkbox at the matching index
    if (checkboxIndex < checkboxLineIndices.length) {
      const lineIndex = checkboxLineIndices[checkboxIndex]
      const line = lines[lineIndex]
      // Match the full checkbox line
      const checkboxMatch = line.match(/^(\s*)([-*+])\s+\[([ x])\]\s(.*)$/)
      
      if (checkboxMatch) {
        // Toggle the checkbox
        const isChecked = checkboxMatch[3] === 'x'
        const newState = isChecked ? ' ' : 'x'
        const newLine = line.replace(/\[([ x])\]/, `[${newState}]`)
        lines[lineIndex] = newLine
        content.value = lines.join('\n')
        onContentChange()
      }
    }
  }
}

function handleKeydown(event) {
  // Handle Enter key for list continuation
  if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
    const textarea = editorRef.value
    if (!textarea) return
    
    const start = textarea.selectionStart
    const beforeText = content.value.substring(0, start)
    const lines = beforeText.split('\n')
    const currentLine = lines[lines.length - 1]
    
    // Check if we're in a checkbox
    const checkboxMatch = currentLine.match(/^(\s*)([-*+])\s+\[([ x])\]\s/)
    
    // Check if we're in a list
    const bulletMatch = currentLine.match(/^(\s*)([-*+])\s(?!\[)/) // Not a checkbox
    const numberedMatch = currentLine.match(/^(\s*)(\d+)\.\s/)
    
    if (checkboxMatch) {
      // Continue checkbox list
      event.preventDefault()
      const indent = checkboxMatch[1]
      const bullet = checkboxMatch[2]
      const newLine = '\n' + indent + bullet + ' [ ] '
      
      const beforeCursor = content.value.substring(0, start)
      const afterCursor = content.value.substring(start)
      const newContent = beforeCursor + newLine + afterCursor
      content.value = newContent
      
      setTimeout(() => {
        textarea.focus()
        const newCursorPos = start + newLine.length
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }, 0)
      
      onContentChange()
    } else if (bulletMatch) {
      // Continue bullet list
      event.preventDefault()
      const indent = bulletMatch[1]
      const bullet = bulletMatch[2]
      const newLine = '\n' + indent + bullet + ' '
      
      const beforeCursor = content.value.substring(0, start)
      const afterCursor = content.value.substring(start)
      const newContent = beforeCursor + newLine + afterCursor
      content.value = newContent
      
      setTimeout(() => {
        textarea.focus()
        const newCursorPos = start + newLine.length
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }, 0)
      
      onContentChange()
    } else if (numberedMatch) {
      // Continue numbered list
      event.preventDefault()
      const indent = numberedMatch[1]
      const currentNum = parseInt(numberedMatch[2])
      const nextNum = currentNum + 1
      const newLine = '\n' + indent + nextNum + '. '
      
      const beforeCursor = content.value.substring(0, start)
      const afterCursor = content.value.substring(start)
      const newContent = beforeCursor + newLine + afterCursor
      content.value = newContent
      
      setTimeout(() => {
        textarea.focus()
        const newCursorPos = start + newLine.length
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }, 0)
      
      onContentChange()
    } else if (currentLine.trim() === '') {
      // Check if previous line was a list item - if so, exit list on double Enter
      if (lines.length >= 2) {
        const prevLine = lines[lines.length - 2]
        const prevCheckboxMatch = prevLine.match(/^(\s*)([-*+])\s+\[([ x])\]\s/)
        const prevBulletMatch = prevLine.match(/^(\s*)([-*+])\s(?!\[)/) // Not a checkbox
        const prevNumberedMatch = prevLine.match(/^(\s*)(\d+)\.\s/)
        
        if (prevCheckboxMatch || prevBulletMatch || prevNumberedMatch) {
          // This is a double Enter - exit the list by not adding list marker
          // Just let the default Enter behavior happen (already on empty line)
          return
        }
      }
    }
  }
  
  // Handle Backspace to exit list
  if (event.key === 'Backspace' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
    const textarea = editorRef.value
    if (!textarea) return
    
    const start = textarea.selectionStart
    const beforeText = content.value.substring(0, start)
    const currentLine = beforeText.split('\n').pop()
    
    // If we're at the start of a list item (after the bullet/number), delete the list marker
    const bulletMatch = currentLine.match(/^(\s*)([-*+])\s$/)
    const numberedMatch = currentLine.match(/^(\s*)(\d+)\.\s$/)
    
    if (bulletMatch || numberedMatch) {
      // User is deleting the list marker - let it happen naturally
      // The content will update and trigger onContentChange
      return
    }
  }
}
</script>

<style>
.markdown-content {
  @apply text-gray-900 dark:text-gray-100;
}

.markdown-content h1 {
  @apply text-3xl font-bold mt-6 mb-4;
}

.markdown-content h2 {
  @apply text-2xl font-bold mt-5 mb-3;
}

.markdown-content h3 {
  @apply text-xl font-bold mt-4 mb-2;
}

.markdown-content p {
  @apply mb-4;
}

.markdown-content ul, .markdown-content ol {
  @apply mb-4 ml-6;
}

.markdown-content li {
  @apply mb-2;
}

.markdown-content ul li {
  @apply list-disc;
}

.markdown-content ol li {
  @apply list-decimal;
}

.markdown-content hr {
  @apply my-6 border-t border-gray-300 dark:border-gray-600;
}

.markdown-content input[type="checkbox"] {
  @apply mr-2;
}

.markdown-content code {
  @apply bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono;
}

.markdown-content pre {
  @apply bg-gray-100 dark:bg-gray-800 p-4 rounded mb-4 overflow-x-auto;
}

.markdown-content pre code {
  @apply bg-transparent p-0;
}

.markdown-content blockquote {
  @apply border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-4;
}

.markdown-content a {
  @apply text-blue-600 dark:text-blue-400 hover:underline;
}

.markdown-content table {
  @apply w-full border-collapse mb-4;
}

.markdown-content th,
.markdown-content td {
  @apply border border-gray-300 dark:border-gray-600 px-4 py-2;
}

.markdown-content th {
  @apply bg-gray-100 dark:bg-gray-800 font-bold;
}
</style>
