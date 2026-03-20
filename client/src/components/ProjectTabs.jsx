import { useState } from 'react'
import { useWindowSize } from '../hooks/useWindowSize.js'

function statusDot(data) {
  if (!data) return 'var(--textMuted)'
  const pct = data.total > 0 ? data.done / data.total : 0
  if (pct >= 0.8) return 'var(--green)'
  if (pct >= 0.4) return 'var(--amber)'
  return 'var(--red)'
}

export default function ProjectTabs({ projects, activeId, onSelect, onAdd, onArchive, onOpenArchive, onOpenSettings, projectData }) {
  const { isMobile } = useWindowSize()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [addHover, setAddHover] = useState(false)
  const [confirmId, setConfirmId] = useState(null)

  function handleArchiveConfirm(id) {
    setConfirmId(null)
    setDropdownOpen(false)
    onArchive?.(id)
  }

  const activeProject = projects.find(p => p.id === activeId)

  return (
    <>
      <div style={{
        position: 'sticky',
        top: 56,
        zIndex: 90,
        background: 'var(--surface)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: isMobile ? '8px 12px' : '0 28px',
        gap: 8,
      }}>

        {isMobile ? (
          <>
            <div style={{ flex: 1, position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px', borderRadius: 20, border: 'none',
                  background: 'var(--accent)', color: '#fff',
                  fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: 14,
                  cursor: 'pointer', minHeight: 44,
                  boxShadow: '0 2px 12px rgba(79,142,247,0.35)', maxWidth: '100%',
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.85)', flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {activeProject ? (activeProject.displayName || activeProject.epicKey) : 'Odaberi projekat...'}
                </span>
                {activeProject && (
                  <span style={{
                    fontFamily: "'DM Mono'", fontSize: 11, color: 'rgba(255,255,255,0.7)',
                    background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 4, padding: '1px 5px', flexShrink: 0,
                  }}>
                    {activeProject.epicKey}
                  </span>
                )}
                <span style={{ fontSize: 10, opacity: 0.8, flexShrink: 0, transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
              </button>

              {dropdownOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={() => { setDropdownOpen(false); setConfirmId(null) }} />
                  <div className="glass-card" style={{
                    position: 'absolute', top: 'calc(100% + 8px)', left: 0, minWidth: '100%',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                    zIndex: 101, overflow: 'hidden', padding: 6,
                    display: 'flex', flexDirection: 'column', gap: 4,
                  }}>
                    {projects.map(p => {
                      const active = p.id === activeId
                      const dot = statusDot(projectData[p.id])
                      const confirming = confirmId === p.id
                      return (
                        <div key={p.id}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <button
                              onClick={() => { onSelect(p.id); setDropdownOpen(false); setConfirmId(null) }}
                              style={{
                                flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                                padding: '9px 12px', borderRadius: 10,
                                border: active ? 'none' : '1px solid var(--border)',
                                background: active ? 'var(--accent)' : 'transparent',
                                color: active ? '#fff' : 'var(--text)',
                                fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                                fontWeight: active ? 600 : 400, fontSize: 14,
                                cursor: 'pointer', minHeight: 44, textAlign: 'left',
                                boxShadow: active ? '0 2px 8px rgba(79,142,247,0.25)' : 'none',
                              }}
                            >
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: active ? 'rgba(255,255,255,0.85)' : dot, flexShrink: 0 }} />
                              <span style={{ flex: 1 }}>{p.displayName || p.epicKey}</span>
                              <span style={{
                                fontFamily: "'DM Mono'", fontSize: 11,
                                color: active ? 'rgba(255,255,255,0.7)' : 'var(--textSubtle)',
                                background: active ? 'rgba(255,255,255,0.15)' : 'var(--surfaceAlt)',
                                border: `1px solid ${active ? 'rgba(255,255,255,0.2)' : 'var(--border)'}`,
                                borderRadius: 4, padding: '1px 5px',
                              }}>
                                {p.epicKey}
                              </span>
                            </button>
                            {onArchive && (
                              <button
                                onClick={e => { e.stopPropagation(); setConfirmId(confirming ? null : p.id) }}
                                title="Arhiviraj projekat"
                                style={{
                                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                  border: '1px solid var(--border)', background: confirming ? 'var(--redTint)' : 'transparent',
                                  color: confirming ? 'var(--red)' : 'var(--textMuted)',
                                  fontSize: 14, cursor: 'pointer', transition: 'all 0.15s ease',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                              >
                                ×
                              </button>
                            )}
                          </div>
                          {confirming && (
                            <div style={{
                              margin: '4px 0 2px 0', padding: '10px 12px',
                              background: 'var(--redTint)', border: '1px solid #EF444430',
                              borderRadius: 8,
                            }}>
                              <div style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 12, color: 'var(--text)', marginBottom: 8 }}>
                                Arhivirati projekat?
                              </div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => setConfirmId(null)} style={{ flex: 1, padding: '6px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--textMuted)', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 12, cursor: 'pointer' }}>
                                  Otkaži
                                </button>
                                <button onClick={() => handleArchiveConfirm(p.id)} style={{ flex: 1, padding: '6px', borderRadius: 6, border: 'none', background: 'var(--red)', color: '#fff', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                                  Arhiviraj
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {/* Archive link */}
                    <button
                      onClick={() => { setDropdownOpen(false); onOpenArchive?.() }}
                      style={{
                        padding: '8px 12px', borderRadius: 8, border: 'none',
                        background: 'transparent', color: 'var(--textMuted)',
                        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 12,
                        cursor: 'pointer', textAlign: 'left', marginTop: 4,
                        borderTop: '1px solid var(--border)', paddingTop: 10,
                      }}
                    >
                      📦 Arhiva projekata
                    </button>
                  </div>
                </>
              )}
            </div>

            {(onAdd || onOpenSettings) && (
              <button
                onClick={() => onAdd ? onAdd() : onOpenSettings?.()}
                title="Dodaj projekat"
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  border: '2px dashed var(--borderHover)', background: 'transparent',
                  color: 'var(--accent)', fontSize: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s ease',
                }}
                onTouchStart={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderStyle = 'solid' }}
                onTouchEnd={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderStyle = 'dashed' }}
              >
                +
              </button>
            )}
          </>
        ) : (
          /* ── Desktop: pill tabs ── */
          <>
            <div style={{
              flex: 1, overflowX: 'auto', display: 'flex', alignItems: 'center',
              gap: 8, padding: '10px 0', scrollbarWidth: 'none', msOverflowStyle: 'none',
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
                    onArchive={onArchive}
                    confirmId={confirmId}
                    setConfirmId={setConfirmId}
                    onArchiveConfirm={handleArchiveConfirm}
                  />
                )
              })}
            </div>

            {(onOpenArchive || onAdd || onOpenSettings) && (
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 16, borderLeft: projects.length > 0 ? '1px solid var(--border)' : 'none', marginLeft: 8 }}>
              {/* Archive button */}
              {onOpenArchive && (
                <button
                  onClick={onOpenArchive}
                  title="Arhiva projekata"
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    border: '1px solid var(--border)', background: 'transparent',
                    color: 'var(--textMuted)', fontSize: 15,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--borderHover)'; e.currentTarget.style.color = 'var(--text)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--textMuted)' }}
                >
                  📦
                </button>
              )}

              {/* Add button */}
              {(onAdd || onOpenSettings) && (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => onAdd ? onAdd() : onOpenSettings?.()}
                    onMouseEnter={() => setAddHover(true)}
                    onMouseLeave={() => setAddHover(false)}
                    style={{
                      width: 32, height: 32, borderRadius: '50%',
                      border: addHover ? '2px solid var(--accent)' : '2px dashed var(--borderHover)',
                      background: addHover ? 'var(--accent)' : 'transparent',
                      color: addHover ? '#fff' : 'var(--accent)',
                      fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.2s ease',
                    }}
                  >
                    +
                  </button>
                  {addHover && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 8px)', left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'var(--text)', color: 'var(--bg)',
                      fontSize: 12, fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                      padding: '5px 10px', borderRadius: 6,
                      whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 10,
                    }}>
                      Dodaj projekat
                    </div>
                  )}
                </div>
              )}
            </div>
            )}
          </>
        )}
      </div>

      {/* Inline confirm overlay for desktop (outside sticky bar to avoid clipping) */}
      {confirmId && !isMobile && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 200 }} onClick={() => setConfirmId(null)} />
          <div className="glass-card" style={{
            position: 'fixed', top: 110, left: '50%', transform: 'translateX(-50%)',
            zIndex: 201, background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '20px 24px', minWidth: 300,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 6 }}>
              Arhivirati projekat?
            </div>
            <div style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 13, color: 'var(--textMuted)', marginBottom: 20 }}>
              Projekat će biti premešten u arhivu. Sve metrike i istorija ostaju sačuvani. Možete ga vratiti u bilo kom trenutku.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmId(null)} style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 14, cursor: 'pointer' }}>
                Otkaži
              </button>
              <button onClick={() => handleArchiveConfirm(confirmId)} style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: 'var(--red)', color: '#fff', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Arhiviraj
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

function ProjectPill({ project, active, dot, onSelect, onArchive, confirmId, setConfirmId, onArchiveConfirm }) {
  const [hover, setHover] = useState(false)

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => onSelect(project.id)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: active ? '8px 12px 8px 16px' : '8px 16px',
          borderRadius: 20,
          border: active ? 'none' : `1px solid ${hover ? 'var(--borderHover)' : 'var(--border)'}`,
          background: active ? 'var(--accent)' : hover ? 'var(--surfaceAlt)' : 'transparent',
          color: active ? '#fff' : 'var(--text)',
          fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
          fontWeight: active ? 600 : 500, fontSize: 14,
          whiteSpace: 'nowrap', transition: 'all 0.2s ease',
          boxShadow: active ? '0 2px 12px rgba(79,142,247,0.35)' : 'none',
          cursor: 'pointer',
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: active ? 'rgba(255,255,255,0.85)' : dot, flexShrink: 0 }} />
        <span>{project.displayName || project.epicKey}</span>
        <span style={{
          fontFamily: "'DM Mono'", fontSize: 11,
          color: active ? 'rgba(255,255,255,0.7)' : 'var(--textSubtle)',
          background: active ? 'rgba(255,255,255,0.15)' : 'var(--surfaceAlt)',
          border: `1px solid ${active ? 'rgba(255,255,255,0.2)' : 'var(--border)'}`,
          borderRadius: 4, padding: '1px 5px',
        }}>
          {project.epicKey}
        </span>
        {/* X button — visible on hover or when active */}
        {onArchive && (hover || active) && (
          <span
            onClick={e => { e.stopPropagation(); setConfirmId(confirmId === project.id ? null : project.id) }}
            title="Arhiviraj projekat"
            style={{
              width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
              background: active ? 'rgba(255,255,255,0.25)' : 'var(--border)',
              color: active ? '#fff' : 'var(--textMuted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, lineHeight: 1, cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--red)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = active ? 'rgba(255,255,255,0.25)' : 'var(--border)'; e.currentTarget.style.color = active ? '#fff' : 'var(--textMuted)' }}
          >
            ×
          </span>
        )}
      </button>
    </div>
  )
}
