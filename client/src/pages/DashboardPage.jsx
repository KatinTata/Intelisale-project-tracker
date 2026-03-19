import { useState, useEffect, useRef } from 'react'
import Topbar from '../components/Topbar.jsx'
import ProjectTabs from '../components/ProjectTabs.jsx'
import ProjectCard from '../components/ProjectCard.jsx'
import SettingsModal from '../components/SettingsModal.jsx'
import ArchiveModal from '../components/ArchiveModal.jsx'
import UserManagementModal from '../components/UserManagementModal.jsx'
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
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [usersOpen, setUsersOpen] = useState(false)
  const [addingProject, setAddingProject] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [prevProjectData, setPrevProjectData] = useState({})
  const projectsRef = useRef([])

  const hasJira = !!(user.jiraUrl && user.jiraEmail)
  const isClient = user.role === 'client'
  const { isMobile } = useWindowSize()

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    if (!hasJira && !isClient) {
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
      setProjectData(prev => {
        const current = prev[project.id]
        if (current) {
          setPrevProjectData(p => ({ ...p, [project.id]: { data: current, time: Date.now() } }))
        }
        return { ...prev, [project.id]: data }
      })
    } catch (err) {
      setErrorProjects(prev => ({ ...prev, [project.id]: err.message }))
    } finally {
      setLoadingProjects(prev => ({ ...prev, [project.id]: false }))
    }
  }

  async function refreshAll(list) {
    if (!hasJira && !isClient) return
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

  async function handleArchiveProject(id) {
    try {
      await api.archiveProject(id)
      const next = projectsRef.current.filter(p => p.id !== id)
      setProjects(next)
      projectsRef.current = next
      if (activeId === id) setActiveId(next[0]?.id || null)
      setProjectData(prev => { const n = { ...prev }; delete n[id]; return n })
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleRestoreProject(project) {
    try {
      const { project: restored } = await api.restoreProject(project.id)
      const next = [...projectsRef.current, restored]
      setProjects(next)
      projectsRef.current = next
      setActiveId(restored.id)
      fetchProjectData(restored)
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
        <BrainAnimation opacity={0.45} fullscreen />
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
      <Topbar
        user={user}
        theme={theme}
        onOpenSettings={isClient ? undefined : () => setSettingsOpen(true)}
        onLogout={handleLogout}
        onOpenUsers={isClient ? undefined : () => setUsersOpen(true)}
      />

      <ProjectTabs
        projects={projects}
        activeId={activeId}
        onSelect={setActiveId}
        onAdd={hasJira && !isClient ? () => setAddingProject(true) : undefined}
        onArchive={isClient ? undefined : handleArchiveProject}
        onOpenArchive={isClient ? undefined : () => setArchiveOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        projectData={projectData}
      />

      {projects.length > 0 ? (
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '16px' : '28px' }}>
          {!hasJira && (
            <div className="glass-card" style={{
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
              onArchive={() => handleArchiveProject(activeProject.id)}
              hasJira={hasJira || isClient}
              refreshing={refreshing}
              lastRefresh={lastRefresh}
              onRefresh={handleRefreshClick}
              previousData={prevProjectData[activeProject.id]?.data}
              previousTime={prevProjectData[activeProject.id]?.time}
              isClient={isClient}
            />
          )}
        </div>
      ) : (
        <div style={{ maxWidth: 560, margin: '60px auto', padding: '0 16px' }}>
          {/* Welcome header */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <img
              src="/logo-white.png"
              alt="Intelisale"
              style={{ height: 36, marginBottom: 20, opacity: 0.9 }}
            />
            <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 26, color: 'var(--text)', marginBottom: 10 }}>
              Dobrodošli u Project Hub
            </h2>
            <p style={{ color: 'var(--textMuted)', fontFamily: "'TW Cen MT', 'Century Gothic'", fontSize: 15, lineHeight: 1.6 }}>
              Pratite napredak vaših Jira projekata na jednom mestu.
            </p>
          </div>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
            {[
              {
                step: '1',
                done: hasJira,
                title: 'Povežite Jira nalog',
                desc: 'Unesite vaš Jira URL, email i API token u Podešavanjima.',
                action: { label: 'Otvori podešavanja', onClick: () => setSettingsOpen(true) },
              },
              {
                step: '2',
                done: false,
                title: 'Dodajte projekat',
                desc: 'Kliknite "+" u tab baru i unesite Epic key vašeg projekta.',
                disabled: !hasJira,
              },
              {
                step: '3',
                done: false,
                title: 'Pratite napredak',
                desc: 'Pregledajte metrike, grafikone i dnevni napredak po projektu.',
                disabled: !hasJira,
              },
            ].map(s => (
              <div key={s.step} className="glass-card" style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                padding: '16px 20px',
                background: 'var(--surface)',
                border: `1px solid ${s.done ? 'var(--green)' : 'var(--border)'}`,
                borderRadius: 12,
                opacity: s.disabled ? 0.45 : 1,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: s.done ? 'var(--green)' : 'var(--accent)',
                  color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Syne', fontWeight: 800, fontSize: 14,
                }}>
                  {s.done ? '✓' : s.step}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 3 }}>
                    {s.title}
                  </div>
                  <div style={{ fontFamily: "'TW Cen MT', 'Century Gothic'", fontSize: 13, color: 'var(--textMuted)', lineHeight: 1.5 }}>
                    {s.desc}
                  </div>
                  {s.action && (
                    <button
                      onClick={s.action.onClick}
                      style={{
                        marginTop: 10,
                        background: 'var(--accent)', color: '#fff', border: 'none',
                        borderRadius: 7, padding: '7px 16px',
                        fontFamily: "'TW Cen MT', 'Century Gothic'", fontWeight: 600, fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      {s.action.label} →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setSettingsOpen(true)}
            style={{
              display: 'none',
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

      {archiveOpen && (
        <ArchiveModal
          onClose={() => setArchiveOpen(false)}
          onRestore={handleRestoreProject}
        />
      )}

      {usersOpen && (
        <UserManagementModal
          projects={projects}
          onClose={() => setUsersOpen(false)}
        />
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
        .glass-card {
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }
      `}</style>
      </div>
    </div>
  )
}
