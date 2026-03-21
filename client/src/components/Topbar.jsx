import { useState, useRef, useEffect } from 'react'
import { useWindowSize } from '../hooks/useWindowSize.js'
import NotificationBell from './NotificationBell.jsx'
import { useT } from '../lang.jsx'

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
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V20.25a.75.75 0 0 0 1.28.53l3.58-3.58A48.458 48.458 0 0 0 11.25 17c2.115 0 4.198-.137 6.24-.402 1.608-.209 2.76-1.614 2.76-3.235V9.75Z" />
    </svg>
  )
}

function IconHome() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
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

function NavMenu({ items, currentPage }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const t = useT()

  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const visible = items.filter(i => i.action || (i.page && i.page === currentPage))
  if (!visible.length) return null

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title={t('topbar.modules')}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(79,142,247,0.12)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
        onMouseLeave={e => { e.currentTarget.style.background = open ? 'rgba(79,142,247,0.1)' : 'transparent'; e.currentTarget.style.borderColor = open ? 'var(--accent)' : 'rgba(79,142,247,0.4)' }}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '0 10px', height: 30, borderRadius: 8,
          background: open ? 'rgba(79,142,247,0.1)' : 'transparent',
          border: `1px solid ${open ? 'var(--accent)' : 'rgba(79,142,247,0.4)'}`,
          cursor: 'pointer', transition: 'all 0.15s',
          color: 'var(--accent)',
          flexShrink: 0,
          fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
          fontWeight: 600, fontSize: 13,
        }}
      >
        <IconGrid />
        {t('topbar.modules')}
        <ChevronDown open={open} />
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 149 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', left: 0, top: 'calc(100% + 8px)',
            minWidth: 210,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            zIndex: 150, padding: 6, display: 'flex', flexDirection: 'column', gap: 1,
          }}>
            {visible.map(item => {
              const isActive = item.page && item.page === currentPage
              return (
                <button
                  key={item.label}
                  onClick={() => { if (!isActive && item.action) { setOpen(false); item.action() } }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 11px 10px 14px', borderRadius: 8,
                    background: isActive ? 'rgba(79,142,247,0.08)' : 'transparent',
                    border: 'none',
                    borderLeft: `3px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                    color: isActive ? 'var(--accent)' : 'var(--text)',
                    cursor: isActive ? 'default' : 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s', width: '100%',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surfaceAlt)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ color: isActive ? 'var(--accent)' : 'var(--textMuted)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  <span style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 14, fontWeight: isActive ? 600 : 500, flex: 1 }}>
                    {item.label}
                  </span>
                  {isActive && (
                    <span style={{ fontFamily: "'DM Mono'", fontSize: 9, color: 'var(--accent)', background: 'rgba(79,142,247,0.12)', borderRadius: 8, padding: '2px 7px', flexShrink: 0 }}>
                      ovde
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ── Archive Icon ──────────────────────────────────────────────────────────────

function IconArchive() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 15, height: 15 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
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
          padding: '0 10px 0 12px', height: 30, borderRadius: 8,
          border: `1px solid ${open ? 'var(--accent)' : 'rgba(79,142,247,0.4)'}`,
          background: open ? 'rgba(79,142,247,0.1)' : 'transparent',
          color: 'var(--accent)',
          fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
          fontWeight: 600, fontSize: 13,
          cursor: 'pointer', transition: 'all 0.15s',
          maxWidth: 260, minWidth: 140,
        }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(79,142,247,0.12)' } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.borderColor = 'rgba(79,142,247,0.4)'; e.currentTarget.style.background = 'transparent' } }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>
          {active ? (active.displayName || active.epicKey) : 'Projekat...'}
        </span>
        {active && (
          <span style={{
            fontFamily: "'DM Mono'", fontSize: 10, fontWeight: 500,
            color: 'var(--accent)', background: 'rgba(79,142,247,0.12)',
            border: '1px solid rgba(79,142,247,0.3)', borderRadius: 4, padding: '1px 5px', flexShrink: 0,
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
                    <span style={{ fontSize: 16, lineHeight: 1 }}>＋</span> Dodaj projekat
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
                    <IconArchive /> Arhiva projekata
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

function IconFolder() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
    </svg>
  )
}

export default function Topbar({
  user, theme, onLogout,
  onOpenSettings, onOpenUsers,
  unreadCount, recentUnread, onMarkAllRead, onNotificationClick,
  onOpenChat, onGoToReleaseNotes, onGoToReleaseNotesEditor, onGoToDashboard, onGoToDocuments,
  currentPage,
  // Project props (moved from ProjectTabs)
  projects = [], activeId, onSelectProject, onArchiveProject, onOpenArchive, projectData, onAddProject,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const { isMobile } = useWindowSize()
  const t = useT()

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
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
    }}>

      {/* ── Row 1: Logo + Bell + Avatar ── */}
      <div style={{
        height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 12px' : '0 20px',
        gap: 12,
      }}>
        {/* Left: Logo + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
        </div>

        {/* Right: Notification + Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>

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
                  ...(onOpenUsers ? [{ label: t('topbar.users'), action: () => { onOpenUsers(); setMenuOpen(false) }, icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 15, height: 15, flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg> }] : []),
                  { label: t('topbar.logout'), action: () => { onLogout(); setMenuOpen(false) }, red: true, icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 15, height: 15, flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" /></svg> },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                      padding: '10px 16px',
                      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                      fontSize: 14, color: item.red ? 'var(--red)' : 'var(--text)',
                      border: 'none', background: 'transparent',
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surfaceAlt)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>{/* end row 1 right */}
      </div>{/* end row 1 */}

      {/* ── Row 2: NavMenu + Project Dropdown ── */}
      <div style={{
        height: 40,
        borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 8,
        padding: isMobile ? '0 12px' : '0 20px',
      }}>
        <NavMenu currentPage={currentPage} items={[
          { label: t('topbar.nav.dashboard'), icon: <IconHome />, action: onGoToDashboard, page: 'dashboard' },
          { label: t('topbar.nav.releaseNotes'), icon: <IconDoc />, action: onGoToReleaseNotes, page: 'releaseNotes' },
          ...(onGoToReleaseNotesEditor ? [{ label: t('topbar.nav.releaseNotesEditor'), icon: <IconClipboard />, action: onGoToReleaseNotesEditor, page: 'releaseNotesEditor' }] : []),
          { label: t('topbar.nav.documents'), icon: <IconFolder />, action: onGoToDocuments, page: 'documents' },
          { label: t('topbar.nav.messages'), icon: <IconChat />, action: onOpenChat },
          { label: t('topbar.nav.settings'), icon: <IconCog />, action: onOpenSettings },
        ]} />

        {projects.length > 0 && (
          <ProjectDropdown
            projects={projects}
            activeId={activeId}
            onSelect={onSelectProject}
            onArchive={onArchiveProject}
            onOpenArchive={onOpenArchive}
            projectData={projectData}
            onAdd={onAddProject}
          />
        )}
      </div>{/* end row 2 */}

    </div>
  )
}
