import JSZip from 'jszip'
import { dayToMarkdown, templateToMarkdown, toFilename } from './mdUtils.js'

/**
 * Build a zip containing all workout .md files + templates
 * Returns a Blob
 */
export async function buildExportZip(weeks, templates) {
  const zip = new JSZip()
  const tracker = zip.folder('tracker')
  const templatesFolder = tracker.folder('templates')

  // Workout days
  for (const week of weeks) {
    for (const day of week.days) {
      if (day.exercises.length === 0) continue
      const md = dayToMarkdown(day, week.name)
      const dateFolder = tracker.folder(day.date)
      const filename = `${toFilename(day.title || 'untitled')}.md`
      dateFolder.file(filename, md)
    }
  }

  // Templates
  for (const tpl of templates) {
    const md = templateToMarkdown(tpl)
    const filename = `${toFilename(tpl.title || 'template')}.md`
    templatesFolder.file(filename, md)
  }

  return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
}

/**
 * Share or download the export zip
 * On Android PWA: uses Web Share API (pops share sheet → Gmail, Drive, etc.)
 * On desktop: triggers download
 */
export async function exportAndShare(weeks, templates, dispatch) {
  try {
    dispatch({ type: 'SET_TOAST', message: 'Building export...' })
    const blob = await buildExportZip(weeks, templates)
    const filename = `ironlog-export-${new Date().toISOString().split('T')[0]}.zip`
    const file = new File([blob], filename, { type: 'application/zip' })

    // Try Web Share API first (Android PWA)
    if (
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        title: 'Iron Log Export',
        text: 'Iron Log workout data export',
        files: [file],
      })
      dispatch({ type: 'SET_TOAST', message: 'Shared ✓' })
      return
    }

    // Fallback: trigger browser download
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    dispatch({ type: 'SET_TOAST', message: 'Downloaded ✓' })
  } catch (e) {
    if (e.name !== 'AbortError') {
      dispatch({ type: 'SET_TOAST', message: `Export failed: ${e.message}` })
    }
  }
}
