import { useState, useEffect } from 'react'
import { applyTheme, getEffectiveTheme } from './theme.js'
import { api } from './api.js'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'

export default function App() {
  const [page, setPage] = useState('login') // 'login' | 'dashboard'
  const [user, setUser] = useState(null)
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
      .then(res => { setUser(res.user); setPage('dashboard') })
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
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--textMuted)', fontFamily: "'DM Sans', sans-serif" }}>Učitavam...</div>
      </div>
    )
  }

  if (page === 'dashboard' && user) {
    return (
      <DashboardPage
        user={user}
        theme={theme}
        onSetTheme={handleSetTheme}
        onLogout={handleLogout}
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
