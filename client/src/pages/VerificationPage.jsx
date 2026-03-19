import { useState, useRef, useEffect } from 'react'
import { api } from '../api.js'

export default function VerificationPage({ email, onVerified, onGoLogin }) {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendMsg, setResendMsg] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputs = useRef([])

  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  function handleInput(i, val) {
    const v = val.replace(/\D/g, '').slice(0, 1)
    const next = [...code]
    next[i] = v
    setCode(next)
    setError('')
    if (v && i < 5) inputs.current[i + 1]?.focus()
    if (next.every(d => d !== '')) {
      submitCode(next.join(''))
    }
  }

  function handleKeyDown(i, e) {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus()
    }
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const next = pasted.split('')
      setCode(next)
      inputs.current[5]?.focus()
      submitCode(pasted)
    }
  }

  async function submitCode(fullCode) {
    setLoading(true)
    setError('')
    try {
      const res = await api.verify({ email, code: fullCode })
      localStorage.setItem('jt_token', res.token)
      onVerified(res.user)
    } catch (err) {
      setError(err.message)
      setCode(['', '', '', '', '', ''])
      setTimeout(() => inputs.current[0]?.focus(), 50)
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return
    try {
      await api.resendVerification({ email })
      setResendMsg('Novi kod je poslat!')
      setResendCooldown(60)
      setTimeout(() => setResendMsg(''), 4000)
    } catch (err) {
      setError(err.message)
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
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
        <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: 'var(--text)', marginBottom: 8 }}>
          Verifikuj email
        </h1>
        <p style={{ color: 'var(--textMuted)', fontFamily: "'TW Cen MT', 'Century Gothic'", fontSize: 14, marginBottom: 6 }}>
          Poslali smo 6-cifeni kod na
        </p>
        <p style={{ fontFamily: "'DM Mono'", fontSize: 14, color: 'var(--accent)', marginBottom: 28 }}>
          {email}
        </p>

        {/* Code inputs */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }} onPaste={handlePaste}>
          {code.map((digit, i) => (
            <input
              key={i}
              ref={el => inputs.current[i] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleInput(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              disabled={loading}
              style={{
                width: 48,
                height: 56,
                textAlign: 'center',
                fontFamily: "'DM Mono'",
                fontSize: 24,
                fontWeight: 700,
                background: 'var(--bg)',
                border: `2px solid ${error ? 'var(--red)' : digit ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 10,
                color: 'var(--text)',
                transition: 'border-color 0.2s',
                opacity: loading ? 0.6 : 1,
              }}
              onFocus={e => { if (!error) e.target.style.borderColor = 'var(--accent)' }}
              onBlur={e => { if (!digit && !error) e.target.style.borderColor = 'var(--border)' }}
            />
          ))}
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

        {resendMsg && (
          <div style={{
            marginBottom: 16,
            padding: '10px 14px',
            background: 'var(--greenTint)',
            border: '1px solid #22C55E30',
            borderRadius: 8,
            color: 'var(--green)',
            fontSize: 13,
            fontFamily: "'TW Cen MT', 'Century Gothic'",
          }}>{resendMsg}</div>
        )}

        {loading && (
          <div style={{ color: 'var(--textMuted)', fontFamily: "'TW Cen MT', 'Century Gothic'", fontSize: 13, marginBottom: 16 }}>
            Proveravam kod...
          </div>
        )}

        <div style={{ marginTop: 8, fontFamily: "'TW Cen MT', 'Century Gothic'", fontSize: 14, color: 'var(--textMuted)' }}>
          Nisi dobio email?{' '}
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0}
            style={{
              color: resendCooldown > 0 ? 'var(--textSubtle)' : 'var(--accent)',
              fontWeight: 600,
              cursor: resendCooldown > 0 ? 'default' : 'pointer',
            }}
          >
            {resendCooldown > 0 ? `Ponovo za ${resendCooldown}s` : 'Pošalji ponovo'}
          </button>
        </div>

        <div style={{ marginTop: 16, fontFamily: "'TW Cen MT', 'Century Gothic'", fontSize: 14, color: 'var(--textMuted)' }}>
          <button onClick={onGoLogin} style={{ color: 'var(--textMuted)', cursor: 'pointer' }}>
            ← Nazad na prijavu
          </button>
        </div>
      </div>
    </div>
  )
}
