import React from 'react'
import { useGym } from '../context/GymContext.jsx'

export default function TemplateModal({ weekId, date, onClose }) {
  const { state, dispatch } = useGym()

  function selectTemplate(templateId) {
    dispatch({
      type: 'ADD_DAY',
      weekId,
      date,
      fromTemplate: templateId,
    })
    onClose()
  }

  function blankDay() {
    dispatch({ type: 'ADD_DAY', weekId, date })
    onClose()
  }

  function deleteTemplate(e, templateId) {
    e.stopPropagation()
    dispatch({ type: 'DELETE_TEMPLATE', templateId })
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div style={styles.title}>NEW DAY</div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={styles.body}>
          <div style={styles.sectionLabel}>START FROM TEMPLATE</div>

          {state.templates.length === 0 && (
            <div style={styles.noTemplates}>No templates saved yet.</div>
          )}

          <div style={styles.templateList}>
            {state.templates.map(tpl => (
              <div key={tpl.id} style={styles.templateItem} onClick={() => selectTemplate(tpl.id)}>
                <div style={styles.tplLeft}>
                  <div style={styles.tplTitle}>{tpl.title}</div>
                  <div style={styles.tplMeta}>
                    {tpl.exercises.length} exercise{tpl.exercises.length !== 1 ? 's' : ''}
                    {tpl.exercises.length > 0 && (
                      <> · {tpl.exercises.map(e => e.name).join(', ')}</>
                    )}
                  </div>
                </div>
                <div style={styles.tplActions}>
                  <button
                    style={styles.tplDelete}
                    onClick={e => deleteTemplate(e, tpl.id)}
                    title="Delete template"
                  >✕</button>
                  <span style={styles.tplArrow}>›</span>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.divider} />

          <button style={styles.blankBtn} onClick={blankDay}>
            <span style={styles.blankIcon}>+</span>
            Blank Day
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
    maxWidth: '480px',
    maxHeight: '70vh',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 18px 14px',
    borderBottom: '1px solid var(--border)',
  },
  title: {
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
  body: {
    padding: '16px 18px 24px',
  },
  sectionLabel: {
    fontSize: '11px',
    letterSpacing: '3px',
    color: 'var(--text-muted)',
    marginBottom: '10px',
  },
  noTemplates: {
    fontSize: '13px',
    color: 'var(--text-dim)',
    padding: '8px 0',
    marginBottom: '8px',
  },
  templateList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '16px',
  },
  templateItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '12px 14px',
    cursor: 'pointer',
  },
  tplLeft: {
    flex: 1,
    minWidth: 0,
  },
  tplTitle: {
    fontWeight: 600,
    fontSize: '15px',
    color: 'var(--text)',
  },
  tplMeta: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginTop: '2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  tplActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  tplDelete: {
    width: '22px',
    height: '22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    color: 'var(--text-dim)',
    borderRadius: 'var(--radius)',
  },
  tplArrow: {
    fontSize: '20px',
    color: 'var(--accent)',
  },
  divider: {
    height: '1px',
    background: 'var(--border)',
    marginBottom: '16px',
  },
  blankBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '12px 16px',
    border: '1px dashed var(--border-light)',
    borderRadius: 'var(--radius)',
    color: 'var(--text-muted)',
    fontSize: '14px',
    justifyContent: 'center',
  },
  blankIcon: {
    fontSize: '20px',
    color: 'var(--accent)',
  },
}
