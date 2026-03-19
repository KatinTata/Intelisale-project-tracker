import { useState, useEffect } from 'react'
import { applyTheme } from './theme.js'
import { api } from './api.js'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'

export default function App() {
  const [page, setPage] = useState('login') // 'login' | 'register' | 'dashboard'
  const [user, setUser] = useState(null)
  const [theme, setTheme] = useState(() => localStorage.getItem('jt_theme') || 'dark')
  const [checking, setChecking] = useState(true)

  // Apply theme on mount and change
  useEffect(() => {
    applyTheme(theme)
    document.body.style.background = 'var(--bg)'
    document.body.style.color = 'var(--text)'
  }, [theme])

  // Check existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('jt_token')
    if (!token) {
      setChecking(false)
      return
    }
    api.me()
      .then(res => {
        setUser(res.user)
        setPage('dashboard')
      })
      .catch(() => {
        localStorage.removeItem('jt_token')
      })
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

  function toggleTheme() {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('jt_theme', next)
      return next
    })
  }

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--textMuted)', fontFamily: "'DM Sans'" }}>Učitavam...</div>
      </div>
    )
  }

  if (page === 'dashboard' && user) {
    return (
      <DashboardPage
        user={user}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'register') {
    return <RegisterPage onLogin={handleLogin} onGoLogin={() => setPage('login')} />
  }

  return <LoginPage onLogin={handleLogin} onGoRegister={() => setPage('register')} />
}
