import { useState, useEffect, useRef } from 'react'
import Topbar from '../components/Topbar.jsx'
import ProjectTabs from '../components/ProjectTabs.jsx'
import ProjectCard from '../components/ProjectCard.jsx'
import SettingsModal from '../components/SettingsModal.jsx'
import BrainAnimation from '../components/BrainAnimation.jsx'
import AddProjectPage from './AddProjectPage.jsx'
import { api } from '../api.js'
import { processEpicData, DEMO_PROJECTS } from '../utils.js'
import { useWindowSize } from '../hooks/useWindowSize.js'

export default function DashboardPage({ user: initialUser, theme, onSetTheme, onLogout }) {
  const [user, setUser] = useState(initialUser)
  const [projects, setProjects] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [projectData, setProjectData] = useState({})
  const [loadingProjects, setLoadingProjects] = useState({})
  const [errorProjects, setErrorProjects] = useState({})
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [addingProject, setAddingProject] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const projectsRef = useRef([])

  const hasJira = !!(user.jiraUrl && user.jiraEmail)
  const { isMobile } = useWindowSize()

  useEffect(() => {
    loadProjects()
  }, [])

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
    setAddingProject(false)
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

  if (!initialized) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--textMuted)', fontFamily: "'TW Cen MT', 'Century Gothic'", fontSize: 16 }}>Učitavam...</div>
      </div>
    )
  }

  if (addingProject) {
    return (
      <AddProjectPage
        onAdd={handleAddProject}
        onCancel={() => setAddingProject(false)}
      />
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative' }}>
      {/* Global background animation */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <BrainAnimation opacity={0.08} />
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
      <Topbar
        user={user}
        theme={theme}
        onOpenSettings={() => setSettingsOpen(true)}
        onLogout={handleLogout}
      />

      <ProjectTabs
        projects={projects}
        activeId={activeId}
        onSelect={setActiveId}
        onAdd={hasJira ? () => setAddingProject(true) : undefined}
        onOpenSettings={() => setSettingsOpen(true)}
        projectData={projectData}
      />

      {projects.length > 0 ? (
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '16px' : '28px' }}>
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

          {activeProject && (
            <ProjectCard
              key={activeProject.id}
              project={activeProject}
              data={projectData[activeProject.id]}
              loading={!!loadingProjects[activeProject.id]}
              error={errorProjects[activeProject.id]}
              onDelete={() => handleDeleteProject(activeProject.id)}
              hasJira={hasJira}
              refreshing={refreshing}
              lastRefresh={lastRefresh}
              onRefresh={handleRefreshClick}
            />
          )}
        </div>
      ) : (
        <div style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center', padding: '0 16px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
          <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 24, color: 'var(--text)', marginBottom: 12 }}>
            Nema projekata
          </h2>
          <p style={{ color: 'var(--textMuted)', fontFamily: "'TW Cen MT', 'Century Gothic'", marginBottom: 24 }}>
            {hasJira
              ? 'Dodajte prvi projekat klikom na "+" u tab baru.'
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
          theme={theme}
          onSetTheme={onSetTheme}
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
    </div>
  )
}
