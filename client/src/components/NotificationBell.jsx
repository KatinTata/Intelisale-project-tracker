import { useState, useRef, useEffect } from 'react'

function fmtTime(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return 'upravo'
  if (diff < 3600) return `pre ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `pre ${Math.floor(diff / 3600)}h`
  return `pre ${Math.floor(diff / 86400)}d`
}

export default function NotificationBell({ unreadCount = 0, notifications = [], onMarkAllRead, onNotificationClick }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'relative',
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: open ? 'var(--surfaceAlt)' : 'transparent',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: 16,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--borderHover)'; e.currentTarget.style.background = 'var(--surfaceAlt)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = open ? 'var(--surfaceAlt)' : 'transparent' }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: -4,
            right: -4,
            background: 'var(--red)',
            color: '#fff',
            borderRadius: 10,
            fontSize: 10,
            fontFamily: "'DM Mono'",
            fontWeight: 700,
            minWidth: 18,
            height: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            animation: 'notif-pulse 2s ease infinite',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 44,
          width: 320,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          zIndex: 200,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
              Notifikacije
            </span>
            {unreadCount > 0 && (
              <span style={{ fontFamily: "'DM Mono'", fontSize: 11, color: 'var(--accent)', background: 'rgba(79,142,247,0.1)', borderRadius: 10, padding: '2px 8px' }}>
                {unreadCount} novo
              </span>
            )}
          </div>

          {/* List */}
          {notifications.length === 0 ? (
            <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--textMuted)', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 13 }}>
              Nema novih poruka
            </div>
          ) : (
            notifications.map(n => (
              <button
                key={n.id}
                onClick={() => { onNotificationClick(n); setOpen(false) }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', transition: 'background 0.15s', border: 'none', borderBottom: '1px solid var(--border)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surfaceAlt)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                  <span style={{ fontFamily: 'Syne', fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                    {n.project_name || n.epic_key}
                  </span>
                  <span style={{ fontFamily: "'DM Mono'", fontSize: 10, color: 'var(--textSubtle)' }}>
                    {fmtTime(n.created_at)}
                  </span>
                </div>
                {n.task_key && (
                  <span style={{ display: 'inline-block', fontFamily: "'DM Mono'", fontSize: 10, color: 'var(--accent)', background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.2)', borderRadius: 4, padding: '1px 6px', marginBottom: 4 }}>
                    🔗 {n.task_key}
                  </span>
                )}
                <div style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 12, color: 'var(--textMuted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ color: 'var(--text)', fontWeight: 600 }}>{n.sender_name}: </span>
                  {n.text.length > 60 ? n.text.slice(0, 60) + '...' : n.text}
                </div>
              </button>
            ))
          )}

          {/* Footer */}
          <div style={{ padding: '10px 16px' }}>
            <button
              onClick={() => { onMarkAllRead(); setOpen(false) }}
              style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 12, color: 'var(--textMuted)', cursor: 'pointer', background: 'transparent', border: 'none', padding: 0 }}
            >
              Označi sve kao pročitano
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
