import { useState } from 'react'

function statusDot(data) {
  if (!data) return 'var(--textMuted)'
  const pct = data.total > 0 ? data.done / data.total : 0
  if (pct >= 0.8) return 'var(--green)'
  if (pct >= 0.4) return 'var(--amber)'
  return 'var(--red)'
}

export default function ProjectTabs({ projects, activeId, onSelect, onAdd, onOpenSettings, projectData }) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [epicKey, setEpicKey] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  return (
    <>
      <div style={{
        position: 'sticky',
        top: 56,
        zIndex: 90,
        height: 48,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'stretch',
        paddingLeft: 16,
        overflowX: 'auto',
      }}>
        {projects.map(p => {
          const active = p.id === activeId
          const dot = statusDot(projectData[p.id])
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0 16px',
                borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                color: active ? 'var(--accent)' : 'var(--textMuted)',
                fontFamily: "'DM Sans'",
                fontWeight: 500,
                fontSize: 14,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surfaceAlt)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0 }} />
              <span>{p.displayName || p.epicKey}</span>
              <span style={{
                fontFamily: "'DM Mono'",
                fontSize: 11,
                color: active ? 'var(--accent)' : 'var(--textSubtle)',
                background: 'var(--surfaceAlt)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                padding: '1px 5px',
              }}>{p.epicKey}</span>
            </button>
          )
        })}

        {/* Add button */}
        <button
          onClick={() => onAdd ? setShowAddModal(true) : onOpenSettings?.()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '0 16px',
            marginLeft: 'auto',
            color: 'var(--accent)',
            fontFamily: "'DM Sans'",
            fontSize: 14,
            fontWeight: 500,
            flexShrink: 0,
            borderLeft: '1px solid var(--border)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surfaceAlt)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          + Dodaj projekat
        </button>
      </div>

      {/* Add project modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setShowAddModal(false)}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: 28,
            width: 400,
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

const inputStyle = {
  width: '100%',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '10px 12px',
  color: 'var(--text)',
  fontSize: 14,
  fontFamily: "'DM Sans'",
}

const btnPrimary = {
  background: 'var(--accent)',
  color: '#fff',
  borderRadius: 8,
  padding: '10px',
  fontFamily: "'DM Sans'",
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  border: 'none',
  transition: 'all 0.2s ease',
}

const btnSecondary = {
  background: 'transparent',
  color: 'var(--text)',
  borderRadius: 8,
  padding: '10px',
  fontFamily: "'DM Sans'",
  fontSize: 14,
  cursor: 'pointer',
  border: '1px solid var(--border)',
  transition: 'all 0.2s ease',
}
