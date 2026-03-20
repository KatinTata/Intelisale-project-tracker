import { useState, useEffect } from 'react'
import BrainAnimation from '../components/BrainAnimation.jsx'

// ── Config ────────────────────────────────────────────────────────────────────

const GROUP_CONFIG = {
  ECOM:   { label: 'Funkcionalnosti i UI',    icon: '🎨', color: '#4F8EF7' },
  DB:     { label: 'Backend & Baza',           icon: '🗄️', color: '#A855F7' },
  DEVOPS: { label: 'DevOps & Infrastruktura',  icon: '⚙️', color: '#F59E0B' },
  SRC:    { label: 'Support & Ostalo',         icon: '🛠️', color: '#22C55E' },
}

const PREFIX_ORDER = ['ECOM', 'DB', 'DEVOPS', 'SRC']

const KEY_COLORS = {
  ECOM:   { bg: 'rgba(79,142,247,0.12)',  color: '#4F8EF7', border: 'rgba(79,142,247,0.3)'  },
  DB:     { bg: 'rgba(168,85,247,0.12)', color: '#A855F7',  border: 'rgba(168,85,247,0.3)' },
  DEVOPS: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B',  border: 'rgba(245,158,11,0.3)' },
  SRC:    { bg: 'rgba(34,197,94,0.12)',  color: '#22C55E',  border: 'rgba(34,197,94,0.3)'  },
  OTHER:  { bg: 'rgba(107,122,153,0.12)',color: '#6B7A99',  border: 'rgba(107,122,153,0.3)'},
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPrefix(key) {
  return (key || '').split('-')[0].toUpperCase()
}

function extractText(doc) {
  if (!doc) return ''
  if (typeof doc === 'string') return doc
  const parts = []
  function walk(node) {
    if (!node) return
    if (node.type === 'text') { parts.push(node.text || ''); return }
    if (node.type === 'hardBreak') { parts.push('\n'); return }
    if (node.content) node.content.forEach(walk)
    if (['paragraph', 'bulletList', 'listItem', 'heading'].includes(node.type)) parts.push('\n')
  }
  if (doc.content) doc.content.forEach(walk)
  return parts.join('').replace(/\n{3,}/g, '\n\n').trim()
}

function groupTasks(tasks) {
  const groups = {}
  for (const task of tasks) {
    const prefix = getPrefix(task.key)
    if (!groups[prefix]) groups[prefix] = []
    groups[prefix].push(task)
  }
  const result = []
  for (const prefix of PREFIX_ORDER) {
    if (groups[prefix]?.length) result.push({ prefix, tasks: groups[prefix] })
  }
  for (const [prefix, grpTasks] of Object.entries(groups)) {
    if (!PREFIX_ORDER.includes(prefix)) result.push({ prefix, tasks: grpTasks })
  }
  return result
}

function formatDate(date) {
  return date.toLocaleDateString('sr-Latn-RS', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EpicViewerPage({ initialEpicKey, onBack }) {
  const [epicKey, setEpicKey]       = useState(initialEpicKey || '')
  const [inputKey, setInputKey]     = useState(initialEpicKey || '')
  const [tasks, setTasks]           = useState([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [expanded, setExpanded]     = useState(new Set())
  const [projects, setProjects]     = useState([])
  const today = formatDate(new Date())

  // Load user projects for the picker
  useEffect(() => {
    const token = localStorage.getItem('jt_token')
    fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setProjects(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  // Fetch tasks when epicKey changes
  useEffect(() => {
    if (!epicKey) return
    window.history.replaceState({}, '', `/release-notes/${epicKey}`)
    const token = localStorage.getItem('jt_token')
    setLoading(true)
    setError(null)
    setTasks([])
    setExpanded(new Set())
    fetch('/api/jira/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ filterType: 'epic', epicKey }),
    })
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`); return d })
      .then(data => setTasks(data.parents || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [epicKey])

  function handleSubmit(e) {
    e.preventDefault()
    const key = inputKey.trim().toUpperCase()
    if (key) setEpicKey(key)
  }

  function toggleExpand(key) {
    setExpanded(prev => {
      const n = new Set(prev)
      n.has(key) ? n.delete(key) : n.add(key)
      return n
    })
  }

  const groups = groupTasks(tasks)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative' }}>

      {/* Background */}
      <div className="brain-bg" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <BrainAnimation opacity={0.06} fullscreen />
      </div>

      {/* Print / PDF styles */}
      <style>{`
        @media print {
          .brain-bg { opacity: 0.03 !important; }
          .back-btn, .export-btn, .expand-btn, .picker-bar { display: none !important; }
          .task-desc { max-height: none !important; overflow: visible !important; }
          .task-card { break-inside: avoid; }
          body, .page-wrapper { background: #fff !important; color: #111 !important; }
        }
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 0.2; }
        }
      `}</style>

      <div className="page-wrapper" style={{ position: 'relative', zIndex: 1, maxWidth: 860, margin: '0 auto', padding: '32px 28px 80px' }}>

        {/* ── Top bar ── */}
        <div className="picker-bar" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, flexWrap: 'wrap' }}>
          {onBack && (
            <button
              className="back-btn"
              onClick={() => { window.history.replaceState({}, '', '/'); onBack() }}
              style={{
                background: 'transparent', border: '1px solid var(--border)', borderRadius: 8,
                padding: '7px 14px', color: 'var(--textMuted)',
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--borderHover)'; e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--textMuted)' }}
            >← Nazad</button>
          )}

          {/* Project picker */}
          {projects.length > 0 && (
            <select
              value={inputKey}
              onChange={e => { setInputKey(e.target.value); setEpicKey(e.target.value) }}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
                padding: '7px 12px', color: 'var(--text)',
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: 'pointer',
              }}
            >
              <option value="">Izaberi projekat...</option>
              {projects.map(p => (
                <option key={p.id} value={p.epicKey}>{p.displayName || p.epicKey}</option>
              ))}
            </select>
          )}

          {/* Manual key input */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
            <input
              value={inputKey}
              onChange={e => setInputKey(e.target.value)}
              placeholder="npr. PROJECT-184"
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
                padding: '7px 12px', color: 'var(--text)', width: 180,
                fontFamily: "'DM Mono', monospace", fontSize: 13, outline: 'none', transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button
              type="submit"
              style={{
                background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8,
                padding: '7px 16px', fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                fontSize: 13, cursor: 'pointer', transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--accentHover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
            >Učitaj</button>
          </form>

          {/* Export button — right-aligned */}
          <button
            className="export-btn"
            onClick={() => window.print()}
            style={{
              marginLeft: 'auto', background: 'transparent',
              border: '1px solid var(--border)', borderRadius: 8,
              padding: '7px 16px', color: 'var(--textMuted)',
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--textMuted)' }}
          >↓ Export PDF</button>
        </div>

        {/* ── Document header ── */}
        {epicKey && (
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--textMuted)',
                  textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10,
                }}>INTELISALE</div>
                <h1 style={{
                  fontFamily: 'Syne', fontWeight: 800, fontSize: 40,
                  color: 'var(--text)', margin: 0, lineHeight: 1.1, letterSpacing: '-0.02em',
                }}>Release Notes</h1>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, paddingTop: 4 }}>
                <span style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 500,
                  padding: '5px 12px', borderRadius: 6,
                  background: 'rgba(79,142,247,0.1)', color: 'var(--accent)',
                  border: '1px solid rgba(79,142,247,0.25)',
                }}>{epicKey}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--textMuted)' }}>
                  {today}
                </span>
              </div>
            </div>
            <div style={{
              height: 2, marginTop: 24,
              background: 'linear-gradient(90deg, var(--accent) 0%, transparent 70%)',
              borderRadius: 2, opacity: 0.35,
            }} />
          </div>
        )}

        {/* ── Skeleton loader ── */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[180, 120, 160, 100, 140].map((h, i) => (
              <div key={i} style={{
                height: h, borderRadius: 12,
                background: 'var(--surface)', border: '1px solid var(--border)',
                animation: `skeleton-pulse 1.6s ease-in-out ${i * 0.1}s infinite`,
              }} />
            ))}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div style={{
            padding: '18px 22px', borderRadius: 12,
            background: 'var(--redTint)', border: '1px solid var(--red)',
            fontFamily: "'DM Sans', sans-serif", color: 'var(--red)', fontSize: 14,
          }}>⚠️ {error}</div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && epicKey && tasks.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 0',
            color: 'var(--textMuted)', fontFamily: "'DM Sans', sans-serif", fontSize: 14,
          }}>Nema taskova za epic <b>{epicKey}</b>.</div>
        )}

        {/* ── No epic selected ── */}
        {!epicKey && !loading && (
          <div style={{
            textAlign: 'center', padding: '80px 0',
            color: 'var(--textMuted)', fontFamily: "'DM Sans', sans-serif", fontSize: 14,
          }}>Izaberi projekat ili upiši epic key da bi generisao Release Notes.</div>
        )}

        {/* ── Groups ── */}
        {!loading && !error && groups.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 44 }}>
            {groups.map(({ prefix, tasks: grpTasks }) => {
              const cfg  = GROUP_CONFIG[prefix] || { label: prefix, icon: '📋', color: 'var(--textMuted)' }
              const keyC = KEY_COLORS[prefix] || KEY_COLORS.OTHER
              return (
                <section key={prefix}>

                  {/* Section header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    marginBottom: 16, paddingBottom: 12,
                    borderBottom: `2px solid ${cfg.color}28`,
                  }}>
                    <span style={{ fontSize: 20, lineHeight: 1 }}>{cfg.icon}</span>
                    <span style={{
                      fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: cfg.color,
                    }}>{cfg.label}</span>
                    <span style={{
                      fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500,
                      padding: '2px 9px', borderRadius: 20, marginLeft: 2,
                      background: `${cfg.color}18`, color: cfg.color,
                      border: `1px solid ${cfg.color}33`,
                    }}>{grpTasks.length}</span>
                  </div>

                  {/* Task cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {grpTasks.map(task => {
                      const summary    = task.fields?.summary || ''
                      const desc       = extractText(task.fields?.description)
                      const hasDesc    = desc.length > 0
                      const isExpanded = expanded.has(task.key)

                      return (
                        <div
                          key={task.key}
                          className="task-card"
                          style={{
                            background: 'var(--surface)', borderRadius: 10,
                            border: `1px solid ${isExpanded ? 'var(--borderHover)' : 'var(--border)'}`,
                            padding: '13px 16px', transition: 'border-color 0.2s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

                            {/* Key badge */}
                            <span style={{
                              fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500,
                              padding: '3px 9px', borderRadius: 6, flexShrink: 0,
                              background: keyC.bg, color: keyC.color, border: `1px solid ${keyC.border}`,
                              letterSpacing: '0.04em',
                            }}>{task.key}</span>

                            {/* Summary */}
                            <span style={{
                              fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
                              color: 'var(--text)', flex: 1, lineHeight: 1.4,
                            }}>{summary}</span>

                            {/* Expand button */}
                            {hasDesc && (
                              <button
                                className="expand-btn"
                                onClick={() => toggleExpand(task.key)}
                                title={isExpanded ? 'Sakrij opis' : 'Prikaži opis'}
                                style={{
                                  background: 'transparent', border: 'none',
                                  color: isExpanded ? 'var(--accent)' : 'var(--textMuted)',
                                  cursor: 'pointer', fontSize: 17, padding: '0 2px', flexShrink: 0,
                                  transition: 'transform 0.25s ease, color 0.2s',
                                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                  display: 'flex', alignItems: 'center',
                                }}
                                onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.color = 'var(--text)' }}
                                onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.color = 'var(--textMuted)' }}
                              >▾</button>
                            )}
                          </div>

                          {/* Description — smooth expand */}
                          <div
                            className="task-desc"
                            style={{
                              maxHeight: isExpanded ? '800px' : '0px',
                              overflow: 'hidden',
                              transition: 'max-height 0.32s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                          >
                            {hasDesc && (
                              <div style={{
                                marginTop: 12, paddingTop: 12,
                                borderTop: '1px solid var(--border)',
                                fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                                color: 'var(--textMuted)', lineHeight: 1.75,
                                whiteSpace: 'pre-wrap',
                              }}>{desc}</div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{
          marginTop: 72, paddingTop: 22,
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
          fontFamily: "'DM Mono', monospace", fontSize: 10,
          color: 'var(--textSubtle)', letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          INTELISALE · Empowering Sales Excellence · www.intelisale.com
        </div>

      </div>
    </div>
  )
}
