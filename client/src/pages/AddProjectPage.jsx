import { useState } from 'react'
import BrainAnimation from '../components/BrainAnimation.jsx'

export default function AddProjectPage({ onAdd, onCancel }) {
  const [epicKey, setEpicKey] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!epicKey.trim()) return
    setLoading(true)
    setError('')
    try {
      await onAdd({ epicKey: epicKey.trim(), displayName: displayName.trim() || undefined })
      // onAdd success → parent will navigate away
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--bg)',
      zIndex: 500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <BrainAnimation opacity={0.35} />

      {/* Back button */}
      <button
        onClick={onCancel}
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'transparent',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '8px 14px',
          color: 'var(--textMuted)',
          fontFamily: "'TW Cen MT', 'Century Gothic'",
          fontSize: 14,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--borderHover)'; e.currentTarget.style.color = 'var(--text)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--textMuted)' }}
      >
        ← Nazad
      </button>

      {/* Card */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: 440,
        background: 'var(--surface)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '36px 40px',
        boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>＋</div>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: 'var(--text)', marginBottom: 4 }}>
            Dodaj projekat
          </h1>
          <p style={{ color: 'var(--textMuted)', fontFamily: "'TW Cen MT', 'Century Gothic'", fontSize: 14 }}>
            Unesite Epic key iz vašeg Jira projekta
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>EPIC KEY *</label>
            <input
              value={epicKey}
              onChange={e => setEpicKey(e.target.value)}
              placeholder="npr. PROJECT-184"
              required
              autoFocus
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>NAZIV (opciono)</label>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="npr. Knjaz Miloš B2B Portal"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {error && (
            <div style={{
              marginBottom: 16,
              padding: '10px 14px',
              background: 'var(--redTint)',
              border: '1px solid #EF444430',
              borderRadius: 8,
              color: 'var(--red)',
              fontSize: 13,
              fontFamily: "'TW Cen MT', 'Century Gothic'",
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: 'var(--accent)',
              color: '#fff',
              borderRadius: 8,
              padding: '11px',
              fontFamily: "'TW Cen MT', 'Century Gothic'",
              fontWeight: 600,
              fontSize: 15,
              cursor: loading ? 'not-allowed' : 'pointer',
              border: 'none',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? 'Dodajem...' : 'Dodaj projekat'}
          </button>
        </form>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: 11,
  fontFamily: "'DM Mono'",
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--textMuted)',
  marginBottom: 6,
}

const inputStyle = {
  width: '100%',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '10px 14px',
  color: 'var(--text)',
  fontSize: 14,
  fontFamily: "'TW Cen MT', 'Century Gothic'",
  transition: 'border-color 0.2s',
  boxSizing: 'border-box',
}
