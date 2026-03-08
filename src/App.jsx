import React, { useEffect } from 'react'
import { GymProvider, useGym } from './context/GymContext.jsx'
import Header from './components/Header.jsx'
import HomePage from './components/HomePage.jsx'
import DayView from './components/DayView.jsx'
import SideMenu from './components/SideMenu.jsx'

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

function AppInner() {
  const { state } = useGym()

  return (
    <div style={styles.app}>
      <Header />

      <main style={styles.main}>
        {state.currentView === 'home' && <HomePage />}
        {state.currentView === 'day' && <DayView />}
      </main>

      {state.sideMenuOpen && <SideMenu />}

      {state.toast && (
        <div style={styles.toast}>
          {state.toast}
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <GymProvider>
      <AppInner />
    </GymProvider>
  )
}

const styles = {
  app: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: 'var(--bg)',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  toast: {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'var(--card)',
    border: '1px solid var(--border-light)',
    borderRadius: '20px',
    padding: '10px 20px',
    fontSize: '13px',
    color: 'var(--text)',
    fontFamily: 'var(--font-body)',
    zIndex: 300,
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    whiteSpace: 'nowrap',
    animation: 'toastIn 200ms ease',
    pointerEvents: 'none',
  },
}

// Inject toast animation
const toastStyle = document.createElement('style')
toastStyle.textContent = `
@keyframes toastIn {
  from { opacity: 0; transform: translateX(-50%) translateY(8px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}
`
document.head.appendChild(toastStyle)
