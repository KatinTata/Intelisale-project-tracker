import { useState, useEffect, useRef, useCallback } from 'react'
import Topbar from '../components/Topbar.jsx'
import ProjectTabs from '../components/ProjectTabs.jsx'
import ProjectCard from '../components/ProjectCard.jsx'
import SettingsModal from '../components/SettingsModal.jsx'
import { api } from '../api.js'
import { processEpicData, DEMO_PROJECTS } from '../utils.js'

const REFRESH_OPTIONS = [
  { label: 'Manuelno', value: 0 },
  { label: '5 min', value: 5 * 60 * 1000 },
  { label: '15 min', value: 15 * 60 * 1000 },
  { label: '30 min', value: 30 * 60 * 1000 },
]

function fmtLastRefresh(date) {
  if (!date) return null
  const diff = Math.floor((Date.now() - date) / 1000)
  if (diff < 60) return 'upravo'
  if (diff < 3600) return `pre ${Math.floor(diff / 60)} min`
  return `pre ${Math.floor(diff / 3600)}h`
}

export default function DashboardPage({ user: initialUser, theme, onToggleTheme, onLogout }) {
  const [user, setUser] = useState(initialUser)
  const [projects, setProjects] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [projectData, setProjectData] = useState({})
  const [loadingProjects, setLoadingProjects] = useState({})
  const [errorProjects, setErrorProjects] = useState({})
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [refreshInterval, setRefreshInterval] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [tick, setTick] = useState(0) // forces re-render for relative time display
  const intervalRef = useRef(null)
  const projectsRef = useRef([])

  const hasJira = !!(user.jiraUrl && user.jiraEmail)

  useEffect(() => {
    loadProjects()
  }, [])

  // Update relative time every 30s
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 30000)
    return () => clearInterval(t)
  }, [])

  // Auto-refresh interval
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (refreshInterval > 0 && hasJira) {
      intervalRef.current = setInterval(() => {
        refreshAll(projectsRef.current)
      }, refreshInterval)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [refreshInterval, hasJira])

  async function loadProjects() {
    if (!hasJira) {
      setProjects(DEMO_PROJECTS)
      projectsRef.current = DEMO_PROJECTS
      setActiveId(DEMO_PROJECTS[0].id)
      const demoData = {}
      DEMO_PROJECTS.forEach(p => { demoData[p.id] = p.data })
      setProjectData(demoData)
      setLastRefresh(Date.now())
      setInitialized(true)
      return
    }

    try {
      const list = await api.getProjects()
      setProjects(list)
      projectsRef.current = list
      if (list.length > 0) {
        setActiveId(list[0].id)
        await refreshAll(list)
      }
    } catch (err) {
      console.error('Failed to load projects', err)
    } finally {
      setInitialized(true)
    }
  }

  async function fetchProjectData(project) {
    setLoadingProjects(prev => ({ ...prev, [project.id]: true }))
    setErrorProjects(prev => ({ ...prev, [project.id]: null }))
    try {
      const { parents, subtasks } = await api.getTasks(project.epicKey)
      const data = processEpicData(parents, subtasks)
      setProjectData(prev => ({ ...prev, [project.id]: data }))
    } catch (err) {
      setErrorProjects(prev => ({ ...prev, [project.id]: err.message }))
    } finally {
      setLoadingProjects(prev => ({ ...prev, [project.id]: false }))
    }
  }

  async function refreshAll(list) {
    if (!hasJira) return
    setRefreshing(true)
    await Promise.all(list.map(p => fetchProjectData(p)))
    setLastRefresh(Date.now())
    setRefreshing(false)
  }

  function handleRefreshClick() {
    refreshAll(projectsRef.current)
  }

  async function handleAddProject(payload) {
    const { project } = await api.addProject(payload)
    const next = [...projectsRef.current, project]
    setProjects(next)
    projectsRef.current = next
    setActiveId(project.id)
    fetchProjectData(project)
  }

  async function handleDeleteProject(id) {
    try {
      await api.deleteProject(id)
      const next = projectsRef.current.filter(p => p.id !== id)
      setProjects(next)
      projectsRef.current = next
      if (activeId === id) setActiveId(next[0]?.id || null)
      setProjectData(prev => { const n = { ...prev }; delete n[id]; return n })
    } catch (err) {
      alert(err.message)
    }
  }

  function handleLogout() {
    localStorage.removeItem('jt_token')
    onLogout()
  }

  const activeProject = projects.find(p => p.id === activeId)
  const isLoadingActive = activeProject ? !!loadingProjects[activeProject.id] : false

  if (!initialized) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--textMuted)', fontFamily: "'TW Cen MT', 'Century Gothic'", fontSize: 16 }}>Učitavam...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Topbar
        user={user}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onOpenSettings={() => setSettingsOpen(true)}
        onLogout={handleLogout}
      />

      <ProjectTabs
        projects={projects}
        activeId={activeId}
        onSelect={setActiveId}
        onAdd={hasJira ? handleAddProject : undefined}
        onOpenSettings={() => setSettingsOpen(true)}
        projectData={projectData}
      />

      {projects.length > 0 ? (
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 28px' }}>
          {!hasJira && (
            <div style={{
              marginBottom: 20,
              padding: '12px 16px',
              background: 'var(--amberTint)',
              border: '1px solid var(--amber)',
              borderRadius: 10,
              fontSize: 14,
              fontFamily: "'TW Cen MT', 'Century Gothic'",
              color: 'var(--amber)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <span>⚙️</span>
              <span>
                Prikazuju se demo podaci. Podesite Jira konekciju u{' '}
                <button onClick={() => setSettingsOpen(true)} style={{ color: 'var(--amber)', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}>
                  Podešavanjima
                </button>{' '}
                da biste videli svoje projekte.
              </span>
            </div>
          )}

          {/* Refresh toolbar */}
          {hasJira && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 20,
              padding: '10px 16px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              flexWrap: 'wrap',
            }}>
              {/* Refresh button */}
              <button
                onClick={handleRefreshClick}
                disabled={refreshing || isLoadingActive}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontFamily: "'TW Cen MT', 'Century Gothic'",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: refreshing || isLoadingActive ? 'not-allowed' : 'pointer',
                  opacity: refreshing || isLoadingActive ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { if (!refreshing && !isLoadingActive) e.currentTarget.style.background = 'var(--accentHover)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)' }}
              >
                <span style={{
                  display: 'inline-block',
                  animation: refreshing || isLoadingActive ? 'spin 1s linear infinite' : 'none',
                }}>↻</span>
                Osveži podatke
              </button>

              {/* Divider */}
              <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

              {/* Auto-refresh selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: "'TW Cen MT', 'Century Gothic'", fontSize: 13, color: 'var(--textMuted)' }}>
                  Auto-refresh:
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {REFRESH_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setRefreshInterval(opt.value)}
                      style={{
                        fontFamily: "'TW Cen MT', 'Century Gothic'",
                        fontSize: 12,
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: refreshInterval === opt.value ? '1px solid var(--accent)' : '1px solid var(--border)',
                        background: refreshInterval === opt.value ? 'rgba(79,142,247,0.12)' : 'transparent',
                        color: refreshInterval === opt.value ? 'var(--accent)' : 'var(--textMuted)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Last refreshed */}
              {lastRefresh && (
                <>
                  <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
                  <span style={{ fontFamily: "'DM Mono'", fontSize: 12, color: 'var(--textMuted)' }}>
                    {refreshing || isLoadingActive
                      ? '⏳ Osvežavam...'
                      : `🕐 Osveženo ${fmtLastRefresh(lastRefresh)}`}
                  </span>
                </>
              )}
            </div>
          )}

          {activeProject && (
            <ProjectCard
              key={activeProject.id}
              project={activeProject}
              data={projectData[activeProject.id]}
              loading={!!loadingProjects[activeProject.id]}
              error={errorProjects[activeProject.id]}
              onDelete={() => handleDeleteProject(activeProject.id)}
            />
          )}
        </div>
      ) : (
        <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center', padding: '0 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
          <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 24, color: 'var(--text)', marginBottom: 12 }}>
            Nema projekata
          </h2>
          <p style={{ color: 'var(--textMuted)', fontFamily: "'TW Cen MT', 'Century Gothic'", marginBottom: 24 }}>
            {hasJira
              ? 'Dodajte prvi projekat klikom na "+ Dodaj projekat" u tab baru.'
              : 'Podesite Jira konekciju u podešavanjima da biste dodali projekte.'}
          </p>
          <button
            onClick={() => setSettingsOpen(true)}
            style={{
              background: 'var(--accent)',
              color: '#fff',
              borderRadius: 8,
              padding: '11px 24px',
              fontFamily: "'TW Cen MT', 'Century Gothic'",
              fontWeight: 600,
              fontSize: 15,
              cursor: 'pointer',
              border: 'none',
            }}
          >
            Otvori podešavanja
          </button>
        </div>
      )}

      {settingsOpen && (
        <SettingsModal
          user={user}
          onClose={() => setSettingsOpen(false)}
          onUserUpdate={(updated) => {
            setUser(updated)
            if (!hasJira && updated.jiraUrl) {
              window.location.reload()
            }
          }}
        />
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
