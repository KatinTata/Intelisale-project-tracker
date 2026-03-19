import { useState } from 'react'
import { api } from '../api.js'

export default function RegisterPage({ onRegistered, onGoLogin }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.register({ name, email, password })
      onRegistered(res.email)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '36px 40px',
        boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📊</div>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 24, color: 'var(--text)', marginBottom: 4 }}>
            Jira Tracker
          </h1>
          <p style={{ color: 'var(--textMuted)', fontFamily: "'TW Cen MT', 'Century Gothic'", fontSize: 14 }}>
            Kreirajte novi nalog
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>IME</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Vaše ime"
              required
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="vas@email.com"
              required
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>LOZINKA</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 6 karaktera"
              required
              minLength={6}
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
            }}>{error}</div>
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
            {loading ? 'Kreiram nalog...' : 'Registruj se'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontFamily: "'TW Cen MT', 'Century Gothic'", fontSize: 14, color: 'var(--textMuted)' }}>
          Već imate nalog?{' '}
          <button onClick={onGoLogin} style={{ color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>
            Prijavite se
          </button>
        </div>
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
}
