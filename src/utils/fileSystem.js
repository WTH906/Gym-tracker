/**
 * File System Access API utilities
 * Used to write .md files to the user's chosen folder
 */

/**
 * Request the user to pick a folder
 * Returns a FileSystemDirectoryHandle or null
 */
export async function pickFolder() {
  try {
    const handle = await window.showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents',
    })
    return handle
  } catch (e) {
    if (e.name === 'AbortError') return null
    throw e
  }
}

/**
 * Get or create a subdirectory inside a parent handle
 */
async function getOrCreateDir(parentHandle, name) {
  return await parentHandle.getDirectoryHandle(name, { create: true })
}

/**
 * Write a file inside a directory handle
 */
async function writeFile(dirHandle, filename, content) {
  const fileHandle = await dirHandle.getFileHandle(filename, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(content)
  await writable.close()
}

/**
 * Save a workout day as a .md file
 * Path: tracker/<date>/<filename>.md
 */
export async function saveDayFile(rootHandle, day, content) {
  const trackerDir = await getOrCreateDir(rootHandle, 'tracker')
  const dateDir = await getOrCreateDir(trackerDir, day.date)
  const filename = `${toFilename(day.title || 'untitled')}.md`
  await writeFile(dateDir, filename, content)
}

/**
 * Save a template as a .md file
 * Path: tracker/templates/<filename>.md
 */
export async function saveTemplateFile(rootHandle, template, content) {
  const trackerDir = await getOrCreateDir(rootHandle, 'tracker')
  const templatesDir = await getOrCreateDir(trackerDir, 'templates')
  const filename = `${toFilename(template.title || 'template')}.md`
  await writeFile(templatesDir, filename, content)
}

function toFilename(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim() || 'untitled'
}

export function isFSASupported() {
  return 'showDirectoryPicker' in window
}
