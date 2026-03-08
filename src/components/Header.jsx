import React from 'react'
import { useGym } from '../context/GymContext.jsx'
import { pickFolder, isFSASupported } from '../utils/fileSystem.js'

export default function Header() {
  const { state, dispatch } = useGym()

  async function handleFolderPick() {
    if (!isFSASupported()) {
      alert('File System Access API is not supported in this browser.\nUse Chrome or Edge for file saving.')
      return
    }
    const handle = await pickFolder()
    if (handle) {
      dispatch({ type: 'SET_FOLDER', handle })
      dispatch({ type: 'SET_TOAST', message: `Folder set: ${handle.name}` })
    }
  }

  const isOnHome = state.currentView === 'home'

  return (
    <header style={styles.header}>
      {/* Left: back or logo */}
      <div style={styles.left}>
        {isOnHome ? (
          <div style={styles.logoMark}>⬡</div>
        ) : (
          <button
            style={styles.backBtn}
            onClick={() => dispatch({ type: 'SET_VIEW', view: 'home' })}
          >
            ‹
          </button>
        )}
      </div>

      {/* Center: title */}
      <div style={styles.center}>
        {isOnHome ? (
          <span style={styles.title}>IRON LOG</span>
        ) : (
          <span style={styles.subtitle}>
            {state.weeks.find(w => w.id === state.currentWeekId)?.name || ''}
          </span>
        )}
      </div>

      {/* Right: folder + menu */}
      <div style={styles.right}>
        <button
          style={{
            ...styles.folderBtn,
            color: state.folderHandle ? 'var(--accent)' : 'var(--text-dim)',
          }}
          onClick={handleFolderPick}
          title={state.folderHandle ? `Folder: ${state.folderHandle.name}` : 'Set output folder'}
        >
          {state.folderHandle ? '📁' : '📂'}
        </button>
        <button
          style={styles.menuBtn}
          onClick={() => dispatch({ type: 'TOGGLE_MENU' })}
        >
          <HamburgerIcon />
        </button>
      </div>
    </header>
  )
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    height: '52px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--surface)',
    padding: '0 12px',
    flexShrink: 0,
    position: 'relative',
    zIndex: 10,
  },
  left: {
    width: '40px',
    display: 'flex',
    alignItems: 'center',
  },
  logoMark: {
    color: 'var(--accent)',
    fontSize: '20px',
  },
  backBtn: {
    fontSize: '26px',
    color: 'var(--text-muted)',
    lineHeight: 1,
    padding: '0 4px',
  },
  center: {
    flex: 1,
    textAlign: 'center',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '20px',
    letterSpacing: '4px',
    color: 'var(--text)',
  },
  subtitle: {
    fontFamily: 'var(--font-body)',
    fontSize: '13px',
    letterSpacing: '2px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
  },
  right: {
    width: '70px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '6px',
  },
  folderBtn: {
    fontSize: '16px',
    padding: '4px',
    borderRadius: 'var(--radius)',
    lineHeight: 1,
  },
  menuBtn: {
    padding: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburger: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    '& span': {
      display: 'block',
      width: '20px',
      height: '2px',
      background: 'var(--text)',
      borderRadius: '1px',
    },
  },
}

// Inject hamburger span styles since React inline styles don't support children selectors
const hStyle = document.createElement('style')
hStyle.textContent = `
  .hamburger-line {
    display: block;
    width: 20px;
    height: 2px;
    background: var(--text);
    border-radius: 1px;
  }
`
document.head.appendChild(hStyle)

// Patch the hamburger to use real DOM spans
export function HamburgerIcon() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span className="hamburger-line" />
      <span className="hamburger-line" />
      <span className="hamburger-line" />
    </div>
  )
}
