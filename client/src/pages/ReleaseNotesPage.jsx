import { useState, useEffect } from 'react'
import { api } from '../api.js'
import { categorizeIssue, generateMarkdown, markdownToHtml } from '../utils/releaseNotesGenerator.js'

export default function ReleaseNotesPage({ user, onBack }) {
  const isClient = user?.role === 'client'

  // Tab
  const [activeTab, setActiveTab] = useState(isClient ? 'list' : 'editor')

  // Editor state
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [config, setConfig] = useState({ clientName: '', version: '', language: 'sr', showKeys: true })
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [markdown, setMarkdown] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiAvailable, setAiAvailable] = useState(false)
  const [taskError, setTaskError] = useState(null)
  const [expandedTaskId, setExpandedTaskId] = useState(null)
  const [taskDetail, setTaskDetail] = useState({})
  const [generatingAll, setGeneratingAll] = useState(false)
  const [publishState, setPublishState] = useState(null)
  const [publishModal, setPublishModal] = useState(null) // null | { clientUsers: [] }
  const [editModal, setEditModal] = useState(null)
  const [customJql, setCustomJql] = useState('')
  const [fetchTrigger, setFetchTrigger] = useState(0)

  // List state
  const [notesList, setNotesList] = useState([])
  const [notesListLoading, setNotesListLoading] = useState(false)
  const [assignModal, setAssignModal] = useState(null)
  const [allClientUsers, setAllClientUsers] = useState([])

  useEffect(() => {
    api.getProjects().then(setProjects).catch(() => {})
    setAiAvailable(!!user?.hasAnthropicKey)
  }, [])

  useEffect(() => {
    if (!selectedProject) { setTasks([]); setTaskError(null); return }
    setLoadingTasks(true)
    setTaskError(null)
    const token = localStorage.getItem('jt_token')
    fetch('/api/release-notes/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        projectId: selectedProject.id,
        ...(customJql.trim() ? { customJql: customJql.trim() } : {}),
      }),
    })
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`); return d })
      .then(data => {
        setTasks((data.tasks || []).map(t => ({ ...t, included: true, category: categorizeIssue(t) })))
        setTaskDetail({})
      })
      .catch(err => { setTaskError(err.message); setTasks([]) })
      .finally(() => setLoadingTasks(false))
  }, [selectedProject, fetchTrigger])

  useEffect(() => {
    const selected = tasks.filter(t => t.included)
    setMarkdown(selected.length ? generateMarkdown(selected, config) : '')
  }, [tasks, config])

  useEffect(() => {
    if (activeTab === 'list') loadNotesList()
  }, [activeTab])

  const html = markdown ? markdownToHtml(markdown, {
    clientName: config.clientName,
    version: config.version,
    productName: selectedProject?.displayName || selectedProject?.epicKey || '',
    language: config.language,
    origin: window.location.origin,
  }) : ''

  async function loadNotesList() {
    setNotesListLoading(true)
    try {
      const data = isClient ? await api.getClientReleaseNotes() : await api.getReleaseNotesList()
      setNotesList(data?.notes || [])
    } catch { setNotesList([]) }
    setNotesListLoading(false)
  }

  function toggleTask(taskId) {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, included: !t.included } : t))
  }

  function toggleExpand(task) {
    setExpandedTaskId(prev => prev === task.id ? null : task.id)
  }

  async function loadTaskDetail(task) {
    const id = task.id
    if (taskDetail[id]) return
    setTaskDetail(prev => ({ ...prev, [id]: { loading: true } }))
    const jt = localStorage.getItem('jt_token')
    try {
      const res = await fetch('/api/release-notes/task-detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jt}` },
        body: JSON.stringify({ taskKey: task.key, projectId: selectedProject.id }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setTaskDetail(prev => ({ ...prev, [id]: d }))
    } catch (err) {
      setTaskDetail(prev => ({ ...prev, [id]: { loading: false, error: err.message } }))
    }
  }

  async function generateDescription(task) {
    const id = task.id
    let detail = taskDetail[id]
    if (!detail || detail.error) {
      setTaskDetail(prev => ({ ...prev, [id]: { loading: true } }))
      const jt = localStorage.getItem('jt_token')
      try {
        const res = await fetch('/api/release-notes/task-detail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jt}` },
          body: JSON.stringify({ taskKey: task.key, projectId: selectedProject.id }),
        })
        detail = await res.json()
        setTaskDetail(prev => ({ ...prev, [id]: detail }))
      } catch (err) {
        setTaskDetail(prev => ({ ...prev, [id]: { loading: false, error: err.message } }))
        return
      }
    }
    setTaskDetail(prev => ({ ...prev, [id]: { ...detail, generating: true } }))
    const parts = [`Naziv taska: ${detail.summary || task.fields?.summary || ''}`]
    if (detail.description) parts.push(`Opis: ${detail.description}`)
    if (detail.comments?.length) parts.push(`Komentari:\n${detail.comments.map(c => `- ${c.author}: ${c.text}`).join('\n')}`)
    const jt = localStorage.getItem('jt_token')
    try {
      const res = await fetch('/api/release-notes/ai-enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jt}` },
        body: JSON.stringify({ action: 'generate_description', content: parts.join('\n\n') }),
      })
      const data = await res.json()
      if (data.result) {
        setTaskDetail(prev => ({ ...prev, [id]: { ...prev[id], generatedDesc: data.result, generating: false } }))
        setTasks(prev => prev.map(t => t.id === id ? { ...t, description: data.result } : t))
      } else {
        setTaskDetail(prev => ({ ...prev, [id]: { ...prev[id], generating: false } }))
      }
    } catch {
      setTaskDetail(prev => ({ ...prev, [id]: { ...prev[id], generating: false } }))
    }
  }

  function clearDescription(taskId) {
    setTaskDetail(prev => ({ ...prev, [taskId]: { ...prev[taskId], generatedDesc: null } }))
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, description: null } : t))
  }

  function openEditModal(task) {
    setEditModal({
      taskId: task.id,
      taskKey: task.key,
      projectId: selectedProject?.id,
      name: task.fields?.summary || task.summary || '',
      description: task.description || '',
    })
  }

  function saveEditModal(name, description) {
    if (!editModal) return
    const { taskId } = editModal
    setTasks(prev => prev.map(t => t.id !== taskId ? t : {
      ...t, description, fields: { ...t.fields, summary: name }, summary: name,
    }))
    setEditModal(null)
  }

  async function generateForModal(setAiResult, setGenerating) {
    if (!editModal) return
    const task = tasks.find(t => t.id === editModal.taskId)
    if (!task) return
    setGenerating(true)
    const jt = localStorage.getItem('jt_token')
    let detail = taskDetail[editModal.taskId]
    if (!detail || detail.error) {
      try {
        const res = await fetch('/api/release-notes/task-detail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jt}` },
          body: JSON.stringify({ taskKey: editModal.taskKey, projectId: editModal.projectId }),
        })
        detail = await res.json()
        setTaskDetail(prev => ({ ...prev, [editModal.taskId]: detail }))
      } catch { setGenerating(false); return }
    }
    const parts = [`Naziv taska: ${detail.summary || task.fields?.summary || ''}`]
    if (detail.description) parts.push(`Opis: ${detail.description}`)
    if (detail.comments?.length) parts.push(`Komentari:\n${detail.comments.map(c => `- ${c.author}: ${c.text}`).join('\n')}`)
    try {
      const res = await fetch('/api/release-notes/ai-enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jt}` },
        body: JSON.stringify({ action: 'generate_description', content: parts.join('\n\n') }),
      })
      const data = await res.json()
      if (data.result) {
        setAiResult(data.result)
        setTaskDetail(prev => ({ ...prev, [editModal.taskId]: { ...prev[editModal.taskId], generatedDesc: data.result } }))
      }
    } catch { /* ignore */ }
    setGenerating(false)
  }

  const filteredTasks = tasks.filter(t => {
    const matchSearch = !search ||
      t.key?.toLowerCase().includes(search.toLowerCase()) ||
      (t.fields?.summary || t.summary || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = categoryFilter === 'all' || t.category === categoryFilter
    return matchSearch && matchCat
  })

  function getCategoryBadgeStyle(category) {
    const map = {
      feature:     { background: 'rgba(79,142,247,0.12)', color: 'var(--accent)' },
      bug:         { background: 'var(--redTint)',        color: 'var(--red)' },
      improvement: { background: 'var(--greenTint)',      color: 'var(--green)' },
      technical:   { background: 'var(--surfaceAlt)',     color: 'var(--textMuted)' },
      other:       { background: 'var(--surfaceAlt)',     color: 'var(--textSubtle)' },
    }
    return map[category] || map.other
  }

  function openInNewTab() {
    if (!html) return
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }

  async function aiCall(action, content) {
    const jt = localStorage.getItem('jt_token')
    const res = await fetch('/api/release-notes/ai-enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jt}` },
      body: JSON.stringify({ action, content }),
    })
    return res.json()
  }

  async function handleTranslate() {
    if (!markdown || aiLoading) return
    setAiLoading(true)
    try {
      const data = await aiCall('translate_en', markdown)
      if (data.result) setMarkdown(data.result)
    } finally { setAiLoading(false) }
  }

  async function generateAllDescriptions() {
    if (generatingAll) return
    const included = tasks.filter(t => t.included)
    if (!included.length) return
    setGeneratingAll(true)
    for (const task of included) {
      let detail = taskDetail[task.id]
      if (!detail || detail.loading) {
        const jt = localStorage.getItem('jt_token')
        try {
          const res = await fetch('/api/release-notes/task-detail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jt}` },
            body: JSON.stringify({ taskKey: task.key, projectId: selectedProject.id }),
          })
          detail = await res.json()
          setTaskDetail(prev => ({ ...prev, [task.id]: detail }))
        } catch { continue }
      }
      const parts = [`Naziv taska: ${detail.summary || task.fields?.summary || ''}`]
      if (detail.description) parts.push(`Opis: ${detail.description}`)
      if (detail.comments?.length) parts.push(`Komentari:\n${detail.comments.map(c => `- ${c.author}: ${c.text}`).join('\n')}`)
      try {
        const data = await aiCall('generate_description', parts.join('\n\n'))
        if (data.result) setTasks(prev => prev.map(t => t.id === task.id ? { ...t, description: data.result } : t))
      } catch { /* skip */ }
    }
    setGeneratingAll(false)
  }

  async function handlePublish() {
    if (!html) {
      setPublishState({ error: 'Nema sadržaja za objavljivanje. Izaberi projekat i uključi taskove.' })
      return null
    }
    setPublishState({ loading: true })
    const jt = localStorage.getItem('jt_token')
    try {
      const res = await fetch('/api/release-notes/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jt}` },
        body: JSON.stringify({
          html,
          title: `${config.clientName || ''} ${config.version || ''}`.trim(),
          projectId: selectedProject?.id || null,
        }),
      })
      const ct = res.headers.get('content-type') || ''
      if (!ct.includes('application/json')) {
        setPublishState({ error: `Server greška ${res.status} — restart server pa pokušaj ponovo.` })
        return null
      }
      const data = await res.json()
      if (data.token) {
        setPublishState({ url: `${window.location.origin}/rn/${data.token}`, updated: data.updated })
        return data // { token, id, updated }
      } else {
        setPublishState({ error: data.error || 'Server nije vratio token.' })
        return null
      }
    } catch (err) {
      setPublishState({ error: err.message })
      return null
    }
  }

  function setConfigField(key, value) {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  // ── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{
        padding: '0 28px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 16, height: 56,
        background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 8, padding: '6px 14px', color: 'var(--textMuted)',
            fontFamily: 'DM Sans', fontSize: 13, cursor: 'pointer', transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--borderHover)'; e.currentTarget.style.color = 'var(--text)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--textMuted)' }}
        >
          ← Nazad
        </button>
        <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>
          📋 Release Notes
        </span>

        {/* Tab pills */}
        <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
          {!isClient && (
            <button
              onClick={() => setActiveTab('editor')}
              style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 12, fontFamily: 'DM Sans', fontWeight: 500,
                background: activeTab === 'editor' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'editor' ? '#fff' : 'var(--textMuted)',
                border: activeTab === 'editor' ? 'none' : '1px solid var(--border)',
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}
            >
              ✏️ Kreiranje
            </button>
          )}
          <button
            onClick={() => setActiveTab('list')}
            style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, fontFamily: 'DM Sans', fontWeight: 500,
              background: activeTab === 'list' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'list' ? '#fff' : 'var(--textMuted)',
              border: activeTab === 'list' ? 'none' : '1px solid var(--border)',
              cursor: 'pointer', transition: 'all 0.2s ease',
            }}
          >
            📋 Objavljene {notesList.length > 0 ? `(${notesList.length})` : ''}
          </button>
        </div>
      </div>

      {/* ── LIST TAB ─────────────────────────────────────────────── */}
      {activeTab === 'list' && (
        <div style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>
              {isClient ? 'Dostupne verzije' : 'Objavljene verzije'}
            </span>
            <button
              onClick={loadNotesList}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontFamily: 'DM Mono',
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--textMuted)', cursor: 'pointer', transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--borderHover)'; e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--textMuted)' }}
            >
              ↻ Osveži
            </button>
          </div>

          {notesListLoading ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--textMuted)', fontFamily: 'DM Sans', fontSize: 14 }}>
              Učitavam...
            </div>
          ) : notesList.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--textMuted)', fontFamily: 'DM Sans', fontSize: 14 }}>
              {isClient
                ? 'Nema dostupnih release notes za vaš nalog.'
                : 'Nema objavljenih verzija. Kreiraj prvu na tabu "Kreiranje".'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notesList.map(note => (
                <NoteListItem
                  key={note.id}
                  note={note}
                  isClient={isClient}
                  onRelease={async () => {
                    if (!window.confirm('Označiti kao pušteno u produkciju? Klijenti će biti obavešteni.')) return
                    await api.markReleaseNoteReleased(note.id)
                    loadNotesList()
                  }}
                  onDelete={async () => {
                    if (!window.confirm('Obrisati ovaj release notes?')) return
                    await api.deleteReleaseNote(note.id)
                    loadNotesList()
                  }}
                  onManageClients={async () => {
                    const [clientsData, usersData] = await Promise.all([
                      api.getReleaseNoteClients(note.id),
                      api.getUsers(),
                    ])
                    setAllClientUsers((Array.isArray(usersData) ? usersData : []).filter(u => u.role === 'client'))
                    setAssignModal({ noteId: note.id, currentClients: clientsData?.clients || [] })
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── EDITOR TAB ───────────────────────────────────────────── */}
      {activeTab === 'editor' && !isClient && (
        <div style={{ padding: '20px 28px' }}>

          {/* Config bar */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '16px 20px', marginBottom: 20,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>

              <div>
                <label style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--textMuted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Projekat</label>
                <select
                  value={selectedProject?.id || ''}
                  onChange={e => setSelectedProject(projects.find(p => p.id == e.target.value) || null)}
                  style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontFamily: 'DM Sans', fontSize: 14 }}
                >
                  <option value="">Izaberi projekat...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.displayName || p.epicKey}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--textMuted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Naziv klijenta</label>
                <input value={config.clientName} onChange={e => setConfigField('clientName', e.target.value)} placeholder="npr. Knjaz Miloš"
                  style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontFamily: 'DM Sans', fontSize: 14, boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--textMuted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Verzija</label>
                <input value={config.version} onChange={e => setConfigField('version', e.target.value)} placeholder="npr. v2.4.1"
                  style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontFamily: 'DM Sans', fontSize: 14, boxSizing: 'border-box' }} />
              </div>

            </div>

            {/* JQL row */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--textMuted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Prilagođeni JQL (opciono)</label>
                <input value={customJql} onChange={e => setCustomJql(e.target.value)} placeholder='npr. project = CRM AND fixVersion = "v2.4" ORDER BY created ASC'
                  style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontFamily: 'DM Mono', fontSize: 12, boxSizing: 'border-box' }}
                  onKeyDown={e => { if (e.key === 'Enter' && selectedProject) setFetchTrigger(n => n + 1) }} />
              </div>
              <button
                onClick={() => { if (selectedProject) setFetchTrigger(n => n + 1) }}
                disabled={!selectedProject}
                style={{
                  padding: '8px 16px', borderRadius: 8, fontSize: 13, fontFamily: 'DM Sans', fontWeight: 600,
                  background: !selectedProject ? 'var(--surfaceAlt)' : 'var(--accent)',
                  color: !selectedProject ? 'var(--textMuted)' : '#fff',
                  border: 'none', cursor: !selectedProject ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease', whiteSpace: 'nowrap',
                }}
              >↻ Primeni JQL</button>
            </div>
          </div>

          {/* Two-column layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 16, alignItems: 'start' }}>

            {/* LEFT — tasks */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <input placeholder="🔍 Pretraži taskove..." value={search} onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontFamily: 'DM Sans', fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['all', 'feature', 'bug', 'improvement', 'technical'].map(cat => (
                    <button key={cat} onClick={() => setCategoryFilter(cat)} style={{
                      padding: '4px 10px', borderRadius: 20, fontSize: 11, fontFamily: 'DM Mono', cursor: 'pointer', transition: 'all 0.2s ease',
                      border: categoryFilter === cat ? '1px solid var(--accent)' : '1px solid var(--border)',
                      color: categoryFilter === cat ? 'var(--accent)' : 'var(--textMuted)', background: 'transparent',
                    }}>{cat === 'all' ? 'Svi' : cat}</button>
                  ))}
                </div>
              </div>

              <div style={{ maxHeight: 600, overflowY: 'auto' }}>
                {loadingTasks ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--textMuted)', fontFamily: 'DM Sans', fontSize: 14 }}>Učitavam taskove...</div>
                ) : taskError ? (
                  <div style={{ padding: 24, margin: 16, borderRadius: 8, background: 'var(--redTint)', border: '1px solid var(--red)', color: 'var(--red)', fontFamily: 'DM Sans', fontSize: 13 }}>
                    <strong>Greška:</strong> {taskError}
                  </div>
                ) : !selectedProject ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--textMuted)', fontFamily: 'DM Sans', fontSize: 14 }}>Izaberi projekat za prikaz taskova</div>
                ) : filteredTasks.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--textMuted)', fontFamily: 'DM Sans', fontSize: 14 }}>Nema taskova koji odgovaraju filteru</div>
                ) : filteredTasks.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={() => toggleTask(task.id)}
                    onExpand={() => { toggleExpand(task); if (expandedTaskId !== task.id) loadTaskDetail(task) }}
                    isExpanded={expandedTaskId === task.id}
                    detail={taskDetail[task.id]}
                    aiAvailable={aiAvailable}
                    onGenerate={() => generateDescription(task)}
                    onClearDesc={() => clearDescription(task.id)}
                    onEdit={() => openEditModal(task)}
                    getCategoryBadgeStyle={getCategoryBadgeStyle}
                  />
                ))}
              </div>

              {tasks.length > 0 && (
                <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 12, fontFamily: 'DM Mono', color: 'var(--textMuted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Izabrano: {tasks.filter(t => t.included).length} / {tasks.length}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setTasks(prev => prev.map(t => ({ ...t, included: true })))}
                      style={{ background: 'transparent', border: 'none', color: 'var(--accent)', fontSize: 11, fontFamily: 'DM Mono', cursor: 'pointer', padding: 0 }}>
                      Izaberi sve
                    </button>
                    <span style={{ color: 'var(--border)' }}>·</span>
                    <button onClick={() => setTasks(prev => prev.map(t => ({ ...t, included: false })))}
                      style={{ background: 'transparent', border: 'none', color: 'var(--textMuted)', fontSize: 11, fontFamily: 'DM Mono', cursor: 'pointer', padding: 0 }}>
                      Poništi
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT — preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Toolbar */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {aiAvailable && (
                  <>
                    <button onClick={generateAllDescriptions} disabled={generatingAll || !tasks.filter(t => t.included).length}
                      style={{
                        padding: '8px 14px', borderRadius: 8, fontSize: 13, fontFamily: 'DM Sans',
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        color: generatingAll ? 'var(--textMuted)' : 'var(--text)',
                        cursor: generatingAll ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease',
                        opacity: !tasks.filter(t => t.included).length ? 0.4 : 1,
                      }}>
                      {generatingAll ? '⏳ Generišem opise...' : '✨ Generiši opise'}
                    </button>
                    <button onClick={handleTranslate} disabled={aiLoading || !markdown}
                      style={{
                        padding: '8px 14px', borderRadius: 8, fontSize: 13, fontFamily: 'DM Sans',
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        color: !markdown || aiLoading ? 'var(--textMuted)' : 'var(--text)',
                        cursor: !markdown || aiLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease',
                        opacity: !markdown || aiLoading ? 0.4 : 1,
                      }}>
                      {aiLoading ? '⏳ Prevodim...' : '🌐 Prevedi na engleski'}
                    </button>
                  </>
                )}
                <button
                  onClick={async () => {
                    if (!html) {
                      setPublishState({ error: 'Nema sadržaja za objavljivanje. Izaberi projekat i uključi taskove.' })
                      return
                    }
                    try {
                      const usersData = await api.getUsers().catch(() => [])
                      const clientUsers = (Array.isArray(usersData) ? usersData : []).filter(u => u.role === 'client')
                      setPublishModal({ clientUsers })
                    } catch (err) {
                      setPublishState({ error: err.message })
                    }
                  }}
                  disabled={!html || publishState?.loading}
                  style={{
                    padding: '8px 20px', borderRadius: 8, fontSize: 13, fontFamily: 'DM Sans', fontWeight: 600,
                    background: !html ? 'var(--surfaceAlt)' : 'var(--accent)',
                    color: !html ? 'var(--textMuted)' : '#fff',
                    border: 'none', cursor: !html ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease',
                    marginLeft: 'auto',
                  }}>
                  {publishState?.loading ? '⏳ Objavljujem...' : '📤 Publish'}
                </button>
              </div>

              {publishState?.error && (
                <div style={{ padding: '12px 16px', background: 'var(--redTint)', border: '1px solid var(--red)', borderRadius: 8, fontSize: 13, color: 'var(--red)', fontFamily: 'DM Sans', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>⚠️ {publishState.error}</span>
                  <button onClick={() => setPublishState(null)} style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 16, padding: 0 }}>×</button>
                </div>
              )}
              {publishState?.url && !assignModal && (
                <div style={{ padding: '12px 16px', background: 'var(--greenTint)', border: '1px solid var(--green)', borderRadius: 8, fontSize: 13, fontFamily: 'DM Sans', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ flex: 1, color: 'var(--text)' }}>
                    {publishState.updated ? '🔄 Ažurirano:' : '✅ Objavljeno:'}{' '}
                    <a href={publishState.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontFamily: 'DM Mono', fontSize: 12 }}>{publishState.url}</a>
                  </span>
                  <button onClick={() => navigator.clipboard.writeText(publishState.url)}
                    style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontFamily: 'DM Sans', background: 'var(--green)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                    Kopiraj
                  </button>
                </div>
              )}

              {/* Preview */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Preview</span>
                  {html && (
                    <button onClick={openInNewTab} style={{
                      background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px',
                      fontSize: 12, fontFamily: 'DM Sans', color: 'var(--textMuted)', cursor: 'pointer', transition: 'all 0.2s ease',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--textMuted)' }}>
                      ↗ Otvori u novom tabu
                    </button>
                  )}
                </div>
                {html ? (
                  <iframe srcDoc={html} style={{ width: '100%', height: 540, border: 'none', display: 'block', background: '#fff' }} title="Release Notes Preview" />
                ) : (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--textMuted)', fontStyle: 'italic', fontFamily: 'DM Sans', fontSize: 14 }}>
                    Izaberi projekat i taskove za prikaz...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {publishModal && (
        <PublishModal
          clientUsers={publishModal.clientUsers}
          onClose={() => setPublishModal(null)}
          onPublish={async (selectedClientIds) => {
            setPublishModal(null)
            const data = await handlePublish()
            if (!data?.token) return
            if (data.id && selectedClientIds.length > 0) {
              await api.setReleaseNoteClients(data.id, selectedClientIds).catch(() => {})
            }
            setActiveTab('list')
            setTimeout(loadNotesList, 300)
          }}
        />
      )}
      {assignModal && (
        <AssignClientsModal
          assignModal={assignModal}
          allClientUsers={allClientUsers}
          onClose={() => setAssignModal(null)}
          onSave={async (clientIds) => {
            await api.setReleaseNoteClients(assignModal.noteId, clientIds)
            const wasAfterPublish = assignModal.afterPublish
            setAssignModal(null)
            if (wasAfterPublish) {
              setActiveTab('list')
              setTimeout(loadNotesList, 300)
            } else {
              loadNotesList()
            }
          }}
        />
      )}
      {editModal && (
        <EditModal
          editModal={editModal}
          setEditModal={setEditModal}
          onSave={saveEditModal}
          onGenerate={aiAvailable ? generateForModal : null}
        />
      )}
    </div>
  )
}

// ── NoteListItem ──────────────────────────────────────────────────────────────

function NoteListItem({ note, isClient, onRelease, onDelete, onManageClients }) {
  const [hovered, setHovered] = useState(false)
  const url = `${window.location.origin}/rn/${note.token}`
  const isReleased = note.status === 'released'
  const date = new Date(note.created_at).toLocaleDateString('sr-Latn-RS')
  const releasedDate = note.released_at ? new Date(note.released_at).toLocaleDateString('sr-Latn-RS') : null

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--surface)', border: `1px solid ${hovered ? 'var(--borderHover)' : 'var(--border)'}`,
        borderRadius: 10, padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: 14,
        transition: 'all 0.15s ease',
      }}
    >
      {/* Status */}
      <div style={{
        flexShrink: 0, padding: '4px 10px', borderRadius: 6, fontSize: 11, fontFamily: 'DM Mono', fontWeight: 600,
        background: isReleased ? 'var(--greenTint)' : 'rgba(79,142,247,0.1)',
        color: isReleased ? 'var(--green)' : 'var(--accent)',
        border: `1px solid ${isReleased ? 'var(--green)' : 'var(--accent)'}`,
        whiteSpace: 'nowrap',
      }}>
        {isReleased ? '🚀 Released' : '📤 Objavljeno'}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'DM Sans', fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {note.title || note.project_name || note.epic_key || 'Release Notes'}
        </div>
        <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--textMuted)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {note.project_name && <span>📁 {note.project_name}</span>}
          <span>📅 {date}</span>
          {isReleased && releasedDate && <span>🚀 Pušteno {releasedDate}</span>}
          {!isClient && note.client_count !== undefined && <span>👥 {note.client_count} klijenata</span>}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <a href={url} target="_blank" rel="noreferrer"
          style={{
            padding: '6px 12px', borderRadius: 7, fontSize: 12, fontFamily: 'DM Sans',
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--textMuted)', cursor: 'pointer', textDecoration: 'none', transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--textMuted)' }}>
          ↗ Otvori
        </a>
        {!isClient && (
          <>
            <button onClick={onManageClients}
              style={{ padding: '6px 12px', borderRadius: 7, fontSize: 12, fontFamily: 'DM Sans', background: 'transparent', border: '1px solid var(--border)', color: 'var(--textMuted)', cursor: 'pointer', transition: 'all 0.2s ease' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--borderHover)'; e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--textMuted)' }}>
              👥 Klijenti
            </button>
            {!isReleased && (
              <button onClick={onRelease}
                style={{ padding: '6px 12px', borderRadius: 7, fontSize: 12, fontFamily: 'DM Sans', fontWeight: 600, background: 'transparent', border: '1px solid var(--green)', color: 'var(--green)', cursor: 'pointer', transition: 'all 0.2s ease' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--green)'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--green)' }}>
                🚀 Mark Released
              </button>
            )}
            <button onClick={onDelete}
              style={{ padding: '6px 10px', borderRadius: 7, fontSize: 12, background: 'transparent', border: '1px solid var(--border)', color: 'var(--textMuted)', cursor: 'pointer', transition: 'all 0.2s ease' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--textMuted)' }}>
              ✕
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── PublishModal ──────────────────────────────────────────────────────────────

function PublishModal({ clientUsers, onClose, onPublish }) {
  const [selected, setSelected] = useState(new Set())
  const [publishing, setPublishing] = useState(false)

  function toggle(id) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  async function handleConfirm() {
    setPublishing(true)
    await onPublish([...selected])
    setPublishing(false)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, width: '100%', maxWidth: 480, boxShadow: '0 24px 80px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>📤 Objavi Release Notes</span>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--textMuted)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '16px 24px' }}>
          <div style={{ fontSize: 13, color: 'var(--textMuted)', fontFamily: 'DM Sans', marginBottom: 16, lineHeight: 1.6 }}>
            Izaberi klijente koji će imati pristup ovim release notes-ima.
          </div>
          {clientUsers.length === 0 ? (
            <div style={{ color: 'var(--textMuted)', fontFamily: 'DM Sans', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
              Nema klijentskih korisnika. Možeš ih dodati u sekciji Korisnici.
            </div>
          ) : (
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {clientUsers.map(u => (
                <div key={u.id} onClick={() => toggle(u.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                    border: selected.has(u.id) ? 'none' : '2px solid var(--border)',
                    background: selected.has(u.id) ? 'var(--accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease',
                  }}>
                    {selected.has(u.id) && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{u.name}</div>
                    <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--textMuted)' }}>{u.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontFamily: 'DM Sans', background: 'transparent', border: '1px solid var(--border)', color: 'var(--textMuted)', cursor: 'pointer' }}>
            Odustani
          </button>
          <button onClick={handleConfirm} disabled={publishing} style={{ padding: '8px 24px', borderRadius: 8, fontSize: 13, fontFamily: 'DM Sans', fontWeight: 600, background: 'var(--accent)', color: '#fff', border: 'none', cursor: publishing ? 'wait' : 'pointer' }}>
            {publishing ? '⏳ Objavljivanje...' : '📤 Objavi'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── AssignClientsModal ────────────────────────────────────────────────────────

function AssignClientsModal({ assignModal, allClientUsers, onClose, onSave }) {
  const [selected, setSelected] = useState(new Set(assignModal.currentClients.map(c => c.id)))

  function toggle(id) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  return (
    <div onClick={assignModal.afterPublish ? undefined : onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, width: '100%', maxWidth: 480, boxShadow: '0 24px 80px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: assignModal.afterPublish ? 6 : 0 }}>
            <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
              {assignModal.afterPublish ? '✅ Release Notes objavljen!' : '👥 Dodeli klijentima'}
            </span>
            {!assignModal.afterPublish && (
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--textMuted)', fontSize: 22, cursor: 'pointer' }}>×</button>
            )}
          </div>
          {assignModal.afterPublish && (
            <div style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--textMuted)' }}>
              Izaberi klijente koji će imati pristup ovom release notes dokumentu.
            </div>
          )}
        </div>
        <div style={{ padding: '12px 24px', maxHeight: 360, overflowY: 'auto' }}>
          {allClientUsers.length === 0 ? (
            <div style={{ color: 'var(--textMuted)', fontFamily: 'DM Sans', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
              Nema klijentskih korisnika. Dodaj ih u sekciji Korisnici.
            </div>
          ) : allClientUsers.map(u => (
            <div key={u.id} onClick={() => toggle(u.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
              <div style={{
                width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                border: selected.has(u.id) ? 'none' : '2px solid var(--border)',
                background: selected.has(u.id) ? 'var(--accent)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease',
              }}>
                {selected.has(u.id) && <span style={{ color: '#fff', fontSize: 12 }}>✓</span>}
              </div>
              <div>
                <div style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{u.name}</div>
                <div style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--textMuted)' }}>{u.email}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          {!assignModal.afterPublish && (
            <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontFamily: 'DM Sans', background: 'transparent', border: '1px solid var(--border)', color: 'var(--textMuted)', cursor: 'pointer' }}>Odustani</button>
          )}
          <button onClick={() => onSave([...selected])} style={{ padding: '8px 24px', borderRadius: 8, fontSize: 13, fontFamily: 'DM Sans', fontWeight: 600, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}>
            {assignModal.afterPublish ? 'Sačuvaj i otvori listu' : 'Sačuvaj'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── TaskRow ───────────────────────────────────────────────────────────────────

function TaskRow({ task, onToggle, onExpand, isExpanded, detail, aiAvailable, onGenerate, onClearDesc, onEdit, getCategoryBadgeStyle }) {
  const [hovered, setHovered] = useState(false)
  const summary = task.fields?.summary || task.summary || ''
  const generating = detail?.generating

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
          background: isExpanded ? 'var(--surfaceAlt)' : task.included && hovered ? 'var(--surfaceAlt)' : task.included ? 'rgba(79,142,247,0.04)' : hovered ? 'var(--surfaceAlt)' : 'transparent',
          transition: 'background 0.15s',
        }}
      >
        <div onClick={onToggle} style={{
          width: 18, height: 18, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
          border: task.included ? 'none' : '2px solid var(--border)',
          background: task.included ? 'var(--accent)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease',
        }}>
          {task.included && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>✓</span>}
        </div>

        <span style={{ fontFamily: 'DM Mono', fontSize: 11, color: 'var(--accent)', flexShrink: 0 }}>{task.key}</span>
        <span style={{ ...getCategoryBadgeStyle(task.category), fontSize: 10, fontFamily: 'DM Mono', padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>
          {task.category}
        </span>

        <div onClick={onToggle} style={{ flex: 1, minWidth: 0, cursor: 'pointer', fontFamily: 'DM Sans', fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {summary}
        </div>

        {task.description && <span style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'DM Mono', flexShrink: 0 }}>● opis</span>}

        {aiAvailable && (
          <button onClick={e => { e.stopPropagation(); onGenerate() }} disabled={generating} title={task.description ? 'Regeneriši AI opis' : 'Generiši AI opis'}
            style={{
              flexShrink: 0, padding: '3px 8px', borderRadius: 6,
              border: task.description ? '1px solid var(--green)' : '1px solid var(--border)',
              background: 'transparent',
              color: generating ? 'var(--textMuted)' : task.description ? 'var(--green)' : 'var(--textMuted)',
              cursor: generating ? 'not-allowed' : 'pointer', fontSize: 12, fontFamily: 'DM Mono', transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { if (!generating) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = task.description ? 'var(--green)' : 'var(--border)'; e.currentTarget.style.color = generating ? 'var(--textMuted)' : task.description ? 'var(--green)' : 'var(--textMuted)' }}>
            {generating ? '⏳' : '✨'}
          </button>
        )}

        <button onClick={e => { e.stopPropagation(); onEdit() }} title="Uredi naziv i opis"
          style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--textMuted)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--borderHover)'; e.currentTarget.style.color = 'var(--text)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--textMuted)' }}>
          ✏️
        </button>

        <button onClick={onExpand} title={isExpanded ? 'Zatvori' : 'Otvori detalje'}
          style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)', background: isExpanded ? 'var(--accent)' : 'transparent', color: isExpanded ? '#fff' : 'var(--textMuted)', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}>
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>

      {isExpanded && (
        <div style={{ padding: '12px 16px 16px 44px', background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
          {detail?.loading ? (
            <div style={{ color: 'var(--textMuted)', fontFamily: 'DM Sans', fontSize: 13 }}>Učitavam detalje...</div>
          ) : detail?.error ? (
            <div style={{ color: 'var(--red)', fontFamily: 'DM Sans', fontSize: 13 }}>Greška: {detail.error}</div>
          ) : detail ? (
            <>
              {detail.description && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--textMuted)', textTransform: 'uppercase', marginBottom: 4 }}>Jira opis</div>
                  <div style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{detail.description}</div>
                </div>
              )}
              {detail.comments?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--textMuted)', textTransform: 'uppercase', marginBottom: 6 }}>Komentari ({detail.comments.length})</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {detail.comments.map((c, i) => (
                      <div key={i} style={{ padding: '8px 10px', background: 'var(--surface)', borderRadius: 6, border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--accent)', marginBottom: 3 }}>{c.author}</div>
                        <div style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>{c.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!detail.description && !detail.comments?.length && (
                <div style={{ color: 'var(--textMuted)', fontFamily: 'DM Sans', fontSize: 13, marginBottom: 12 }}>Nema opisa ni komentara.</div>
              )}
              {task.description && (
                <div style={{ padding: '10px 12px', background: 'var(--greenTint)', border: '1px solid var(--green)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--green)', marginBottom: 4 }}>GENERISANI OPIS</div>
                  <div style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{task.description}</div>
                  <button onClick={onClearDesc} style={{ marginTop: 8, fontSize: 11, fontFamily: 'DM Mono', color: 'var(--red)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>✕ Ukloni opis</button>
                </div>
              )}
            </>
          ) : (
            <div style={{ color: 'var(--textMuted)', fontFamily: 'DM Sans', fontSize: 13 }}>Klikni ▼ da učitaš detalje.</div>
          )}
        </div>
      )}
    </div>
  )
}

// ── EditModal ─────────────────────────────────────────────────────────────────

function EditModal({ editModal, setEditModal, onSave, onGenerate }) {
  const [name, setName] = useState(editModal.name)
  const [description, setDescription] = useState(editModal.description)
  const [aiResult, setAiResult] = useState('')
  const [generating, setGenerating] = useState(false)

  return (
    <div onClick={() => setEditModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 860, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.4)' }}>

        <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: 'var(--text)', flex: 1 }}>✏️ Uredi task</span>
          <span style={{ fontFamily: 'DM Mono', fontSize: 12, color: 'var(--accent)' }}>{editModal.taskKey}</span>
          <button onClick={() => setEditModal(null)} style={{ background: 'transparent', border: 'none', color: 'var(--textMuted)', fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {/* Left — editable */}
          <div style={{ padding: 24, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
            <div style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--textMuted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Podaci za Release Notes</div>
            <div>
              <label style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--textMuted)', display: 'block', marginBottom: 5 }}>NAZIV TASKA</label>
              <input value={name} onChange={e => setName(e.target.value)}
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', color: 'var(--text)', fontFamily: 'DM Sans', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <label style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--textMuted)', display: 'block', marginBottom: 5 }}>OPIS</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Opis koji će se prikazati u release notes dokumentu..."
                style={{ flex: 1, minHeight: 200, width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontFamily: 'DM Sans', fontSize: 13, lineHeight: 1.65, boxSizing: 'border-box', resize: 'none', outline: 'none' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }} />
              {description && (
                <button onClick={() => setDescription('')} style={{ alignSelf: 'flex-start', marginTop: 6, fontSize: 11, fontFamily: 'DM Mono', color: 'var(--textMuted)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>✕ Obriši opis</button>
              )}
            </div>
          </div>

          {/* Right — AI */}
          <div style={{ padding: 24, background: 'var(--bg)', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontFamily: 'DM Mono', color: 'var(--textMuted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI generisanje</span>
              {onGenerate && (
                <button onClick={() => onGenerate(setAiResult, setGenerating)} disabled={generating}
                  style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontFamily: 'DM Sans', fontWeight: 600, background: generating ? 'var(--surfaceAlt)' : 'var(--accent)', color: generating ? 'var(--textMuted)' : '#fff', border: 'none', cursor: generating ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease' }}>
                  {generating ? '⏳ Generišem...' : aiResult ? '🔄 Regeneriši' : '✨ Generiši'}
                </button>
              )}
            </div>
            <div style={{ flex: 1, minHeight: 200, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', fontFamily: 'DM Sans', fontSize: 13, lineHeight: 1.65, whiteSpace: 'pre-wrap', color: generating ? 'var(--textMuted)' : aiResult ? 'var(--text)' : 'var(--textSubtle)', fontStyle: aiResult ? 'normal' : 'italic' }}>
              {generating ? 'Generišem opis...' : aiResult || (onGenerate ? 'Klikni "✨ Generiši" da AI kreira opis na osnovu Jira detalja i komentara.' : 'AI nije dostupno — podesi Anthropic API ključ u podešavanjima.')}
            </div>
            {aiResult && !generating && (
              <button onClick={() => setDescription(aiResult)}
                style={{ padding: '9px 16px', borderRadius: 8, fontSize: 13, fontFamily: 'DM Sans', fontWeight: 600, background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', cursor: 'pointer', transition: 'all 0.2s ease' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--accent)' }}>
                ← Preuzmi u opis
              </button>
            )}
          </div>
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10, background: 'var(--surface)' }}>
          <button onClick={() => setEditModal(null)}
            style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontFamily: 'DM Sans', background: 'transparent', border: '1px solid var(--border)', color: 'var(--textMuted)', cursor: 'pointer', transition: 'all 0.2s ease' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--borderHover)'; e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--textMuted)' }}>
            Odustani
          </button>
          <button onClick={() => onSave(name, description)}
            style={{ padding: '8px 28px', borderRadius: 8, fontSize: 13, fontFamily: 'DM Sans', fontWeight: 600, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Sačuvaj
          </button>
        </div>
      </div>
    </div>
  )
}
