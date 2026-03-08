import React, { useState } from 'react'
import { useGym } from '../context/GymContext.jsx'
import { DAY_NAMES, formatDate, getMondayOfWeek } from '../utils/calculations.js'
import TemplateModal from './TemplateModal.jsx'

export default function SideMenu() {
  const { state, dispatch } = useGym()
  const [expandedWeeks, setExpandedWeeks] = useState({})
  const [renamingWeek, setRenamingWeek] = useState(null)
  const [renameVal, setRenameVal] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null) // { type, id }
  const [addDayFor, setAddDayFor] = useState(null) // { weekId, date }

  function toggleWeek(weekId) {
    setExpandedWeeks(prev => ({ ...prev, [weekId]: !prev[weekId] }))
  }

  function addWeek() {
    dispatch({ type: 'ADD_WEEK' })
    // auto-expand new week
    setTimeout(() => {
      const lastWeek = state.weeks[state.weeks.length - 1]
      if (lastWeek) setExpandedWeeks(prev => ({ ...prev, [lastWeek.id]: true }))
    }, 50)
  }

  function startRename(week) {
    setRenamingWeek(week.id)
    setRenameVal(week.name)
  }

  function commitRename() {
    if (renameVal.trim()) {
      dispatch({ type: 'RENAME_WEEK', weekId: renamingWeek, name: renameVal.trim() })
    }
    setRenamingWeek(null)
  }

  function addDay(weekId) {
    const today = new Date().toISOString().split('T')[0]
    setAddDayFor({ weekId, date: today })
  }

  function openDay(day) {
    dispatch({
      type: 'SET_VIEW',
      view: 'day',
      dayId: day.id,
      weekId: day.weekId,
    })
  }

  function goHome() {
    dispatch({ type: 'SET_VIEW', view: 'home' })
    dispatch({ type: 'CLOSE_MENU' })
  }

  const sortedWeeks = [...state.weeks].reverse()

  return (
    <>
      {/* Backdrop */}
      <div
        style={styles.backdrop}
        onClick={() => dispatch({ type: 'CLOSE_MENU' })}
      />

      {/* Panel */}
      <div style={styles.panel}>
        {/* Header */}
        <div style={styles.header}>
          <button style={styles.closeBtn} onClick={() => dispatch({ type: 'CLOSE_MENU' })}>✕</button>
          <div style={styles.headerTitle}>SESSIONS</div>
        </div>

        {/* Home link */}
        <button style={styles.homeBtn} onClick={goHome}>
          <span style={styles.homeBtnIcon}>⌂</span>
          <span>Dashboard</span>
        </button>

        {/* Add week */}
        <button style={styles.addWeekBtn} onClick={addWeek}>
          <span style={styles.addIcon}>+</span>
          NEW WEEK
        </button>

        {/* Week list */}
        <div style={styles.weekList}>
          {state.weeks.length === 0 && (
            <div style={styles.noWeeks}>No weeks yet.<br />Click NEW WEEK to start.</div>
          )}

          {sortedWeeks.map(week => {
            const isExpanded = expandedWeeks[week.id]
            const isRenaming = renamingWeek === week.id

            return (
              <div key={week.id} style={styles.weekBlock}>
                {/* Week row */}
                <div style={styles.weekRow}>
                  <button style={styles.weekToggle} onClick={() => toggleWeek(week.id)}>
                    <span style={{
                      ...styles.chevron,
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    }}>›</span>
                    {isRenaming ? (
                      <input
                        style={styles.renameInput}
                        value={renameVal}
                        onChange={e => setRenameVal(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={e => { if (e.key === 'Enter') commitRename() }}
                        onClick={e => e.stopPropagation()}
                        autoFocus
                      />
                    ) : (
                      <span style={styles.weekName}>{week.name}</span>
                    )}
                    <span style={styles.weekDayCount}>{week.days.length}d</span>
                  </button>
                  <button style={styles.weekMenuBtn} onClick={() => startRename(week)} title="Rename">✎</button>
                  <button
                    style={styles.weekMenuBtn}
                    onClick={() => setConfirmDelete({ type: 'week', id: week.id, label: week.name })}
                    title="Delete week"
                  >✕</button>
                </div>

                {/* Days list */}
                {isExpanded && (
                  <div style={styles.daysList}>
                    {week.days.length === 0 && (
                      <div style={styles.noDays}>No days yet</div>
                    )}
                    {week.days.map(day => (
                      <DayRow
                        key={day.id}
                        day={day}
                        isActive={state.currentDayId === day.id}
                        onClick={() => openDay(day)}
                        onDelete={() => setConfirmDelete({ type: 'day', id: day.id, label: day.title || day.date })}
                      />
                    ))}
                    <button style={styles.addDayBtn} onClick={() => addDay(week.id)}>
                      <span style={styles.addIcon}>+</span> add day
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Templates count */}
        {state.templates.length > 0 && (
          <div style={styles.templateHint}>
            {state.templates.length} template{state.templates.length !== 1 ? 's' : ''} saved
          </div>
        )}
      </div>

      {/* Confirm delete dialog */}
      {confirmDelete && (
        <div style={styles.confirmOverlay}>
          <div style={styles.confirmBox}>
            <div style={styles.confirmText}>
              Delete <strong>{confirmDelete.label}</strong>?
            </div>
            <div style={styles.confirmButtons}>
              <button style={styles.confirmCancel} onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button
                style={styles.confirmDelete}
                onClick={() => {
                  if (confirmDelete.type === 'week') {
                    dispatch({ type: 'DELETE_WEEK', weekId: confirmDelete.id })
                  } else {
                    dispatch({ type: 'DELETE_DAY', dayId: confirmDelete.id })
                    dispatch({ type: 'CLOSE_MENU' })
                  }
                  setConfirmDelete(null)
                }}
              >Delete</button>
            </div>
          </div>
        </div>
      )}
      {/* Template modal for new day */}
      {addDayFor && (
        <TemplateModal
          weekId={addDayFor.weekId}
          date={addDayFor.date}
          onClose={() => setAddDayFor(null)}
        />
      )}
    </>
  )
}

function DayRow({ day, isActive, onClick, onDelete }) {
  return (
    <div style={{ ...styles.dayRow, ...(isActive ? styles.dayRowActive : {}) }}>
      <button style={styles.dayBtn} onClick={onClick}>
        <div style={styles.dayTitle}>{day.title || 'Untitled'}</div>
        <div style={styles.dayDate}>{formatDate(day.date)}</div>
      </button>
      <button style={styles.dayDelete} onClick={onDelete}>✕</button>
    </div>
  )
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    zIndex: 100,
  },
  panel: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: '280px',
    background: 'var(--surface)',
    borderLeft: '1px solid var(--border)',
    zIndex: 101,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 14px',
    borderBottom: '1px solid var(--border)',
    gap: '10px',
  },
  closeBtn: {
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    fontSize: '14px',
    borderRadius: 'var(--radius)',
    flexShrink: 0,
  },
  headerTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '22px',
    letterSpacing: '3px',
    flex: 1,
  },
  homeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    fontSize: '14px',
    letterSpacing: '1px',
    color: 'var(--text-muted)',
    borderBottom: '1px solid var(--border)',
    width: '100%',
    textAlign: 'left',
  },
  homeBtnIcon: {
    fontSize: '16px',
    color: 'var(--accent)',
  },
  addWeekBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: '12px',
    padding: '10px 14px',
    background: 'var(--accent)',
    color: '#fff',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-display)',
    fontSize: '16px',
    letterSpacing: '2px',
    justifyContent: 'center',
  },
  addIcon: {
    fontSize: '18px',
    lineHeight: 1,
    fontWeight: 300,
  },
  weekList: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 0 12px',
  },
  noWeeks: {
    padding: '20px 16px',
    color: 'var(--text-dim)',
    fontSize: '13px',
    lineHeight: 1.6,
  },
  weekBlock: {
    borderBottom: '1px solid var(--border)',
  },
  weekRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px 0 0',
  },
  weekToggle: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 10px',
    textAlign: 'left',
    minWidth: 0,
  },
  chevron: {
    fontSize: '18px',
    color: 'var(--accent)',
    lineHeight: 1,
    transition: 'transform 150ms ease',
    flexShrink: 0,
  },
  weekName: {
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    fontSize: '14px',
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  weekDayCount: {
    fontSize: '11px',
    color: 'var(--text-dim)',
    fontFamily: 'var(--font-mono)',
    flexShrink: 0,
  },
  weekMenuBtn: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-dim)',
    fontSize: '12px',
    borderRadius: 'var(--radius)',
    flexShrink: 0,
  },
  renameInput: {
    flex: 1,
    background: 'var(--bg)',
    border: '1px solid var(--accent)',
    borderRadius: 'var(--radius)',
    padding: '3px 6px',
    fontSize: '13px',
    color: 'var(--text)',
    width: '100px',
  },
  daysList: {
    paddingLeft: '20px',
    paddingBottom: '6px',
    borderTop: '1px solid var(--border)',
    background: 'rgba(0,0,0,0.1)',
  },
  noDays: {
    padding: '8px 12px',
    fontSize: '12px',
    color: 'var(--text-dim)',
  },
  dayRow: {
    display: 'flex',
    alignItems: 'center',
    borderRadius: 'var(--radius)',
    margin: '3px 8px 3px 0',
    overflow: 'hidden',
  },
  dayRowActive: {
    background: 'var(--accent-dim)',
    borderLeft: '2px solid var(--accent)',
  },
  dayBtn: {
    flex: 1,
    textAlign: 'left',
    padding: '8px 10px',
    minWidth: 0,
  },
  dayTitle: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--text)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  dayDate: {
    fontSize: '11px',
    color: 'var(--text-dim)',
    fontFamily: 'var(--font-mono)',
    marginTop: '1px',
  },
  dayDelete: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-dim)',
    fontSize: '11px',
    flexShrink: 0,
  },
  addDayBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    fontSize: '12px',
    color: 'var(--accent)',
    letterSpacing: '1px',
  },
  templateHint: {
    padding: '10px 16px',
    fontSize: '11px',
    color: 'var(--text-dim)',
    borderTop: '1px solid var(--border)',
    textAlign: 'center',
  },
  confirmOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBox: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    width: '280px',
  },
  confirmText: {
    fontSize: '15px',
    color: 'var(--text)',
    marginBottom: '20px',
    lineHeight: 1.5,
  },
  confirmButtons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
  },
  confirmCancel: {
    padding: '8px 16px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text-muted)',
    fontSize: '14px',
  },
  confirmDelete: {
    padding: '8px 16px',
    background: 'var(--accent)',
    borderRadius: 'var(--radius)',
    color: '#fff',
    fontSize: '14px',
  },
}
