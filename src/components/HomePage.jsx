import React, { useState } from 'react'
import { useGym } from '../context/GymContext.jsx'
import { getBest1RM, formatDate, getWeeklyVolume } from '../utils/calculations.js'
import { exportAndShare } from '../utils/exportUtils.js'
import ChartModal from './ChartModal.jsx'

const BIG3 = ['Squat', 'Bench', 'Deadlift']

const ICONS = {
  Squat: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 18v-5l-2-3V6m4 12v-5l4-4 4 4v5M18 18v-5l2-3V6" />
      <circle cx="6" cy="4" r="2" fill="currentColor" stroke="none" />
      <circle cx="18" cy="4" r="2" fill="currentColor" stroke="none" />
    </svg>
  ),
  Bench: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="11" width="20" height="3" rx="1" />
      <path d="M5 14v4M19 14v4" />
      <circle cx="12" cy="7" r="2.5" fill="currentColor" stroke="none" />
      <path d="M9 11V9.5a3 3 0 0 1 6 0V11" />
    </svg>
  ),
  Deadlift: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3v18M5 8l7 3 7-3M5 16l7-3 7 3" />
      <circle cx="3" cy="8" r="2" fill="currentColor" stroke="none" />
      <circle cx="21" cy="8" r="2" fill="currentColor" stroke="none" />
      <circle cx="3" cy="16" r="2" fill="currentColor" stroke="none" />
      <circle cx="21" cy="16" r="2" fill="currentColor" stroke="none" />
    </svg>
  ),
}

export default function HomePage() {
  const { state, dispatch } = useGym()
  const [chartExercise, setChartExercise] = useState(null)
  const [isExporting, setIsExporting] = useState(false)

  const totalWorkouts = state.weeks.reduce((acc, w) => acc + w.days.length, 0)
  const totalWeeks = state.weeks.length
  const totalExercises = state.weeks.reduce(
    (acc, w) => acc + w.days.reduce((a, d) => a + d.exercises.length, 0),
    0
  )

  const latestWeek = state.weeks.length > 0 ? state.weeks[state.weeks.length - 1] : null
  const currentVolume = latestWeek ? getWeeklyVolume(latestWeek) : 0

  async function handleExport() {
    setIsExporting(true)
    await exportAndShare(state.weeks, state.templates, dispatch)
    setIsExporting(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div style={styles.heroLabel}>IRON LOG</div>
        <div style={styles.heroSub}>powerlifting tracker</div>
        <div style={styles.divider} />
      </div>

      <div style={styles.statsRow}>
        <StatPill label="WEEKS" value={totalWeeks} />
        <StatPill label="SESSIONS" value={totalWorkouts} />
        <StatPill label="EXERCISES" value={totalExercises} />
        {currentVolume > 0 && (
          <StatPill
            label="THIS WEEK"
            value={currentVolume >= 1000 ? `${(currentVolume / 1000).toFixed(1)}t` : `${currentVolume}kg`}
            blue
          />
        )}
      </div>

      <div style={styles.sectionRow}>
        <div style={styles.sectionLabel}>BIG THREE — ESTIMATED 1RM</div>
        <button style={styles.chartAllBtn} onClick={() => setChartExercise('')}>
          📈 Charts
        </button>
      </div>

      <div style={styles.big3Grid}>
        {BIG3.map(lift => {
          const { value, date } = getBest1RM(state.weeks, lift)
          return (
            <Big3Card
              key={lift}
              lift={lift}
              value={value}
              date={date}
              icon={ICONS[lift]}
              onClick={() => setChartExercise(lift)}
            />
          )
        })}
      </div>

      {totalWorkouts > 0 && (
        <>
          <div style={styles.sectionLabel}>RECENT SESSIONS</div>
          <div style={styles.recentList}>
            {getRecentDays(state.weeks, 5).map(({ day, weekName }) => (
              <div
                key={day.id}
                style={styles.recentItem}
                onClick={() =>
                  dispatch({ type: 'SET_VIEW', view: 'day', dayId: day.id, weekId: day.weekId })
                }
              >
                <div style={styles.recentLeft}>
                  <div style={styles.recentTitle}>{day.title || 'Untitled'}</div>
                  <div style={styles.recentMeta}>
                    {weekName} · {day.exercises.length} exercise{day.exercises.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={styles.recentDate}>{formatDate(day.date)}</div>
                <div style={styles.recentArrow}>›</div>
              </div>
            ))}
          </div>

          <button
            style={{ ...styles.exportBtn, opacity: isExporting ? 0.5 : 1 }}
            onClick={handleExport}
            disabled={isExporting}
          >
            <span>⬆</span>
            {isExporting ? 'Building export...' : 'Export all as .zip'}
          </button>
        </>
      )}

      {totalWorkouts === 0 && (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>⚡</div>
          <div style={styles.emptyText}>No sessions yet.</div>
          <div style={styles.emptyHint}>Add a week using the menu →</div>
        </div>
      )}

      {chartExercise !== null && (
        <ChartModal initialExercise={chartExercise} onClose={() => setChartExercise(null)} />
      )}
    </div>
  )
}

function StatPill({ label, value, blue }) {
  return (
    <div style={styles.pill}>
      <div style={{ ...styles.pillValue, color: blue ? '#4a9eff' : 'var(--accent)' }}>{value}</div>
      <div style={styles.pillLabel}>{label}</div>
    </div>
  )
}

function Big3Card({ lift, value, date, icon, onClick }) {
  return (
    <div style={styles.big3Card} onClick={onClick}>
      <div style={styles.big3Icon}>{icon}</div>
      <div style={styles.big3Lift}>{lift.toUpperCase()}</div>
      {value ? (
        <>
          <div style={styles.big3Value}>{value}<span style={styles.big3Unit}>kg</span></div>
          <div style={styles.big3Date}>{formatDate(date)}</div>
          <div style={styles.big3ChartHint}>↗ chart</div>
        </>
      ) : (
        <div style={styles.big3Empty}>—</div>
      )}
    </div>
  )
}

function getRecentDays(weeks, limit) {
  const all = []
  for (const week of weeks) {
    for (const day of week.days) all.push({ day, weekName: week.name })
  }
  return all.sort((a, b) => (b.day.date > a.day.date ? 1 : -1)).slice(0, limit)
}

const styles = {
  container: { flex: 1, overflowY: 'auto', padding: '0 16px 40px' },
  hero: { textAlign: 'center', paddingTop: '28px', paddingBottom: '12px' },
  heroLabel: { fontFamily: 'var(--font-display)', fontSize: '56px', letterSpacing: '8px', color: 'var(--text)', lineHeight: 1 },
  heroSub: { fontFamily: 'var(--font-body)', fontSize: '13px', letterSpacing: '4px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' },
  divider: { width: '40px', height: '2px', background: 'var(--accent)', margin: '14px auto 0' },
  statsRow: { display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '18px', marginBottom: '24px' },
  pill: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 16px', textAlign: 'center', minWidth: '72px' },
  pillValue: { fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 600, lineHeight: 1 },
  pillLabel: { fontSize: '9px', letterSpacing: '2px', color: 'var(--text-muted)', marginTop: '4px' },
  sectionRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' },
  sectionLabel: { fontSize: '11px', letterSpacing: '3px', color: 'var(--text-muted)', paddingLeft: '2px', marginBottom: '10px' },
  chartAllBtn: { fontSize: '12px', color: 'var(--text-muted)', padding: '4px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: '10px' },
  big3Grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '26px' },
  big3Card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' },
  big3Icon: { color: 'var(--accent)', marginBottom: '2px' },
  big3Lift: { fontFamily: 'var(--font-display)', fontSize: '16px', letterSpacing: '2px', color: 'var(--text-muted)' },
  big3Value: { fontFamily: 'var(--font-mono)', fontSize: '26px', fontWeight: 600, color: 'var(--text)', lineHeight: 1, marginTop: '2px' },
  big3Unit: { fontSize: '13px', color: 'var(--text-muted)', marginLeft: '2px', fontWeight: 400 },
  big3Date: { fontSize: '10px', color: 'var(--text-dim)' },
  big3ChartHint: { fontSize: '9px', color: 'var(--accent)', opacity: 0.7, letterSpacing: '0.5px', marginTop: '1px' },
  big3Empty: { fontFamily: 'var(--font-mono)', fontSize: '26px', color: 'var(--border-light)', lineHeight: 1, marginTop: '4px' },
  recentList: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' },
  recentItem: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' },
  recentLeft: { flex: 1, minWidth: 0 },
  recentTitle: { fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '15px', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  recentMeta: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' },
  recentDate: { fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' },
  recentArrow: { fontSize: '20px', color: 'var(--text-dim)' },
  exportBtn: { display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '12px 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-muted)', fontSize: '14px', justifyContent: 'center', letterSpacing: '0.5px' },
  empty: { textAlign: 'center', padding: '60px 20px' },
  emptyIcon: { fontSize: '40px', marginBottom: '12px' },
  emptyText: { fontFamily: 'var(--font-display)', fontSize: '24px', letterSpacing: '2px', color: 'var(--text-muted)' },
  emptyHint: { fontSize: '14px', color: 'var(--text-dim)', marginTop: '8px' },
}
