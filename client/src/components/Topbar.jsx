import { useState, useRef, useEffect } from 'react'
import { useWindowSize } from '../hooks/useWindowSize.js'
import NotificationBell from './NotificationBell.jsx'

// ── SVG Icons (Heroicons outline) ─────────────────────────────────────────────

function IconDoc() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}

function IconClipboard() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
    </svg>
  )
}

function IconChat() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
    </svg>
  )
}

function IconCog() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

function IconGrid() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
    </svg>
  )
}

function ChevronDown({ open }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
      style={{ width: 13, height: 13, flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

// ── Icon Button ───────────────────────────────────────────────────────────────

function IconBtn({ onClick, title, children, badge }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        width: 34, height: 34, borderRadius: 8,
        background: hover ? 'var(--surfaceAlt)' : 'transparent',
        border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.15s',
        color: hover ? 'var(--text)' : 'var(--textMuted)',
        flexShrink: 0,
      }}
    >
      {children}
      {badge > 0 && (
        <span style={{
          position: 'absolute', top: 4, right: 4,
          minWidth: 15, height: 15, borderRadius: 8,
          background: 'var(--red)', color: '#fff',
          fontSize: 9, fontFamily: "'DM Mono'", fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 3px', lineHeight: 1, pointerEvents: 'none',
        }}>{badge > 99 ? '99+' : badge}</span>
      )}
    </button>
  )
}

// ── Navigation Menu ───────────────────────────────────────────────────────────

function NavMenu({ items }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const visible = items.filter(i => i.action)
  if (!visible.length) return null

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Navigacija"
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surfaceAlt)'; e.currentTarget.style.color = 'var(--text)' }}
        onMouseLeave={e => { e.currentTarget.style.background = open ? 'var(--surfaceAlt)' : 'transparent'; e.currentTarget.style.color = open ? 'var(--text)' : 'var(--textMuted)' }}
        style={{
          width: 34, height: 34, borderRadius: 8,
          background: open ? 'var(--surfaceAlt)' : 'transparent',
          border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.15s',
          color: open ? 'var(--text)' : 'var(--textMuted)',
          flexShrink: 0,
        }}
      >
        <IconGrid />
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 149 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 8px)',
            minWidth: 200,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            zIndex: 150, padding: 6, display: 'flex', flexDirection: 'column', gap: 1,
          }}>
            {visible.map(item => (
              <button
                key={item.label}
                onClick={() => { setOpen(false); item.action() }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 8,
                  background: 'transparent', border: 'none',
                  color: 'var(--text)', cursor: 'pointer', textAlign: 'left',
                  transition: 'background 0.15s', width: '100%',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surfaceAlt)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ color: 'var(--textMuted)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {item.icon}
                </span>
                <span style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 14, fontWeight: 500 }}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Status dot color ──────────────────────────────────────────────────────────

function statusDotColor(data) {
  if (!data) return 'var(--textSubtle)'
  const pct = data.total > 0 ? data.done / data.total : 0
  if (pct >= 0.8) return 'var(--green)'
  if (pct >= 0.4) return 'var(--amber)'
  return 'var(--red)'
}

// ── Project Dropdown ──────────────────────────────────────────────────────────

function ProjectDropdown({ projects, activeId, onSelect, onArchive, onOpenArchive, projectData, onAdd }) {
  const [open, setOpen] = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    function h(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        setConfirmId(null)
      }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const active = projects.find(p => p.id === activeId)
  const dot = active ? statusDotColor(projectData?.[activeId]) : 'var(--textSubtle)'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '0 10px 0 12px', height: 34, borderRadius: 8,
          border: `1px solid ${open ? 'var(--borderHover)' : 'var(--border)'}`,
          background: open ? 'var(--surfaceAlt)' : 'transparent',
          color: 'var(--text)',
          fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
          fontWeight: 500, fontSize: 14,
          cursor: 'pointer', transition: 'all 0.15s',
          maxWidth: 260, minWidth: 140,
        }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.borderColor = 'var(--borderHover)'; e.currentTarget.style.background = 'var(--surfaceAlt)' } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent' } }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>
          {active ? (active.displayName || active.epicKey) : 'Projekat...'}
        </span>
        {active && (
          <span style={{
            fontFamily: "'DM Mono'", fontSize: 10, fontWeight: 500,
            color: 'var(--textSubtle)', background: 'var(--surfaceAlt)',
            border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px', flexShrink: 0,
          }}>
            {active.epicKey}
          </span>
        )}
        <ChevronDown open={open} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 149 }}
            onClick={() => { setOpen(false); setConfirmId(null) }} />
          <div style={{
            position: 'absolute', left: 0, top: 'calc(100% + 6px)',
            minWidth: 280, maxWidth: 360,
            maxHeight: 320, overflowY: 'auto',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            zIndex: 150, padding: 6, scrollbarWidth: 'thin',
          }}>
            {projects.length === 0 && (
              <div style={{ padding: '12px 14px', color: 'var(--textMuted)', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 13 }}>
                Nema projekata
              </div>
            )}

            {projects.map(p => {
              const isActive = p.id === activeId
              const pDot = statusDotColor(projectData?.[p.id])
              const confirming = confirmId === p.id
              return (
                <div key={p.id}>
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    borderRadius: 8,
                    borderLeft: `3px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                    background: isActive ? 'rgba(79,142,247,0.06)' : 'transparent',
                    marginBottom: 2,
                  }}>
                    <button
                      onClick={() => { onSelect(p.id); setOpen(false); setConfirmId(null) }}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 8px 8px 10px',
                        background: 'transparent', border: 'none',
                        color: isActive ? 'var(--accent)' : 'var(--text)',
                        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                        fontWeight: isActive ? 600 : 400, fontSize: 14,
                        cursor: 'pointer', textAlign: 'left', minHeight: 40, borderRadius: 6,
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surfaceAlt)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: pDot, flexShrink: 0 }} />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.displayName || p.epicKey}
                      </span>
                      <span style={{
                        fontFamily: "'DM Mono'", fontSize: 10,
                        color: isActive ? 'var(--accent)' : 'var(--textSubtle)',
                        background: isActive ? 'rgba(79,142,247,0.1)' : 'var(--surfaceAlt)',
                        border: `1px solid ${isActive ? 'rgba(79,142,247,0.3)' : 'var(--border)'}`,
                        borderRadius: 4, padding: '1px 5px', flexShrink: 0,
                      }}>
                        {p.epicKey}
                      </span>
                    </button>
                    {onArchive && (
                      <button
                        onClick={e => { e.stopPropagation(); setConfirmId(confirming ? null : p.id) }}
                        title="Ukloni projekat"
                        style={{
                          width: 26, height: 26, borderRadius: 6, flexShrink: 0, marginRight: 4,
                          border: '1px solid var(--border)',
                          background: confirming ? 'var(--redTint)' : 'transparent',
                          color: confirming ? 'var(--red)' : 'var(--textSubtle)',
                          fontSize: 14, cursor: 'pointer', transition: 'all 0.15s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                        onMouseEnter={e => { if (!confirming) { e.currentTarget.style.background = 'var(--redTint)'; e.currentTarget.style.color = 'var(--red)' } }}
                        onMouseLeave={e => { if (!confirming) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--textSubtle)' } }}
                      >×</button>
                    )}
                  </div>

                  {confirming && (
                    <div style={{
                      margin: '0 4px 6px 16px', padding: '10px 12px',
                      background: 'var(--redTint)', border: '1px solid #EF444430', borderRadius: 8,
                    }}>
                      <div style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 12, color: 'var(--text)', marginBottom: 8 }}>
                        Arhivirati projekat?
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setConfirmId(null)} style={{ flex: 1, padding: '5px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--textMuted)', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 12, cursor: 'pointer' }}>
                          Otkaži
                        </button>
                        <button onClick={() => { setConfirmId(null); setOpen(false); onArchive(p.id) }} style={{ flex: 1, padding: '5px', borderRadius: 6, border: 'none', background: 'var(--red)', color: '#fff', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                          Arhiviraj
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Footer */}
            {(onAdd || onOpenArchive) && (
              <div style={{ borderTop: '1px solid var(--border)', marginTop: 4, paddingTop: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {onAdd && (
                  <button
                    onClick={() => { setOpen(false); onAdd() }}
                    style={{
                      padding: '8px 12px', borderRadius: 8, border: 'none',
                      background: 'transparent', color: 'var(--accent)',
                      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                      fontWeight: 600, fontSize: 13, cursor: 'pointer', textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surfaceAlt)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: 15 }}>＋</span> Dodaj projekat
                  </button>
                )}
                {onOpenArchive && (
                  <button
                    onClick={() => { setOpen(false); onOpenArchive() }}
                    style={{
                      padding: '8px 12px', borderRadius: 8, border: 'none',
                      background: 'transparent', color: 'var(--textMuted)',
                      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                      fontSize: 13, cursor: 'pointer', textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--surfaceAlt)'; e.currentTarget.style.color = 'var(--text)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--textMuted)' }}
                  >
                    📦 Arhiva projekata
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── Main Topbar ───────────────────────────────────────────────────────────────

export default function Topbar({
  user, theme, onLogout,
  onOpenSettings, onOpenUsers,
  unreadCount, recentUnread, onMarkAllRead, onNotificationClick,
  onOpenChat, onGoToReleaseNotes, onGoToEpicViewer,
  // Project props (moved from ProjectTabs)
  projects = [], activeId, onSelectProject, onArchiveProject, onOpenArchive, projectData, onAddProject,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const { isMobile } = useWindowSize()

  useEffect(() => {
    function h(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 100,
      height: 56,
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: isMobile ? '0 12px' : '0 20px',
      gap: 12,
    }}>

      {/* Left: Logo + Project Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
        <img
          src={theme === 'dark' ? '/logo-white.png' : '/logo-dark.png'}
          alt="Intelisale"
          style={{ height: 28, flexShrink: 0 }}
        />
        {!isMobile && (
          <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: 'var(--text)', flexShrink: 0 }}>
            Project Hub
          </span>
        )}
        {projects.length > 0 && (
          <>
            <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0, marginLeft: isMobile ? 0 : 2 }} />
            <ProjectDropdown
              projects={projects}
              activeId={activeId}
              onSelect={onSelectProject}
              onArchive={onArchiveProject}
              onOpenArchive={onOpenArchive}
              projectData={projectData}
              onAdd={onAddProject}
            />
          </>
        )}
      </div>

      {/* Right: Nav menu + Notification + Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        <NavMenu items={[
          { label: 'Release Notes', icon: <IconDoc />, action: onGoToEpicViewer },
          { label: 'Release Notes Editor', icon: <IconClipboard />, action: onGoToReleaseNotes },
          { label: 'Poruke', icon: <IconChat />, action: onOpenChat },
          { label: 'Podešavanja', icon: <IconCog />, action: onOpenSettings },
        ]} />

        <NotificationBell
          unreadCount={unreadCount || 0}
          notifications={recentUnread || []}
          onMarkAllRead={onMarkAllRead}
          onNotificationClick={onNotificationClick}
        />

        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 6px' }} />

        {/* Avatar — logout + users */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            title={user?.name}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'var(--accent)', color: '#fff',
              fontFamily: 'Syne', fontWeight: 700, fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', cursor: 'pointer', transition: 'background 0.15s', flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accentHover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
          >
            {initials}
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 42,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, minWidth: 180,
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)', overflow: 'hidden', zIndex: 200,
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{user?.name}</div>
                <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: 'var(--textMuted)', marginTop: 2 }}>{user?.email}</div>
              </div>
              {[
                ...(onOpenUsers ? [{ label: '👥  Korisnici', action: () => { onOpenUsers(); setMenuOpen(false) } }] : []),
                { label: '🚪  Odjava', action: () => { onLogout(); setMenuOpen(false) }, red: true },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={item.action}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '12px 16px',
                    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                    fontSize: 14, color: item.red ? 'var(--red)' : 'var(--text)',
                    border: 'none', background: 'transparent',
                    cursor: 'pointer', minHeight: 44, transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surfaceAlt)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
