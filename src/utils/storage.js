const STORAGE_KEY = 'ironlog_state'

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveState(state) {
  try {
    // Don't persist folderHandle (not serializable)
    const { folderHandle, ...rest } = state
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest))
  } catch (e) {
    console.warn('Failed to save state:', e)
  }
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY)
}
