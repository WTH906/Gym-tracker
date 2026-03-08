/**
 * Generate markdown content for a workout day
 */
export function dayToMarkdown(day, weekName) {
  const lines = []
  lines.push(`# ${day.title || 'Untitled Day'}`)
  lines.push(``)
  lines.push(`**Date:** ${day.date}`)
  if (weekName) lines.push(`**Week:** ${weekName}`)
  lines.push(``)
  lines.push(`---`)
  lines.push(``)

  for (const exercise of day.exercises) {
    lines.push(`## ${exercise.name}`)
    lines.push(``)
    lines.push(`| Set | Reps | Weight | Rest | Notes |`)
    lines.push(`|-----|------|--------|------|-------|`)
    for (let i = 0; i < 5; i++) {
      const s = exercise.sets[i] || {}
      const reps = s.reps || ''
      const weight = s.weight || ''
      const rest = s.rest || ''
      const notes = s.notes || ''
      if (reps || weight || rest || notes) {
        lines.push(`| ${i + 1} | ${reps} | ${weight} | ${rest} | ${notes} |`)
      } else {
        lines.push(`| ${i + 1} | — | — | — | |`)
      }
    }
    lines.push(``)
  }

  return lines.join('\n')
}

/**
 * Generate markdown for a template (weights cleared)
 */
export function templateToMarkdown(template) {
  const lines = []
  lines.push(`# ${template.title} (Template)`)
  lines.push(``)
  lines.push(`**Template:** true`)
  lines.push(``)
  lines.push(`---`)
  lines.push(``)

  for (const exercise of template.exercises) {
    lines.push(`## ${exercise.name}`)
    lines.push(``)
    lines.push(`| Set | Reps | Weight | Rest | Notes |`)
    lines.push(`|-----|------|--------|------|-------|`)
    for (let i = 0; i < 5; i++) {
      const s = exercise.sets[i] || {}
      const reps = s.reps || ''
      const rest = s.rest || ''
      const notes = s.notes || ''
      if (reps || rest) {
        lines.push(`| ${i + 1} | ${reps} | | ${rest} | ${notes} |`)
      } else {
        lines.push(`| ${i + 1} | — | | — | |`)
      }
    }
    lines.push(``)
  }

  return lines.join('\n')
}

/**
 * Sanitize a string for use as a filename
 */
export function toFilename(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
