import React, { useState } from 'react'

const COMMON_EXERCISES = [
  'Squat', 'Bench Press', 'Deadlift', 'Overhead Press', 'Barbell Row',
  'Romanian Deadlift', 'Bulgarian Split Squat', 'Incline Bench Press',
  'Dumbbell Press', 'Pull-Up', 'Dip', 'Leg Press', 'Hack Squat',
  'Cable Row', 'Lat Pulldown', 'Face Pull', 'Tricep Pushdown',
  'Bicep Curl', 'Lateral Raise', 'Hip Thrust',
]

export default function ExerciseModal({ exercise, onSave, onClose }) {
  const isEdit = !!exercise

  const [name, setName] = useState(exercise?.name || '')
  const [sets, setSets] = useState(
    exercise?.sets || [
      { reps: '', weight: '', rest: '', notes: '' },
      { reps: '', weight: '', rest: '', notes: '' },
      { reps: '', weight: '', rest: '', notes: '' },
      { reps: '', weight: '', rest: '', notes: '' },
      { reps: '', weight: '', rest: '', notes: '' },
    ]
  )
  const [showSuggestions, setShowSuggestions] = useState(false)

  function updateSet(idx, field, value) {
    setSets(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  function handleSave() {
    if (!name.trim()) return
    onSave({ name: name.trim(), sets })
  }

  const filteredSuggestions = name.length > 0
    ? COMMON_EXERCISES.filter(e => e.toLowerCase().includes(name.toLowerCase()) && e.toLowerCase() !== name.toLowerCase())
    : []

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.modalHeader}>
          <div style={styles.modalTitle}>
            {isEdit ? 'EDIT EXERCISE' : 'NEW EXERCISE'}
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Exercise name */}
        <div style={styles.nameSection}>
          <input
            style={styles.nameInput}
            placeholder="Exercise name..."
            value={name}
            onChange={e => { setName(e.target.value); setShowSuggestions(true) }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            autoFocus
          />
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div style={styles.suggestions}>
              {filteredSuggestions.slice(0, 6).map(s => (
                <button
                  key={s}
                  style={styles.suggestionItem}
                  onMouseDown={() => { setName(s); setShowSuggestions(false) }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sets table */}
        <div style={styles.setsSection}>
          <div style={styles.setsHeader}>
            <span style={styles.setNum}>#</span>
            <span style={styles.colLabel}>REPS</span>
            <span style={styles.colLabel}>KG</span>
            <span style={styles.colLabel}>REST</span>
            <span style={{ ...styles.colLabel, flex: 2 }}>NOTES</span>
          </div>

          {sets.map((set, i) => (
            <div key={i} style={styles.setRow}>
              <span style={styles.setNum}>{i + 1}</span>
              <input
                style={styles.setInput}
                placeholder="—"
                value={set.reps}
                onChange={e => updateSet(i, 'reps', e.target.value)}
                inputMode="numeric"
              />
              <input
                style={styles.setInput}
                placeholder="—"
                value={set.weight}
                onChange={e => updateSet(i, 'weight', e.target.value)}
                inputMode="decimal"
              />
              <input
                style={styles.setInput}
                placeholder="2:00"
                value={set.rest}
                onChange={e => updateSet(i, 'rest', e.target.value)}
              />
              <input
                style={{ ...styles.setInput, flex: 2 }}
                placeholder="notes..."
                value={set.notes}
                onChange={e => updateSet(i, 'notes', e.target.value)}
              />
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={styles.modalActions}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            style={{ ...styles.saveBtn, opacity: !name.trim() ? 0.4 : 1 }}
            onClick={handleSave}
            disabled={!name.trim()}
          >
            {isEdit ? 'Update' : 'Add Exercise'}
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.75)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  modal: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderTopLeftRadius: '12px',
    borderTopRightRadius: '12px',
    width: '100%',
    maxWidth: '640px',
    maxHeight: '90vh',
    overflowY: 'auto',
    paddingBottom: '20px',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 18px 14px',
    borderBottom: '1px solid var(--border)',
    position: 'sticky',
    top: 0,
    background: 'var(--surface)',
    zIndex: 1,
  },
  modalTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '22px',
    letterSpacing: '3px',
  },
  closeBtn: {
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    fontSize: '14px',
  },
  nameSection: {
    padding: '16px 18px 10px',
    position: 'relative',
  },
  nameInput: {
    width: '100%',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '12px 14px',
    fontSize: '18px',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    color: 'var(--text)',
    letterSpacing: '0.5px',
  },
  suggestions: {
    position: 'absolute',
    top: 'calc(100% - 10px)',
    left: '18px',
    right: '18px',
    background: 'var(--card)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius)',
    zIndex: 10,
    overflow: 'hidden',
    boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
  },
  suggestionItem: {
    display: 'block',
    width: '100%',
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: '14px',
    color: 'var(--text)',
    borderBottom: '1px solid var(--border)',
  },
  setsSection: {
    padding: '0 18px',
  },
  setsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 0 6px',
    borderBottom: '1px solid var(--border)',
    marginBottom: '4px',
  },
  setNum: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--text-dim)',
    width: '18px',
    textAlign: 'center',
    flexShrink: 0,
  },
  colLabel: {
    flex: 1,
    fontSize: '10px',
    letterSpacing: '2px',
    color: 'var(--text-dim)',
    textAlign: 'center',
  },
  setRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 0',
  },
  setInput: {
    flex: 1,
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '8px 6px',
    fontSize: '14px',
    textAlign: 'center',
    color: 'var(--text)',
    fontFamily: 'var(--font-mono)',
    minWidth: 0,
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    padding: '16px 18px 0',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    padding: '10px 20px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text-muted)',
    fontSize: '14px',
    fontFamily: 'var(--font-body)',
  },
  saveBtn: {
    padding: '10px 24px',
    background: 'var(--accent)',
    borderRadius: 'var(--radius)',
    color: '#fff',
    fontSize: '14px',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    letterSpacing: '0.5px',
  },
}
