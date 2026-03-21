import { useState, useEffect } from 'react'
import { applyTheme, getEffectiveTheme } from './theme.js'
import { api } from './api.js'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import ReleaseNotesPage from './pages/ReleaseNotesPage.jsx'
import ReleaseNotesEditorPage from './pages/ReleaseNotesEditorPage.jsx'
import EpicViewerPage from './pages/EpicViewerPage.jsx'
import DocumentsPage from './pages/DocumentsPage.jsx'
import BrainAnimation from './components/BrainAnimation.jsx'
import SettingsModal from './components/SettingsModal.jsx'

export default function App() {
  const [page, setPage] = useState('login') // 'login' | 'dashboard' | 'releaseNotes' | 'releaseNotesEditor' | 'epicViewer' | 'documents'
  const [user, setUser] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [epicViewerKey, setEpicViewerKey] = useState(null)
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
        const path = window.location.pathname
        if (path === '/release-notes/editor') setPage('releaseNotesEditor')
        else if (path.startsWith('/release-notes')) setPage('releaseNotes')
        else if (path.startsWith('/documents')) setPage('documents')
        else setPage('dashboard')
      })
      .catch(() => localStorage.removeItem('jt_token'))
      .finally(() => setChecking(false))
  }, [])

  function handleLogin(userData) {
    setUser(userData)
    const path = window.location.pathname
    if (path === '/release-notes/editor') setPage('releaseNotesEditor')
    else if (path.startsWith('/release-notes')) setPage('releaseNotes')
    else if (path.startsWith('/documents')) setPage('documents')
    else setPage('dashboard')
  }

  function handleLogout() {
    setUser(null)
    setPage('login')
  }

  function handleUserUpdate(updated) {
    const prevHasJira = !!(user?.jiraUrl && user?.jiraEmail)
    setUser(updated)
    setSettingsOpen(false)
    if (!prevHasJira && updated.jiraUrl) {
      window.location.reload()
    }
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

  const openSettings = () => setSettingsOpen(true)

  if (page === 'epicViewer' && user) {
    return (
      <>
        <EpicViewerPage
          initialEpicKey={epicViewerKey}
          user={user}
          theme={theme}
          onLogout={handleLogout}
          onGoToDashboard={() => { window.history.replaceState({}, '', '/'); setPage('dashboard') }}
          onGoToReleaseNotes={() => { window.history.replaceState({}, '', '/release-notes'); setPage('releaseNotes') }}
          onOpenSettings={openSettings}
          onOpenChat={() => { window.history.replaceState({}, '', '/'); setPage('dashboard') }}
        />
        {settingsOpen && <SettingsModal user={user} theme={theme} onSetTheme={handleSetTheme} onClose={() => setSettingsOpen(false)} onUserUpdate={handleUserUpdate} />}
      </>
    )
  }

  if (page === 'releaseNotes' && user) {
    return (
      <>
        <ReleaseNotesPage
          user={user}
          theme={theme}
          onLogout={handleLogout}
          onGoToDashboard={() => { window.history.replaceState({}, '', '/'); setPage('dashboard') }}
          onGoToEditor={() => { window.history.replaceState({}, '', '/release-notes/editor'); setPage('releaseNotesEditor') }}
          onOpenSettings={openSettings}
          onOpenChat={() => { window.history.replaceState({}, '', '/'); setPage('dashboard') }}
        />
        {settingsOpen && <SettingsModal user={user} theme={theme} onSetTheme={handleSetTheme} onClose={() => setSettingsOpen(false)} onUserUpdate={handleUserUpdate} />}
      </>
    )
  }

  if (page === 'releaseNotesEditor' && user) {
    return (
      <>
        <ReleaseNotesEditorPage
          user={user}
          theme={theme}
          onLogout={handleLogout}
          onGoToDashboard={() => { window.history.replaceState({}, '', '/'); setPage('dashboard') }}
          onGoToReleaseNotes={() => { window.history.replaceState({}, '', '/release-notes'); setPage('releaseNotes') }}
          onOpenSettings={openSettings}
          onOpenChat={() => { window.history.replaceState({}, '', '/'); setPage('dashboard') }}
        />
        {settingsOpen && <SettingsModal user={user} theme={theme} onSetTheme={handleSetTheme} onClose={() => setSettingsOpen(false)} onUserUpdate={handleUserUpdate} />}
      </>
    )
  }

  if (page === 'documents' && user) {
    return (
      <>
        <DocumentsPage
          user={user}
          theme={theme}
          onLogout={handleLogout}
          onGoToDashboard={() => { window.history.replaceState({}, '', '/'); setPage('dashboard') }}
          onGoToReleaseNotes={() => { window.history.replaceState({}, '', '/release-notes'); setPage('releaseNotes') }}
          onGoToReleaseNotesEditor={() => { window.history.replaceState({}, '', '/release-notes/editor'); setPage('releaseNotesEditor') }}
          onOpenSettings={openSettings}
          onOpenChat={() => { window.history.replaceState({}, '', '/'); setPage('dashboard') }}
        />
        {settingsOpen && <SettingsModal user={user} theme={theme} onSetTheme={handleSetTheme} onClose={() => setSettingsOpen(false)} onUserUpdate={handleUserUpdate} />}
      </>
    )
  }

  if (page === 'dashboard' && user) {
    return (
      <>
        <DashboardPage
          user={user}
          theme={theme}
          onSetTheme={handleSetTheme}
          onLogout={handleLogout}
          onOpenSettings={openSettings}
          onGoToReleaseNotes={() => { window.history.replaceState({}, '', '/release-notes'); setPage('releaseNotes') }}
          onGoToReleaseNotesEditor={() => { window.history.replaceState({}, '', '/release-notes/editor'); setPage('releaseNotesEditor') }}
          onGoToDocuments={() => { window.history.replaceState({}, '', '/documents'); setPage('documents') }}
        />
        {settingsOpen && <SettingsModal user={user} theme={theme} onSetTheme={handleSetTheme} onClose={() => setSettingsOpen(false)} onUserUpdate={handleUserUpdate} />}
      </>
    )
  }

  return (
    <LoginPage
      effectiveTheme={effectiveTheme}
      onLogin={handleLogin}
    />
  )
}
