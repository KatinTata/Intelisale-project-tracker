import { useState, useEffect, useRef } from 'react'
import { api } from '../api.js'
import { useWindowSize } from '../hooks/useWindowSize.js'

function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('sr-Latn', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function fmtDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

const EMPTY_FORM = { date: '', done: '', testing: '', inprog: '', todo: '', total_spent: '' }

export default function ProgressTab({ epicKey }) {
  const [snapshots, setSnapshots] = useState([])
  const [loading, setLoading] = useState(true)
  const [tooltip, setTooltip] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formSaving, setFormSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const svgRef = useRef(null)
  const containerRef = useRef(null)
  const { isMobile } = useWindowSize()

  function loadSnapshots() {
    return api.getSnapshots(epicKey)
      .then(res => setSnapshots(res.snapshots || []))
      .catch(() => {})
  }

  useEffect(() => {
    setLoading(true)
    setSnapshots([])
    loadSnapshots().finally(() => setLoading(false))
  }, [epicKey])

  async function handleSaveManual(e) {
    e.preventDefault()
    if (!form.date) { setFormError('Datum je obavezan'); return }
    const done    = parseInt(form.done)    || 0
    const testing = parseInt(form.testing) || 0
    const inprog  = parseInt(form.inprog)  || 0
    const todo    = parseInt(form.todo)    || 0
    setFormSaving(true)
    setFormError('')
    try {
      await api.saveSnapshot(epicKey, {
        date: form.date,
        total: done + testing + inprog + todo,
        done, testing, inprog, todo,
        total_est: null,
        total_spent: parseFloat(form.total_spent) || null,
        over_count: 0,
      })
      await loadSnapshots()
      setShowForm(false)
      setForm(EMPTY_FORM)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setFormSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--textMuted)', fontFamily: "'TW Cen MT', 'Century Gothic'" }}>
        Učitavam...
      </div>
    )
  }

  if (snapshots.length < 2) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* still show the manual snapshot button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => { setShowForm(f => !f); setFormError('') }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: showForm ? 'var(--surfaceAlt)' : 'var(--accent)',
              color: showForm ? 'var(--textMuted)' : '#fff',
              border: showForm ? '1px solid var(--border)' : 'none',
              borderRadius: 8, padding: '7px 14px',
              fontFamily: "'TW Cen MT', 'Century Gothic'", fontWeight: 600, fontSize: 13,
              cursor: 'pointer', transition: 'all 0.2s ease',
            }}
          >
            {showForm ? '✕ Otkaži' : '＋ Dodaj prošli snapshot'}
          </button>
        </div>

        {showForm && (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '20px 24px',
          }}>
            <h4 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>
              Retroaktivni snapshot
            </h4>
            <p style={{ fontFamily: "'TW Cen MT', 'Century Gothic'", fontSize: 12, color: 'var(--textMuted)', marginBottom: 16 }}>
              Unesite podatke za prošli datum da biste popunili istoriju napretka.
            </p>
            <form onSubmit={handleSaveManual}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(6, 1fr)', gap: 10, marginBottom: 12 }}>
                {[
                  { key: 'date',        label: 'DATUM',        type: 'date',   placeholder: '' },
                  { key: 'done',        label: 'ZAVRŠENO',     type: 'number', placeholder: '0' },
                  { key: 'testing',     label: 'TESTING',      type: 'number', placeholder: '0' },
                  { key: 'inprog',      label: 'IN PROGRESS',  type: 'number', placeholder: '0' },
                  { key: 'todo',        label: 'TO DO',        type: 'number', placeholder: '0' },
                  { key: 'total_spent', label: 'UTROŠENO (h)', type: 'number', placeholder: '0.0', step: '0.1' },
                ].map(f => (
                  <div key={f.key} style={isMobile && f.key === 'date' ? { gridColumn: '1 / -1' } : {}}>
                    <label style={{ display: 'block', fontFamily: "'DM Mono'", fontSize: 10, color: 'var(--textMuted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
                      {f.label}
                    </label>
                    <input
                      type={f.type} value={form[f.key]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder} step={f.step}
                      min={f.type === 'number' ? 0 : undefined}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: 'var(--bg)', border: '1px solid var(--border)',
                        borderRadius: 7, padding: '8px 10px',
                        color: 'var(--text)', fontSize: 13, fontFamily: "'DM Mono'",
                      }}
                      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                  </div>
                ))}
              </div>
              {formError && (
                <div style={{ marginBottom: 10, padding: '7px 12px', background: 'var(--redTint)', border: '1px solid #EF444430', borderRadius: 6, color: 'var(--red)', fontSize: 12 }}>
                  {formError}
                </div>
              )}
              <button type="submit" disabled={formSaving} style={{
                background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8,
                padding: '9px 20px', fontFamily: "'TW Cen MT', 'Century Gothic'",
                fontWeight: 600, fontSize: 13, cursor: formSaving ? 'not-allowed' : 'pointer', opacity: formSaving ? 0.7 : 1,
              }}>
                {formSaving ? 'Čuvam...' : 'Sačuvaj snapshot'}
              </button>
            </form>
          </div>
        )}

        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📈</div>
          <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 8 }}>
            Nema dovoljno podataka
          </div>
          <div style={{ fontFamily: "'TW Cen MT', 'Century Gothic'", fontSize: 14, color: 'var(--textMuted)', maxWidth: 320, margin: '0 auto' }}>
            Osvežavaj projekat svakodnevno ili dodaj prošle snapshotove ručno.
          </div>
          {snapshots.length === 1 && (
            <div style={{ fontFamily: "'DM Mono'", fontSize: 12, color: 'var(--textSubtle)', marginTop: 12 }}>
              Prikupljen 1 od 2 potrebna snapshots
            </div>
          )}
        </div>
      </div>
    )
  }

  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date))
  const first = sorted[0]
  const last  = sorted[sorted.length - 1]

  // Summary calculations
  const daysTracked = sorted.length
  const calendarDays = Math.max(1,
    (new Date(last.date + 'T00:00:00') - new Date(first.date + 'T00:00:00')) / 86400000
  )
  const totalCompleted = Math.max(0, last.done - first.done)
  const avgPerDay = (totalCompleted / calendarDays).toFixed(1)

  // Trend: last 7 snapshots vs overall
  let trendLabel = '→ Konstantno'
  let trendColor  = 'var(--textMuted)'
  const recent = sorted.slice(-Math.min(7, sorted.length))
  if (recent.length >= 2) {
    const recentDays = Math.max(1,
      (new Date(recent[recent.length - 1].date + 'T00:00:00') - new Date(recent[0].date + 'T00:00:00')) / 86400000
    )
    const recentAvg = (recent[recent.length - 1].done - recent[0].done) / recentDays
    const overallAvg = totalCompleted / calendarDays
    if (recentAvg > overallAvg * 1.1)      { trendLabel = '↑ Ubrzava';    trendColor = 'var(--green)' }
    else if (recentAvg < overallAvg * 0.9) { trendLabel = '↓ Usporava';   trendColor = 'var(--red)'   }
  }

  // ── Burn-down chart ──
  const CHART_W = 800
  const CHART_H = 220
  const PAD = { top: 16, right: 20, bottom: 40, left: 44 }
  const innerW = CHART_W - PAD.left - PAD.right
  const innerH = CHART_H - PAD.top  - PAD.bottom

  const remaining  = sorted.map(s => s.testing + s.inprog + s.todo)
  const maxR = Math.max(...remaining, 1)

  const xScale = i => PAD.left + (sorted.length === 1 ? innerW / 2 : (i / (sorted.length - 1)) * innerW)
  const yScale = v => PAD.top + innerH - (v / maxR) * innerH

  const actualPts = sorted.map((s, i) => ({
    x: xScale(i), y: yScale(remaining[i]), snap: s,
  }))
  const idealPts = sorted.map((_, i) => ({
    x: xScale(i),
    y: yScale(remaining[0] * (1 - i / Math.max(1, sorted.length - 1))),
  }))

  const toPath = pts => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')

  const yTickCount = 4
  const yTicks = Array.from({ length: yTickCount + 1 }, (_, i) =>
    Math.round((maxR / yTickCount) * i)
  )

  const showEvery = sorted.length > 12 ? Math.ceil(sorted.length / 8) : 1

  function handleMouseMove(e) {
    if (!svgRef.current || !containerRef.current) return
    const svgRect = svgRef.current.getBoundingClientRect()
    const svgX = ((e.clientX - svgRect.left) / svgRect.width) * CHART_W

    let nearest = null
    let minDist  = Infinity
    actualPts.forEach(p => {
      const d = Math.abs(p.x - svgX)
      if (d < minDist) { minDist = d; nearest = p }
    })

    if (nearest && minDist < 50) {
      const contRect = containerRef.current.getBoundingClientRect()
      setTooltip({
        screenX: e.clientX - contRect.left,
        screenY: e.clientY - contRect.top,
        snap: nearest.snap,
        remaining: nearest.snap.testing + nearest.snap.inprog + nearest.snap.todo,
      })
    } else {
      setTooltip(null)
    }
  }

  // Daily table — newest first
  const today = new Date().toISOString().slice(0, 10)
  const tableRows = [...sorted].reverse().map((snap, i, arr) => {
    const prev  = arr[i + 1]
    const delta = prev != null ? snap.done - prev.done : null
    return { snap, delta }
  })

  const colsDesktop = '110px 80px 80px 90px 80px 90px 80px'
  const colsMobile  = '88px 1fr 1fr 1fr 60px'

  const cols = isMobile ? colsMobile : colsDesktop
  const headers = isMobile
    ? ['DATUM', 'ZAV.', 'IN PROG', 'TO DO', 'Δ']
    : ['DATUM', 'ZAVRŠENO', 'TESTING', 'IN PROG', 'TO DO', 'UTROŠENO', 'Δ PROMENA']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Manual snapshot button + form ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => { setShowForm(f => !f); setFormError('') }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: showForm ? 'var(--surfaceAlt)' : 'var(--accent)',
            color: showForm ? 'var(--textMuted)' : '#fff',
            border: showForm ? '1px solid var(--border)' : 'none',
            borderRadius: 8, padding: '7px 14px',
            fontFamily: "'TW Cen MT', 'Century Gothic'", fontWeight: 600, fontSize: 13,
            cursor: 'pointer', transition: 'all 0.2s ease',
          }}
        >
          {showForm ? '✕ Otkaži' : '＋ Dodaj prošli snapshot'}
        </button>
      </div>

      {showForm && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '20px 24px',
        }}>
          <h4 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>
            Retroaktivni snapshot
          </h4>
          <p style={{ fontFamily: "'TW Cen MT', 'Century Gothic'", fontSize: 12, color: 'var(--textMuted)', marginBottom: 16 }}>
            Unesite podatke za prošli datum da biste popunili istoriju napretka.
          </p>
          <form onSubmit={handleSaveManual}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(6, 1fr)', gap: 10, marginBottom: 12 }}>
              {[
                { key: 'date',        label: 'DATUM',       type: 'date',   placeholder: '' },
                { key: 'done',        label: 'ZAVRŠENO',    type: 'number', placeholder: '0' },
                { key: 'testing',     label: 'TESTING',     type: 'number', placeholder: '0' },
                { key: 'inprog',      label: 'IN PROGRESS', type: 'number', placeholder: '0' },
                { key: 'todo',        label: 'TO DO',       type: 'number', placeholder: '0' },
                { key: 'total_spent', label: 'UTROŠENO (h)', type: 'number', placeholder: '0.0', step: '0.1' },
              ].map(f => (
                <div key={f.key} style={isMobile && f.key === 'date' ? { gridColumn: '1 / -1' } : {}}>
                  <label style={{ display: 'block', fontFamily: "'DM Mono'", fontSize: 10, color: 'var(--textMuted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    value={form[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    step={f.step}
                    min={f.type === 'number' ? 0 : undefined}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      borderRadius: 7, padding: '8px 10px',
                      color: 'var(--text)', fontSize: 13,
                      fontFamily: "'DM Mono'",
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
              ))}
            </div>
            {formError && (
              <div style={{ marginBottom: 10, padding: '7px 12px', background: 'var(--redTint)', border: '1px solid #EF444430', borderRadius: 6, color: 'var(--red)', fontSize: 12 }}>
                {formError}
              </div>
            )}
            <button
              type="submit"
              disabled={formSaving}
              style={{
                background: 'var(--accent)', color: '#fff', border: 'none',
                borderRadius: 8, padding: '9px 20px',
                fontFamily: "'TW Cen MT', 'Century Gothic'", fontWeight: 600, fontSize: 13,
                cursor: formSaving ? 'not-allowed' : 'pointer',
                opacity: formSaving ? 0.7 : 1,
              }}
            >
              {formSaving ? 'Čuvam...' : 'Sačuvaj snapshot'}
            </button>
          </form>
        </div>
      )}

      {/* ── Summary cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: 12,
      }}>
        {[
          { label: 'DANA PRAĆENJA',    value: daysTracked,        icon: '📅', color: 'var(--accent)'   },
          { label: 'PROSEK / DAN',     value: avgPerDay,           icon: '📊', color: 'var(--green)',  sub: 'završenih taskova' },
          { label: 'TREND (7 DANA)',   value: trendLabel,          icon: '📈', color: trendColor       },
          { label: 'UKUPNO ZAVRŠENO',  value: `+${totalCompleted}`,icon: '✅', color: 'var(--green)',  sub: 'od starta praćenja' },
        ].map(c => (
          <div key={c.label} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 16,
          }}>
            <div style={{ fontFamily: "'DM Mono'", fontSize: 10, color: 'var(--textMuted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              {c.icon} {c.label}
            </div>
            <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: isMobile ? 17 : 22, color: c.color, lineHeight: 1.2 }}>
              {c.value}
            </div>
            {c.sub && (
              <div style={{ fontFamily: "'TW Cen MT', 'Century Gothic'", fontSize: 11, color: 'var(--textMuted)', marginTop: 3 }}>
                {c.sub}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Burn-down chart ── */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: isMobile ? '16px' : '20px 24px',
      }}>
        <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
          Burn-down
        </h3>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <span style={{ fontFamily: "'TW Cen MT', 'Century Gothic'", fontSize: 12, color: 'var(--textMuted)' }}>
            <span style={{ color: 'var(--green)', fontWeight: 700 }}>●</span> Stvarni napredak
          </span>
          <span style={{ fontFamily: "'TW Cen MT', 'Century Gothic'", fontSize: 12, color: 'var(--textSubtle)' }}>
            ╌╌ Idealni napredak
          </span>
        </div>

        <div ref={containerRef} style={{ position: 'relative' }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            style={{ width: '100%', height: 'auto', overflow: 'visible', cursor: 'crosshair', display: 'block' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setTooltip(null)}
          >
            {/* Y grid + labels */}
            {yTicks.map(val => (
              <g key={val}>
                <line
                  x1={PAD.left} y1={yScale(val).toFixed(1)}
                  x2={PAD.left + innerW} y2={yScale(val).toFixed(1)}
                  stroke="var(--border)" strokeWidth="1"
                />
                <text
                  x={PAD.left - 6} y={yScale(val) + 4}
                  textAnchor="end" fontSize="11" fill="var(--textSubtle)" fontFamily="DM Mono"
                >
                  {val}
                </text>
              </g>
            ))}

            {/* X axis labels */}
            {sorted.map((s, i) => {
              if (i % showEvery !== 0 && i !== sorted.length - 1) return null
              return (
                <text
                  key={s.date}
                  x={xScale(i).toFixed(1)} y={PAD.top + innerH + 18}
                  textAnchor="middle" fontSize="10" fill="var(--textSubtle)" fontFamily="DM Mono"
                >
                  {fmtDateShort(s.date)}
                </text>
              )
            })}

            {/* Ideal line */}
            <path d={toPath(idealPts)} fill="none" stroke="var(--textSubtle)" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.55" />

            {/* Actual line */}
            <path d={toPath(actualPts)} fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

            {/* Data point dots */}
            {actualPts.map((p, i) => (
              <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="4" fill="var(--green)" stroke="var(--surface)" strokeWidth="2" />
            ))}

            {/* Hover crosshair */}
            {tooltip && (
              <>
                <line
                  x1={actualPts.find(p => p.snap.date === tooltip.snap.date)?.x || 0}
                  y1={PAD.top}
                  x2={actualPts.find(p => p.snap.date === tooltip.snap.date)?.x || 0}
                  y2={PAD.top + innerH}
                  stroke="var(--accent)" strokeWidth="1" strokeDasharray="3 2" opacity="0.5"
                />
              </>
            )}
          </svg>

          {/* Tooltip box */}
          {tooltip && (() => {
            const TOOLTIP_W = 152
            const maxX = containerRef.current?.offsetWidth ?? 600
            const left = Math.min(Math.max(tooltip.screenX - TOOLTIP_W / 2, 4), maxX - TOOLTIP_W - 4)
            return (
              <div style={{
                position: 'absolute',
                top: Math.max(tooltip.screenY - 100, 4),
                left,
                width: TOOLTIP_W,
                background: 'var(--surfaceAlt)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '10px 12px',
                pointerEvents: 'none',
                zIndex: 10,
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              }}>
                <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: 'var(--text)', fontWeight: 600, marginBottom: 8 }}>
                  {fmtDate(tooltip.snap.date)}
                </div>
                {[
                  { label: 'Preostalo',   val: tooltip.remaining,        color: 'var(--text)'     },
                  { label: 'Završeno',    val: tooltip.snap.done,        color: 'var(--green)'    },
                  { label: 'Testing',     val: tooltip.snap.testing,     color: 'var(--amber)'    },
                  { label: 'In Progress', val: tooltip.snap.inprog,      color: 'var(--accent)'   },
                  { label: 'To Do',       val: tooltip.snap.todo,        color: 'var(--textMuted)'},
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontFamily: "'TW Cen MT', 'Century Gothic'", fontSize: 12, color: 'var(--textMuted)' }}>{r.label}</span>
                    <span style={{ fontFamily: "'DM Mono'", fontSize: 12, color: r.color, fontWeight: 600 }}>{r.val}</span>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      </div>

      {/* ── Daily table ── */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
            Dnevni pregled
          </h3>
        </div>

        {/* Header row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: cols,
          padding: '8px 16px',
          background: 'var(--surfaceAlt)',
          borderBottom: '1px solid var(--border)',
        }}>
          {headers.map(h => (
            <div key={h} style={{ fontFamily: "'DM Mono'", fontSize: 10, color: 'var(--textMuted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {h}
            </div>
          ))}
        </div>

        {/* Data rows */}
        {tableRows.map(({ snap, delta }) => {
          const isToday = snap.date === today
          const deltaPos = delta != null && delta > 0
          const deltaNeg = delta != null && delta < 0
          return (
            <div key={snap.date} style={{
              display: 'grid',
              gridTemplateColumns: cols,
              padding: '9px 16px',
              borderBottom: '1px solid var(--border)',
              background: isToday ? 'rgba(79,142,247,0.06)' : 'transparent',
              alignItems: 'center',
            }}>
              {/* Datum */}
              <div style={{ fontFamily: "'DM Mono'", fontSize: 12, color: isToday ? 'var(--accent)' : 'var(--text)', fontWeight: isToday ? 700 : 400 }}>
                {fmtDate(snap.date)}{isToday ? ' ·' : ''}
              </div>
              {/* Završeno */}
              <div style={{ fontFamily: "'DM Mono'", fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>
                {snap.done}
              </div>
              {/* Testing — desktop only */}
              {!isMobile && (
                <div style={{ fontFamily: "'DM Mono'", fontSize: 13, color: 'var(--amber)' }}>
                  {snap.testing}
                </div>
              )}
              {/* In Progress */}
              <div style={{ fontFamily: "'DM Mono'", fontSize: 13, color: 'var(--accent)' }}>
                {snap.inprog}
              </div>
              {/* To Do */}
              <div style={{ fontFamily: "'DM Mono'", fontSize: 13, color: 'var(--textMuted)' }}>
                {snap.todo}
              </div>
              {/* Utrošeno — desktop only */}
              {!isMobile && (
                <div style={{ fontFamily: "'DM Mono'", fontSize: 12, color: 'var(--textMuted)' }}>
                  {snap.total_spent != null ? `${Number(snap.total_spent).toFixed(1)}h` : '—'}
                </div>
              )}
              {/* Δ Promena */}
              <div style={{
                fontFamily: "'DM Mono'",
                fontSize: 12,
                fontWeight: 600,
                color: deltaPos ? 'var(--green)' : deltaNeg ? 'var(--red)' : 'var(--textSubtle)',
              }}>
                {delta == null ? '—' : deltaPos ? `+${delta} ✓` : deltaNeg ? `${delta}` : '±0'}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
