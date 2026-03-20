import { useState, useEffect } from 'react'
import { applyTheme, getEffectiveTheme } from './theme.js'
import { api } from './api.js'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import ReleaseNotesPage from './pages/ReleaseNotesPage.jsx'
import EpicViewerPage from './pages/EpicViewerPage.jsx'
import BrainAnimation from './components/BrainAnimation.jsx'

export default function App() {
  const [page, setPage] = useState('login') // 'login' | 'dashboard' | 'releaseNotes' | 'epicViewer'
  const [user, setUser] = useState(null)
  const [epicViewerKey, setEpicViewerKey] = useState(() => {
    const m = window.location.pathname.match(/^\/release-notes\/(.+)$/)
    return m ? decodeURIComponent(m[1]) : null
  })
  const [theme, setTheme] = useState(() => localStorage.getItem('jt_theme') || 'dark')
  const [checking, setChecking] = useState(true)

  // Apply theme and listen for system changes when theme === 'system'
  useEffect(() => {
    applyTheme(theme)
    document.body.style.background = 'var(--bg)'
    document.body.style.color = 'var(--text)'

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => {
        applyTheme('system')
        document.body.style.background = 'var(--bg)'
        document.body.style.color = 'var(--text)'
      }
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [theme])

  useEffect(() => {
    const token = localStorage.getItem('jt_token')
    if (!token) { setChecking(false); return }
    api.me()
      .then(res => {
        setUser(res.user)
        const m = window.location.pathname.match(/^\/release-notes\/(.+)$/)
        setPage(m ? 'epicViewer' : 'dashboard')
      })
      .catch(() => localStorage.removeItem('jt_token'))
      .finally(() => setChecking(false))
  }, [])

  function handleLogin(userData) {
    setUser(userData)
    setPage('dashboard')
  }

  function handleLogout() {
    setUser(null)
    setPage('login')
  }

  function handleSetTheme(mode) {
    localStorage.setItem('jt_theme', mode)
    setTheme(mode)
  }

  const effectiveTheme = getEffectiveTheme(theme)

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <BrainAnimation opacity={0.35} fullscreen />
        <div style={{ color: 'var(--textMuted)', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", position: 'relative', zIndex: 1 }}>Učitavam...</div>
      </div>
    )
  }

  if (page === 'epicViewer' && user) {
    return (
      <EpicViewerPage
        initialEpicKey={epicViewerKey}
        onBack={() => { window.history.replaceState({}, '', '/'); setPage('dashboard') }}
      />
    )
  }

  if (page === 'releaseNotes' && user) {
    return (
      <ReleaseNotesPage
        user={user}
        onBack={() => setPage('dashboard')}
      />
    )
  }

  if (page === 'dashboard' && user) {
    return (
      <DashboardPage
        user={user}
        theme={theme}
        onSetTheme={handleSetTheme}
        onLogout={handleLogout}
        onGoToReleaseNotes={() => setPage('releaseNotes')}
        onGoToEpicViewer={() => { setEpicViewerKey(null); setPage('epicViewer') }}
      />
    )
  }

  return (
    <LoginPage
      effectiveTheme={effectiveTheme}
      onLogin={handleLogin}
    />
  )
}
