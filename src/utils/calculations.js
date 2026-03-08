/**
 * Epley formula: 1RM = weight * (1 + reps / 30)
 * Returns estimated 1RM or null if invalid
 */
export function epley1RM(weight, reps) {
  const w = parseFloat(weight)
  const r = parseInt(reps)
  if (!w || !r || w <= 0 || r <= 0) return null
  if (r === 1) return w
  return Math.round(w * (1 + r / 30))
}

/**
 * Scan all weeks/days/exercises for a given exercise name (case-insensitive)
 * and return the best estimated 1RM with date info
 */
export function getBest1RM(weeks, exerciseName) {
  let best = null
  let bestDate = null

  for (const week of weeks) {
    for (const day of week.days) {
      for (const exercise of day.exercises) {
        if (exercise.name.toLowerCase().includes(exerciseName.toLowerCase())) {
          for (const set of exercise.sets) {
            const rm = epley1RM(set.weight, set.reps)
            if (rm && (!best || rm > best)) {
              best = rm
              bestDate = day.date
            }
          }
        }
      }
    }
  }

  return { value: best, date: bestDate }
}

/**
 * Get all 1RM data points for a given exercise (for charting)
 * Returns array of { date, rm } sorted by date
 */
export function get1RMHistory(weeks, exerciseName) {
  const points = []

  for (const week of weeks) {
    for (const day of week.days) {
      for (const exercise of day.exercises) {
        if (exercise.name.toLowerCase().includes(exerciseName.toLowerCase())) {
          let dayBest = null
          for (const set of exercise.sets) {
            const rm = epley1RM(set.weight, set.reps)
            if (rm && (!dayBest || rm > dayBest)) dayBest = rm
          }
          if (dayBest) {
            points.push({ date: day.date, rm: dayBest })
          }
        }
      }
    }
  }

  return points.sort((a, b) => (a.date > b.date ? 1 : -1))
}

/**
 * Get all exercise names that appear in any week/day
 */
export function getAllExerciseNames(weeks) {
  const names = new Set()
  for (const week of weeks) {
    for (const day of week.days) {
      for (const ex of day.exercises) {
        if (ex.name) names.add(ex.name)
      }
    }
  }
  return [...names].sort()
}

/**
 * Check if a given set (weight+reps) is a PR compared to all sets
 * in all days BEFORE the given dayId
 */
export function isSetPR(weeks, currentDayId, exerciseName, weight, reps) {
  const current1RM = epley1RM(weight, reps)
  if (!current1RM) return false

  // Find all days before (and excluding) the current day, sorted by date
  const currentDay = weeks.flatMap(w => w.days).find(d => d.id === currentDayId)
  if (!currentDay) return false

  let prevBest = null
  for (const week of weeks) {
    for (const day of week.days) {
      if (day.id === currentDayId) continue
      for (const exercise of day.exercises) {
        if (exercise.name.toLowerCase() === exerciseName.toLowerCase()) {
          for (const set of exercise.sets) {
            const rm = epley1RM(set.weight, set.reps)
            if (rm && (!prevBest || rm > prevBest)) prevBest = rm
          }
        }
      }
    }
  }

  // PR if no previous data exists, or current beats previous best
  return !prevBest || current1RM > prevBest
}

/**
 * Calculate weekly volume (tonnage) = sum of reps * weight for all sets
 */
export function getWeeklyVolume(week) {
  let total = 0
  for (const day of week.days) {
    for (const ex of day.exercises) {
      for (const set of ex.sets) {
        const w = parseFloat(set.weight)
        const r = parseInt(set.reps)
        if (w > 0 && r > 0) total += w * r
      }
    }
  }
  return Math.round(total)
}

/**
 * Get volume history per week for charting
 */
export function getVolumeHistory(weeks) {
  return weeks
    .map(w => ({ name: w.name, volume: getWeeklyVolume(w), startDate: w.startDate }))
    .filter(w => w.volume > 0)
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateShort(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function getWeekDates(startDate) {
  const dates = []
  const start = new Date(startDate)
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

export function getMondayOfWeek(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}
