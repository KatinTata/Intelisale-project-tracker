import { useState, useRef, useEffect } from 'react'

export default function Topbar({ user, theme, onToggleTheme, onOpenSettings, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      height: 56,
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img
          src={theme === 'dark' ? '/logo-white.png' : '/logo-dark.png'}
          alt="Intelisale"
          style={{ height: 32 }}
        />
        <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>
          Project Tracker
        </span>
      </div>

      {/* Center: workspace badge */}
      <div>
        {user?.jiraUrl && (
          <span style={{
            fontFamily: "'DM Mono'",
            fontSize: 12,
            color: 'var(--textMuted)',
            background: 'var(--surfaceAlt)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '3px 12px',
          }}>
            {user.jiraUrl}
          </span>
        )}
      </div>

      {/* Right: theme toggle + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Svetla tema' : 'Tamna tema'}
          style={{
            fontSize: 18,
            padding: '6px',
            borderRadius: 8,
            color: 'var(--textMuted)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--surfaceAlt)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--textMuted)'; e.currentTarget.style.background = 'transparent' }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* Avatar dropdown */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--accent)',
              color: '#fff',
              fontFamily: 'Syne',
              fontWeight: 700,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accentHover)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)' }}
          >
            {initials}
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: 44,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              minWidth: 180,
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              zIndex: 200,
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{user?.name}</div>
                <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: 'var(--textMuted)', marginTop: 2 }}>{user?.email}</div>
              </div>
              {[
                { label: '⚙️  Podešavanja', action: () => { onOpenSettings(); setMenuOpen(false) } },
                { label: '🚪  Odjava', action: () => { onLogout(); setMenuOpen(false) }, red: true },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={item.action}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 16px',
                    fontFamily: "'DM Sans'",
                    fontSize: 14,
                    color: item.red ? 'var(--red)' : 'var(--text)',
                    transition: 'background 0.15s',
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
