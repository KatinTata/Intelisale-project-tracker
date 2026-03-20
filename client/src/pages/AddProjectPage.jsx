import { useState, useEffect } from 'react'
import BrainAnimation from '../components/BrainAnimation.jsx'
import { api } from '../api.js'

const TABS = [
  { id: 'epic', label: 'Epic' },
  { id: 'jql', label: 'JQL upit' },
  { id: 'combined', label: 'Kombinovani' },
]

export default function AddProjectPage({ onAdd, onCancel }) {
  const [tab, setTab] = useState('epic')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Epic tab state
  const [epicKey, setEpicKey] = useState('')
  const [epicName, setEpicName] = useState('')

  // JQL tab state
  const [jqlQuery, setJqlQuery] = useState('')
  const [jqlName, setJqlName] = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [testError, setTestError] = useState('')

  // Combined tab state
  const [cEpicKey, setCEpicKey] = useState('')
  const [cFixVersion, setCFixVersion] = useState('')
  const [cClientScope, setCClientScope] = useState('')
  const [cDateFrom, setCDateFrom] = useState('')
  const [cDateTo, setCDateTo] = useState('')
  const [cName, setCName] = useState('')

  // Reset results when tab changes
  useEffect(() => { setError(''); setTestResult(null); setTestError('') }, [tab])

  // Build JQL from combined filters
  const combinedJql = buildCombinedJql({ epicKey: cEpicKey, fixVersion: cFixVersion, clientScope: cClientScope, dateFrom: cDateFrom, dateTo: cDateTo })

  async function handleTestJql() {
    const q = tab === 'jql' ? jqlQuery : combinedJql
    if (!q.trim()) return
    setTestLoading(true)
    setTestResult(null)
    setTestError('')
    try {
      const res = await api.testJql(q)
      setTestResult(res)
    } catch (err) {
      setTestError(err.message)
    } finally {
      setTestLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (tab === 'epic') {
        if (!epicKey.trim()) { setError('Epic key je obavezan'); setLoading(false); return }
        await onAdd({ epicKey: epicKey.trim(), displayName: epicName.trim() || undefined, filterType: 'epic' })
      } else if (tab === 'jql') {
        if (!jqlQuery.trim()) { setError('JQL upit je obavezan'); setLoading(false); return }
        if (!jqlName.trim()) { setError('Naziv projekta je obavezan'); setLoading(false); return }
        await onAdd({ displayName: jqlName.trim(), filterType: 'jql', filterJql: jqlQuery.trim() })
      } else {
        if (!combinedJql) { setError('Unesite bar jedan filter'); setLoading(false); return }
        if (!cName.trim()) { setError('Naziv projekta je obavezan'); setLoading(false); return }
        const meta = { epicKey: cEpicKey, fixVersion: cFixVersion, clientScope: cClientScope, dateFrom: cDateFrom, dateTo: cDateTo }
        await onAdd({ displayName: cName.trim(), filterType: 'combined', filterJql: combinedJql, filterMeta: meta, epicKey: cEpicKey || undefined })
      }
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <BrainAnimation opacity={0.35} fullscreen />

      <button
        onClick={onCancel}
        style={{ position: 'absolute', top: 20, left: 20, zIndex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', color: 'var(--textMuted)', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 14, cursor: 'pointer', transition: 'all 0.2s ease' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--borderHover)'; e.currentTarget.style.color = 'var(--text)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--textMuted)' }}
      >
        ← Nazad
      </button>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 560, background: 'var(--surface)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '28px 32px 0' }}>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: 'var(--text)', marginBottom: 4 }}>Dodaj projekat</h1>
          <p style={{ color: 'var(--textMuted)', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 14, marginBottom: 20 }}>
            Izaberite način filtriranja taskova
          </p>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)' }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '10px 20px',
                  fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                  fontWeight: tab === t.id ? 600 : 400,
                  fontSize: 14,
                  color: tab === t.id ? 'var(--accent)' : 'var(--textMuted)',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
                  marginBottom: -1,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px 32px 28px' }}>
          {tab === 'epic' && (
            <EpicTab epicKey={epicKey} setEpicKey={setEpicKey} displayName={epicName} setDisplayName={setEpicName} />
          )}
          {tab === 'jql' && (
            <JqlTab
              jql={jqlQuery} setJql={setJqlQuery}
              name={jqlName} setName={setJqlName}
              onTest={handleTestJql} testLoading={testLoading}
              testResult={testResult} testError={testError}
            />
          )}
          {tab === 'combined' && (
            <CombinedTab
              epicKey={cEpicKey} setEpicKey={setCEpicKey}
              fixVersion={cFixVersion} setFixVersion={setCFixVersion}
              clientScope={cClientScope} setClientScope={setCClientScope}
              dateFrom={cDateFrom} setDateFrom={setCDateFrom}
              dateTo={cDateTo} setDateTo={setCDateTo}
              name={cName} setName={setCName}
              builtJql={combinedJql}
              onTest={handleTestJql} testLoading={testLoading}
              testResult={testResult} testError={testError}
            />
          )}

          {error && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--redTint)', border: '1px solid #EF444430', borderRadius: 8, color: 'var(--red)', fontSize: 13, fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', background: 'var(--accent)', color: '#fff', borderRadius: 8, padding: '11px', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', border: 'none', opacity: loading ? 0.7 : 1, transition: 'all 0.2s ease' }}
          >
            {loading ? 'Dodajem...' : 'Dodaj projekat'}
          </button>
        </form>
      </div>
    </div>
  )
}

function EpicTab({ epicKey, setEpicKey, displayName, setDisplayName }) {
  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>EPIC KEY *</label>
        <input value={epicKey} onChange={e => setEpicKey(e.target.value)} placeholder="npr. PROJECT-184" required autoFocus style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
      </div>
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>NAZIV (opciono)</label>
        <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="npr. Knjaz Miloš B2B Portal" style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
      </div>
    </>
  )
}

function JqlTab({ jql, setJql, name, setName, onTest, testLoading, testResult, testError }) {
  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>JQL UPIT *</label>
        <textarea
          value={jql}
          onChange={e => setJql(e.target.value)}
          placeholder={"npr. cf[11529] = 'Knjaz Miloš Srbija' AND created >= -60d"}
          rows={4}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <div style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onTest}
            disabled={testLoading || !jql.trim()}
            style={{ background: 'transparent', border: '1px solid var(--accent)', borderRadius: 6, padding: '5px 14px', color: 'var(--accent)', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 13, cursor: testLoading || !jql.trim() ? 'not-allowed' : 'pointer', opacity: !jql.trim() ? 0.5 : 1, transition: 'all 0.2s ease' }}
          >
            {testLoading ? 'Testiram...' : '▶ Test upita'}
          </button>
        </div>
        <TestResult result={testResult} error={testError} />
      </div>
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>NAZIV PROJEKTA *</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="npr. Knjaz Miloš – poslednjih 60 dana" style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
      </div>
    </>
  )
}

function CombinedTab({ epicKey, setEpicKey, fixVersion, setFixVersion, clientScope, setClientScope, dateFrom, setDateFrom, dateTo, setDateTo, name, setName, builtJql, onTest, testLoading, testResult, testError }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>EPIC KEY (opciono)</label>
          <input value={epicKey} onChange={e => setEpicKey(e.target.value)} placeholder="PROJECT-184" style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        </div>
        <div>
          <label style={labelStyle}>FIX VERSION (opciono)</label>
          <input value={fixVersion} onChange={e => setFixVersion(e.target.value)} placeholder="npr. 2.1.0" style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        </div>
        <div>
          <label style={labelStyle}>CLIENT SCOPE — cf[11529] (opciono)</label>
          <input value={clientScope} onChange={e => setClientScope(e.target.value)} placeholder="npr. Knjaz Miloš Srbija" style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label style={labelStyle}>OD DATUMA</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>
          <div>
            <label style={labelStyle}>DO DATUMA</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>
        </div>
      </div>

      {/* JQL preview */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>GENERISANI JQL</label>
        <div style={{ position: 'relative' }}>
          <textarea
            readOnly
            value={builtJql || '— unesite bar jedan filter —'}
            rows={3}
            style={{ ...inputStyle, color: builtJql ? 'var(--textMuted)' : 'var(--textSubtle)', fontFamily: "'DM Mono'", fontSize: 12, resize: 'none', background: 'var(--surfaceAlt)' }}
          />
          {builtJql && (
            <div style={{ marginTop: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onTest}
                disabled={testLoading}
                style={{ background: 'transparent', border: '1px solid var(--accent)', borderRadius: 6, padding: '5px 14px', color: 'var(--accent)', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 13, cursor: testLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease' }}
              >
                {testLoading ? 'Testiram...' : '▶ Test upita'}
              </button>
            </div>
          )}
        </div>
        <TestResult result={testResult} error={testError} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>NAZIV PROJEKTA *</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="npr. Knjaz Miloš – Q1 2026" style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
      </div>
    </>
  )
}

function TestResult({ result, error }) {
  if (error) {
    return (
      <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--redTint)', border: '1px solid #EF444430', borderRadius: 6, color: 'var(--red)', fontSize: 12, fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>
        {error}
      </div>
    )
  }
  if (!result) return null
  return (
    <div style={{ marginTop: 8, padding: '10px 12px', background: 'var(--greenTint)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 6 }}>
      <div style={{ fontFamily: "'DM Mono'", fontSize: 12, color: 'var(--green)', marginBottom: result.preview.length ? 8 : 0 }}>
        ✓ Pronađeno {result.count} taskova
      </div>
      {result.preview.map(p => (
        <div key={p.key} style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 3 }}>
          <span style={{ fontFamily: "'DM Mono'", fontSize: 11, color: 'var(--accent)', flexShrink: 0 }}>{p.key}</span>
          <span style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 12, color: 'var(--textMuted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.summary}</span>
          <span style={{ fontFamily: "'DM Mono'", fontSize: 10, color: 'var(--textSubtle)', flexShrink: 0 }}>{p.status}</span>
        </div>
      ))}
    </div>
  )
}

function buildCombinedJql({ epicKey, fixVersion, clientScope, dateFrom, dateTo }) {
  const parts = []
  if (epicKey?.trim()) parts.push(`parent = ${epicKey.trim().toUpperCase()}`)
  if (fixVersion?.trim()) parts.push(`fixVersion = "${fixVersion.trim()}"`)
  if (clientScope?.trim()) parts.push(`cf[11529] = "${clientScope.trim()}"`)
  if (dateFrom) parts.push(`created >= "${dateFrom}"`)
  if (dateTo) parts.push(`created <= "${dateTo}"`)
  return parts.length ? parts.join(' AND ') + ' ORDER BY created ASC' : ''
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
  fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  transition: 'border-color 0.2s',
  boxSizing: 'border-box',
}
