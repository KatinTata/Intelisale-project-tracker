export default function ClientNotificationModal({ notifications, onClose, onOpenChat }) {
  if (!notifications.length) return null

  const count = notifications.length

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      zIndex: 500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        width: '100%',
        maxWidth: 440,
        overflow: 'hidden',
        boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 24 }}>🔔</span>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>
              Imate {count} {count === 1 ? 'novu poruku' : count < 5 ? 'nove poruke' : 'novih poruka'}
            </h2>
          </div>
          <p style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 13, color: 'var(--textMuted)', marginLeft: 34 }}>
            Administrator je ostavio poruke za vas
          </p>
        </div>

        {/* Message list */}
        <div style={{ maxHeight: 280, overflowY: 'auto' }}>
          {notifications.map(n => (
            <div key={n.id} style={{ padding: '12px 24px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'Syne', fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
                  {n.project_name || n.epic_key}
                </span>
                {n.task_key && (
                  <span style={{ fontFamily: "'DM Mono'", fontSize: 10, color: 'var(--accent)', background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.2)', borderRadius: 4, padding: '1px 6px' }}>
                    🔗 {n.task_key}
                  </span>
                )}
              </div>
              <p style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 13, color: 'var(--textMuted)', lineHeight: 1.5 }}>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>{n.sender_name}: </span>
                {n.text.length > 100 ? n.text.slice(0, 100) + '...' : n.text}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', display: 'flex', gap: 10 }}>
          <button
            onClick={onOpenChat}
            style={{ flex: 1, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
          >
            Pogledaj sve →
          </button>
          <button
            onClick={onClose}
            style={{ background: 'transparent', color: 'var(--textMuted)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 16px', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 14, cursor: 'pointer' }}
          >
            Zatvori
          </button>
        </div>
      </div>
    </div>
  )
}
