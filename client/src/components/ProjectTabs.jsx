import { useState } from 'react'
import { useWindowSize } from '../hooks/useWindowSize.js'

function statusDot(data) {
  if (!data) return 'var(--textMuted)'
  const pct = data.total > 0 ? data.done / data.total : 0
  if (pct >= 0.8) return 'var(--green)'
  if (pct >= 0.4) return 'var(--amber)'
  return 'var(--red)'
}

export default function ProjectTabs({ projects, activeId, onSelect, onAdd, onOpenSettings, projectData }) {
  const { isMobile } = useWindowSize()
  const [showAddModal, setShowAddModal] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [epicKey, setEpicKey] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [addHover, setAddHover] = useState(false)

  async function handleAdd(e) {
    e.preventDefault()
    if (!epicKey.trim()) return
    setLoading(true)
    setError('')
    try {
      await onAdd({ epicKey: epicKey.trim(), displayName: displayName.trim() || undefined })
      setShowAddModal(false)
      setEpicKey('')
      setDisplayName('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const activeProject = projects.find(p => p.id === activeId)

  return (
    <>
      <div style={{
        position: 'sticky',
        top: 56,
        zIndex: 90,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: isMobile ? '8px 12px' : '0 28px',
        gap: 8,
      }}>

        {isMobile ? (
          /* ── Mobile: dropdown selector ── */
          <>
            <div style={{ flex: 1, position: 'relative' }}>
              {/* Trigger — styled like an active pill */}
              <button
                onClick={() => setDropdownOpen(o => !o)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 20,
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#fff',
                  fontFamily: "'TW Cen MT', 'Century Gothic'",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  minHeight: 44,
                  boxShadow: '0 2px 12px rgba(79,142,247,0.35)',
                  maxWidth: '100%',
                }}
              >
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.85)',
                  flexShrink: 0,
                }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {activeProject ? (activeProject.displayName || activeProject.epicKey) : 'Odaberi projekat...'}
                </span>
                {activeProject && (
                  <span style={{
                    fontFamily: "'DM Mono'",
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.7)',
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 4,
                    padding: '1px 5px',
                    flexShrink: 0,
                  }}>
                    {activeProject.epicKey}
                  </span>
                )}
                <span style={{ fontSize: 10, opacity: 0.8, flexShrink: 0, transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
              </button>

              {dropdownOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={() => setDropdownOpen(false)} />
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    minWidth: '100%',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                    zIndex: 101,
                    overflow: 'hidden',
                    padding: 6,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}>
                    {projects.map(p => {
                      const active = p.id === activeId
                      const dot = statusDot(projectData[p.id])
                      return (
                        <button
                          key={p.id}
                          onClick={() => { onSelect(p.id); setDropdownOpen(false) }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '9px 12px',
                            borderRadius: 10,
                            border: active ? 'none' : '1px solid var(--border)',
                            background: active ? 'var(--accent)' : 'transparent',
                            color: active ? '#fff' : 'var(--text)',
                            fontFamily: "'TW Cen MT', 'Century Gothic'",
                            fontWeight: active ? 600 : 400,
                            fontSize: 14,
                            cursor: 'pointer',
                            minHeight: 44,
                            textAlign: 'left',
                            boxShadow: active ? '0 2px 8px rgba(79,142,247,0.25)' : 'none',
                          }}
                        >
                          <span style={{
                            width: 7, height: 7, borderRadius: '50%',
                            background: active ? 'rgba(255,255,255,0.85)' : dot,
                            flexShrink: 0,
                          }} />
                          <span style={{ flex: 1 }}>{p.displayName || p.epicKey}</span>
                          <span style={{
                            fontFamily: "'DM Mono'",
                            fontSize: 11,
                            color: active ? 'rgba(255,255,255,0.7)' : 'var(--textSubtle)',
                            background: active ? 'rgba(255,255,255,0.15)' : 'var(--surfaceAlt)',
                            border: `1px solid ${active ? 'rgba(255,255,255,0.2)' : 'var(--border)'}`,
                            borderRadius: 4,
                            padding: '1px 5px',
                          }}>
                            {p.epicKey}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Add button — matches desktop circle style */}
            <button
              onClick={() => onAdd ? setShowAddModal(true) : onOpenSettings?.()}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: '2px dashed var(--borderHover)',
                background: 'transparent',
                color: 'var(--accent)',
                fontSize: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.2s ease',
              }}
              onTouchStart={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderStyle = 'solid' }}
              onTouchEnd={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderStyle = 'dashed' }}
            >
              +
            </button>
          </>
        ) : (
          /* ── Desktop: pill tabs ── */
          <>
            <div style={{
              flex: 1,
              overflowX: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 0',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}>
              {projects.map(p => {
                const active = p.id === activeId
                const dot = statusDot(projectData[p.id])
                return (
                  <ProjectPill
                    key={p.id}
                    project={p}
                    active={active}
                    dot={dot}
                    onSelect={onSelect}
                  />
                )
              })}
            </div>

            {/* Add button — desktop */}
            <div style={{ flexShrink: 0, paddingLeft: 16, borderLeft: projects.length > 0 ? '1px solid var(--border)' : 'none', marginLeft: 8, position: 'relative' }}>
              <button
                onClick={() => onAdd ? setShowAddModal(true) : onOpenSettings?.()}
                onMouseEnter={() => setAddHover(true)}
                onMouseLeave={() => setAddHover(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: addHover ? '2px solid var(--accent)' : '2px dashed var(--borderHover)',
                  background: addHover ? 'var(--accent)' : 'transparent',
                  color: addHover ? '#fff' : 'var(--accent)',
                  fontSize: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                +
              </button>
              {addHover && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--text)',
                  color: 'var(--bg)',
                  fontSize: 12,
                  fontFamily: "'TW Cen MT', 'Century Gothic'",
                  padding: '5px 10px',
                  borderRadius: 6,
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  zIndex: 10,
                }}>
                  Dodaj projekat
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add project modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: isMobile ? 'flex-end' : 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowAddModal(false)}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: isMobile ? '16px 16px 0 0' : 14,
            padding: 28,
            width: isMobile ? '100%' : 400,
            boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 18, color: 'var(--text)', marginBottom: 20 }}>
              Dodaj projekat
            </h3>
            <form onSubmit={handleAdd}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontFamily: "'DM Mono'", color: 'var(--textMuted)', marginBottom: 6 }}>
                  EPIC KEY *
                </label>
                <input
                  value={epicKey}
                  onChange={e => setEpicKey(e.target.value)}
                  placeholder="npr. PROJECT-184"
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontFamily: "'DM Mono'", color: 'var(--textMuted)', marginBottom: 6 }}>
                  NAZIV (opciono)
                </label>
                <input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="npr. Knjaz Miloš B2B Portal"
                  style={inputStyle}
                />
              </div>
              {error && (
                <div style={{ marginBottom: 12, padding: '8px 12px', background: 'var(--redTint)', border: '1px solid var(--red)', borderRadius: 6, color: 'var(--red)', fontSize: 13 }}>
                  {error}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ ...btnSecondary, flex: 1 }}>Otkaži</button>
                <button type="submit" disabled={loading} style={{ ...btnPrimary, flex: 1, opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Dodajem...' : 'Dodaj'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function ProjectPill({ project, active, dot, onSelect }) {
  const [hover, setHover] = useState(false)

  return (
    <button
      onClick={() => onSelect(project.id)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        borderRadius: 20,
        border: active ? 'none' : `1px solid ${hover ? 'var(--borderHover)' : 'var(--border)'}`,
        background: active ? 'var(--accent)' : hover ? 'var(--surfaceAlt)' : 'transparent',
        color: active ? '#fff' : 'var(--text)',
        fontFamily: "'TW Cen MT', 'Century Gothic'",
        fontWeight: active ? 600 : 500,
        fontSize: 14,
        whiteSpace: 'nowrap',
        transition: 'all 0.2s ease',
        flexShrink: 0,
        boxShadow: active ? '0 2px 12px rgba(79,142,247,0.35)' : 'none',
        cursor: 'pointer',
      }}
    >
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: active ? 'rgba(255,255,255,0.85)' : dot,
        flexShrink: 0,
      }} />
      <span>{project.displayName || project.epicKey}</span>
      <span style={{
        fontFamily: "'DM Mono'",
        fontSize: 11,
        color: active ? 'rgba(255,255,255,0.7)' : 'var(--textSubtle)',
        background: active ? 'rgba(255,255,255,0.15)' : 'var(--surfaceAlt)',
        border: `1px solid ${active ? 'rgba(255,255,255,0.2)' : 'var(--border)'}`,
        borderRadius: 4,
        padding: '1px 5px',
      }}>
        {project.epicKey}
      </span>
    </button>
  )
}

const inputStyle = {
  width: '100%',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '10px 12px',
  color: 'var(--text)',
  fontSize: 14,
  fontFamily: "'TW Cen MT', 'Century Gothic'",
}

const btnPrimary = {
  background: 'var(--accent)',
  color: '#fff',
  borderRadius: 8,
  padding: '10px',
  fontFamily: "'TW Cen MT', 'Century Gothic'",
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  border: 'none',
  transition: 'all 0.2s ease',
  minHeight: 44,
}

const btnSecondary = {
  background: 'transparent',
  color: 'var(--text)',
  borderRadius: 8,
  padding: '10px',
  fontFamily: "'TW Cen MT', 'Century Gothic'",
  fontSize: 14,
  cursor: 'pointer',
  border: '1px solid var(--border)',
  transition: 'all 0.2s ease',
  minHeight: 44,
}
