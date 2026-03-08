import React, { useState } from 'react'
import { useGym } from '../context/GymContext.jsx'
import ExerciseModal from './ExerciseModal.jsx'
import { epley1RM, formatDate, generateId, isSetPR } from '../utils/calculations.js'
import { dayToMarkdown } from '../utils/mdUtils.js'
import { saveDayFile } from '../utils/fileSystem.js'

export default function DayView() {
  const { state, dispatch } = useGym()
  const [exModal, setExModal] = useState(null) // null | { mode: 'add' } | { mode: 'edit', exercise }
  const [showSaveTemplateConfirm, setShowSaveTemplateConfirm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [dragOver, setDragOver] = useState(null)
  const [dragging, setDragging] = useState(null)

  // Find current day + week
  const week = state.weeks.find(w => w.id === state.currentWeekId)
  const day = week?.days.find(d => d.id === state.currentDayId)

  if (!day) {
    return (
      <div style={styles.notFound}>
        <div style={styles.notFoundText}>Day not found</div>
        <button style={styles.backBtn} onClick={() => dispatch({ type: 'SET_VIEW', view: 'home' })}>
          ← Back
        </button>
      </div>
    )
  }

  function updateTitle(title) {
    dispatch({ type: 'UPDATE_DAY', dayId: day.id, updates: { title } })
  }

  function updateDate(date) {
    dispatch({ type: 'UPDATE_DAY', dayId: day.id, updates: { date } })
  }

  function addExercise(exerciseData) {
    const ex = { id: generateId(), ...exerciseData }
    dispatch({
      type: 'UPDATE_DAY',
      dayId: day.id,
      updates: { exercises: [...day.exercises, ex] },
    })
    setExModal(null)
  }

  function updateExercise(exerciseId, updates) {
    dispatch({ type: 'UPDATE_EXERCISE', dayId: day.id, exerciseId, updates })
    setExModal(null)
  }

  function deleteExercise(exerciseId) {
    dispatch({ type: 'DELETE_EXERCISE', dayId: day.id, exerciseId })
  }

  function saveAsTemplate() {
    dispatch({ type: 'SAVE_TEMPLATE', day })
    dispatch({ type: 'SET_TOAST', message: `Template "${day.title || 'Untitled'}" saved` })
    setShowSaveTemplateConfirm(false)
  }

  async function saveToFile() {
    if (!state.folderHandle) {
      dispatch({ type: 'SET_TOAST', message: 'No folder selected. Set folder in header.' })
      return
    }
    setIsSaving(true)
    try {
      const weekName = week?.name || ''
      const md = dayToMarkdown(day, weekName)
      await saveDayFile(state.folderHandle, day, md)
      dispatch({ type: 'SET_TOAST', message: 'Saved to .md file ✓' })
    } catch (e) {
      dispatch({ type: 'SET_TOAST', message: `Error: ${e.message}` })
    }
    setIsSaving(false)
  }

  // Drag-to-reorder exercises
  function handleDragStart(e, idx) {
    setDragging(idx)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e, idx) {
    e.preventDefault()
    setDragOver(idx)
  }

  function handleDrop(e, idx) {
    e.preventDefault()
    if (dragging === null || dragging === idx) return
    const newOrder = [...day.exercises]
    const [moved] = newOrder.splice(dragging, 1)
    newOrder.splice(idx, 0, moved)
    dispatch({ type: 'REORDER_EXERCISES', dayId: day.id, exercises: newOrder })
    setDragging(null)
    setDragOver(null)
  }

  function handleDragEnd() {
    setDragging(null)
    setDragOver(null)
  }

  const totalSets = day.exercises.reduce((acc, ex) => {
    return acc + ex.sets.filter(s => s.reps || s.weight).length
  }, 0)

  return (
    <div style={styles.container}>
      {/* Day header */}
      <div style={styles.dayHeader}>
        <button
          style={styles.backBtn}
          onClick={() => dispatch({ type: 'SET_VIEW', view: 'home' })}
        >
          ‹ Back
        </button>

        <div style={styles.dayMeta}>
          <input
            style={styles.titleInput}
            placeholder="Day title (e.g. Push Day 1)"
            value={day.title}
            onChange={e => updateTitle(e.target.value)}
          />
          <div style={styles.dateRow}>
            <span style={styles.weekBadge}>{week?.name}</span>
            <input
              type="date"
              style={styles.dateInput}
              value={day.date}
              onChange={e => updateDate(e.target.value)}
            />
          </div>
        </div>

        <div style={styles.dayActions}>
          <div style={styles.dayStats}>
            <span style={styles.dayStatNum}>{day.exercises.length}</span>
            <span style={styles.dayStatLabel}>ex</span>
            <span style={styles.dayStatDivider}>·</span>
            <span style={styles.dayStatNum}>{totalSets}</span>
            <span style={styles.dayStatLabel}>sets</span>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div style={styles.actionBar}>
        <button style={styles.addExBtn} onClick={() => setExModal({ mode: 'add' })}>
          <span style={styles.addExIcon}>+</span>
          NEW EXERCISE
        </button>
        <button style={styles.templateBtn} onClick={() => setShowSaveTemplateConfirm(true)}>
          ☆ Template
        </button>
        <button
          style={{ ...styles.saveFileBtn, opacity: isSaving ? 0.5 : 1 }}
          onClick={saveToFile}
          disabled={isSaving}
        >
          ↓ .md
        </button>
      </div>

      {/* Exercises */}
      <div style={styles.exerciseList}>
        {day.exercises.length === 0 && (
          <div style={styles.emptyExercises}>
            <div style={styles.emptyIcon}>🏋️</div>
            <div style={styles.emptyText}>No exercises yet</div>
            <div style={styles.emptyHint}>Tap NEW EXERCISE to add one</div>
          </div>
        )}

        {day.exercises.map((ex, idx) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            index={idx}
            dayId={day.id}
            weeks={state.weeks}
            isDragging={dragging === idx}
            isDragOver={dragOver === idx}
            onEdit={() => setExModal({ mode: 'edit', exercise: ex })}
            onDelete={() => deleteExercise(ex.id)}
            onDragStart={e => handleDragStart(e, idx)}
            onDragOver={e => handleDragOver(e, idx)}
            onDrop={e => handleDrop(e, idx)}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>

      {/* Exercise modal */}
      {exModal && (
        <ExerciseModal
          exercise={exModal.mode === 'edit' ? exModal.exercise : null}
          onSave={data => {
            if (exModal.mode === 'edit') {
              updateExercise(exModal.exercise.id, data)
            } else {
              addExercise(data)
            }
          }}
          onClose={() => setExModal(null)}
        />
      )}

      {/* Save as template confirm */}
      {showSaveTemplateConfirm && (
        <div style={styles.confirmOverlay}>
          <div style={styles.confirmBox}>
            <div style={styles.confirmTitle}>SAVE AS TEMPLATE</div>
            <div style={styles.confirmText}>
              Save <strong>"{day.title || 'Untitled'}"</strong> as a template?
              <br />
              <span style={styles.confirmNote}>Weights will be cleared. Name matches existing templates will overwrite.</span>
            </div>
            <div style={styles.confirmButtons}>
              <button style={styles.confirmCancel} onClick={() => setShowSaveTemplateConfirm(false)}>Cancel</button>
              <button style={styles.confirmSave} onClick={saveAsTemplate}>Save Template</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ExerciseCard({ exercise, index, dayId, weeks, isDragging, isDragOver, onEdit, onDelete, onDragStart, onDragOver, onDrop, onDragEnd }) {
  const filledSets = exercise.sets.filter(s => s.reps || s.weight)

  // Best estimated 1RM for this exercise in this session
  const best1RM = filledSets.reduce((best, s) => {
    const rm = epley1RM(s.weight, s.reps)
    return rm > best ? rm : best
  }, 0)

  // PR: is this the best ever 1RM for this exercise across all sessions?
  const hasPR = filledSets.some(s =>
    isSetPR(weeks, dayId, exercise.name, s.weight, s.reps)
  )

  return (
    <div
      style={{
        ...styles.exerciseCard,
        ...(isDragging ? styles.exerciseCardDragging : {}),
        ...(isDragOver ? styles.exerciseCardDragOver : {}),
      }}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      {/* Card header */}
      <div style={styles.cardHeader}>
        <div style={styles.dragHandle} title="Drag to reorder">⠿</div>
        <div style={styles.exName}>{exercise.name}</div>
        {hasPR && (
          <div style={styles.prBadge} title="Personal Record!">🏆 PR</div>
        )}
        {best1RM > 0 && (
          <div style={styles.rm1badge}>
            ~{best1RM}<span style={styles.rm1unit}>kg</span>
          </div>
        )}
        <button style={styles.editBtn} onClick={onEdit} title="Edit">✎</button>
        <button style={styles.deleteBtn} onClick={onDelete} title="Delete">✕</button>
      </div>

      {/* Sets table */}
      <div style={styles.setsTable}>
        <div style={styles.setsTableHeader}>
          <span style={styles.setNumCol}>#</span>
          <span style={styles.tableCol}>Reps</span>
          <span style={styles.tableCol}>kg</span>
          <span style={styles.tableCol}>Rest</span>
          <span style={{ ...styles.tableCol, flex: 2, textAlign: 'left' }}>Notes</span>
        </div>
        {exercise.sets.map((set, i) => {
          const hasData = set.reps || set.weight || set.rest || set.notes
          if (!hasData && i >= filledSets.length) return null
          return (
            <div key={i} style={styles.setsTableRow}>
              <span style={{ ...styles.setNumCol, color: 'var(--text-dim)' }}>{i + 1}</span>
              <span style={styles.tableCell}>{set.reps || '—'}</span>
              <span style={{ ...styles.tableCell, color: set.weight ? 'var(--accent)' : 'var(--text-dim)', fontWeight: set.weight ? 600 : 400 }}>
                {set.weight || '—'}
              </span>
              <span style={{ ...styles.tableCell, color: 'var(--text-muted)' }}>{set.rest || '—'}</span>
              <span style={{ ...styles.tableCell, flex: 2, textAlign: 'left', color: 'var(--text-muted)', fontSize: '12px' }}>
                {set.notes || ''}
              </span>
            </div>
          )
        })}
        {filledSets.length === 0 && (
          <div style={styles.noSetsHint}>No sets logged — tap ✎ to edit</div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  notFound: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
  },
  notFoundText: {
    fontFamily: 'var(--font-display)',
    fontSize: '24px',
    color: 'var(--text-muted)',
  },
  backBtn: {
    padding: '8px 14px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text-muted)',
    fontSize: '14px',
  },
  dayHeader: {
    padding: '12px 16px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--surface)',
  },
  dayMeta: {
    marginTop: '8px',
  },
  titleInput: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    fontFamily: 'var(--font-display)',
    fontSize: '28px',
    letterSpacing: '2px',
    color: 'var(--text)',
    padding: '0',
    marginBottom: '6px',
  },
  dateRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  weekBadge: {
    fontSize: '11px',
    letterSpacing: '2px',
    color: 'var(--accent)',
    background: 'var(--accent-dim)',
    padding: '3px 8px',
    borderRadius: 'var(--radius)',
    textTransform: 'uppercase',
    flexShrink: 0,
  },
  dateInput: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '13px',
    fontFamily: 'var(--font-mono)',
    padding: '0',
    width: 'auto',
    colorScheme: 'dark',
  },
  dayActions: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '8px',
  },
  dayStats: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
  dayStatNum: {
    color: 'var(--text)',
    fontWeight: 600,
  },
  dayStatLabel: {
    fontSize: '11px',
  },
  dayStatDivider: {
    color: 'var(--text-dim)',
    margin: '0 4px',
  },
  actionBar: {
    display: 'flex',
    gap: '8px',
    padding: '10px 16px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--surface)',
  },
  addExBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 16px',
    background: 'var(--accent)',
    borderRadius: 'var(--radius)',
    color: '#fff',
    fontFamily: 'var(--font-display)',
    fontSize: '15px',
    letterSpacing: '2px',
    flex: 1,
    justifyContent: 'center',
  },
  addExIcon: {
    fontSize: '18px',
  },
  templateBtn: {
    padding: '9px 14px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text-muted)',
    fontSize: '13px',
    whiteSpace: 'nowrap',
  },
  saveFileBtn: {
    padding: '9px 14px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text-muted)',
    fontSize: '13px',
    fontFamily: 'var(--font-mono)',
    whiteSpace: 'nowrap',
  },
  exerciseList: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 16px 40px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  emptyExercises: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  emptyIcon: { fontSize: '36px', marginBottom: '10px' },
  emptyText: {
    fontFamily: 'var(--font-display)',
    fontSize: '20px',
    letterSpacing: '2px',
    color: 'var(--text-muted)',
  },
  emptyHint: {
    fontSize: '13px',
    color: 'var(--text-dim)',
    marginTop: '8px',
  },
  exerciseCard: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    transition: 'opacity 150ms ease, border-color 150ms ease',
  },
  exerciseCardDragging: {
    opacity: 0.4,
  },
  exerciseCardDragOver: {
    borderColor: 'var(--accent)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 12px 10px',
    borderBottom: '1px solid var(--border)',
  },
  dragHandle: {
    color: 'var(--text-dim)',
    fontSize: '16px',
    cursor: 'grab',
    flexShrink: 0,
    userSelect: 'none',
  },
  exName: {
    fontFamily: 'var(--font-body)',
    fontWeight: 700,
    fontSize: '16px',
    flex: 1,
    letterSpacing: '0.5px',
  },
  prBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#f5c518',
    background: 'rgba(245, 197, 24, 0.12)',
    padding: '2px 7px',
    borderRadius: 'var(--radius)',
    flexShrink: 0,
    letterSpacing: '0.5px',
  },
  rm1badge: {
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--accent)',
    background: 'var(--accent-dim)',
    padding: '2px 8px',
    borderRadius: 'var(--radius)',
    flexShrink: 0,
  },
  rm1unit: {
    fontSize: '10px',
    fontWeight: 400,
    marginLeft: '1px',
  },
  editBtn: {
    width: '26px',
    height: '26px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    fontSize: '14px',
    flexShrink: 0,
  },
  deleteBtn: {
    width: '26px',
    height: '26px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-dim)',
    fontSize: '12px',
    flexShrink: 0,
  },
  setsTable: {
    padding: '8px 12px 10px',
  },
  setsTableHeader: {
    display: 'flex',
    gap: '4px',
    paddingBottom: '6px',
    borderBottom: '1px solid var(--border)',
    marginBottom: '4px',
  },
  setsTableRow: {
    display: 'flex',
    gap: '4px',
    padding: '4px 0',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
  },
  setNumCol: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--text-dim)',
    width: '20px',
    textAlign: 'center',
    flexShrink: 0,
  },
  tableCol: {
    flex: 1,
    fontSize: '10px',
    letterSpacing: '1px',
    color: 'var(--text-dim)',
    textAlign: 'center',
  },
  tableCell: {
    flex: 1,
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    color: 'var(--text)',
    textAlign: 'center',
  },
  noSetsHint: {
    fontSize: '12px',
    color: 'var(--text-dim)',
    padding: '6px 0',
    fontStyle: 'italic',
  },
  confirmOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.75)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  confirmBox: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    width: '100%',
    maxWidth: '360px',
  },
  confirmTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '20px',
    letterSpacing: '2px',
    marginBottom: '12px',
  },
  confirmText: {
    fontSize: '14px',
    color: 'var(--text)',
    lineHeight: 1.6,
    marginBottom: '20px',
  },
  confirmNote: {
    color: 'var(--text-muted)',
    fontSize: '12px',
  },
  confirmButtons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
  },
  confirmCancel: {
    padding: '9px 18px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text-muted)',
    fontSize: '14px',
  },
  confirmSave: {
    padding: '9px 18px',
    background: 'var(--accent)',
    borderRadius: 'var(--radius)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
  },
}
