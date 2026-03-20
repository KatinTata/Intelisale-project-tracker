import { useState } from 'react'
import { fmtHours } from '../utils.js'

const COMP_COLORS = {
  BACK:    'var(--accent)',
  WEB:     'var(--green)',
  TESTING: 'var(--amber)',
  DB:      '#A78BFA',
}

function getCompColor(name) {
  return COMP_COLORS[(name || '').toUpperCase()] || 'var(--textMuted)'
}

export default function ComponentBreakdown({ data = [] }) {
  const [tooltip, setTooltip] = useState(null)

  if (data.length === 0) {
    return (
      <div style={{ color: 'var(--textMuted)', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
        Nema podataka o komponentama
      </div>
    )
  }

  const totalSpentAll = data[0]?.totalSpentAll || 0

  return (
    <div>
      {/* Total */}
      <div style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>
        Ukupno logovano: <span style={{ fontFamily: "'DM Mono'", color: 'var(--accent)' }}>{fmtHours(totalSpentAll)}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
        {data.map(d => {
          const color = getCompColor(d.name)
          const barPct = d.pct * 100

          return (
            <div
              key={d.name}
              style={{ display: 'flex', alignItems: 'center', gap: 10 }}
              onMouseEnter={e => {
                const rect = e.currentTarget.getBoundingClientRect()
                setTooltip({ d, top: rect.top })
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              {/* Component badge */}
              <div style={{ width: 72, flexShrink: 0 }}>
                <span style={{
                  fontFamily: "'DM Mono'",
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: `color-mix(in srgb, ${color} 15%, transparent)`,
                  color,
                  border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
                  display: 'inline-block',
                }}>
                  {d.name}
                </span>
              </div>

              {/* Bar */}
              <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${barPct}%`, background: color, borderRadius: 4, transition: 'width 0.5s ease', opacity: 0.85 }} />
              </div>

              {/* Hours */}
              <div style={{ width: 44, flexShrink: 0, fontFamily: "'DM Mono'", fontSize: 11, color: 'var(--textMuted)', textAlign: 'right' }}>
                {fmtHours(d.totalSpent)}
              </div>

              {/* Percent */}
              <div style={{ width: 36, flexShrink: 0, fontFamily: "'DM Mono'", fontSize: 11, color, textAlign: 'right' }}>
                {Math.round(barPct)}%
              </div>
            </div>
          )
        })}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          top: tooltip.top - 8,
          left: 0,
          transform: 'translate(calc(50vw - 50%), -100%)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '7px 12px',
          fontSize: 12,
          fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
          color: 'var(--text)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          zIndex: 100,
        }}>
          {fmtHours(tooltip.d.totalSpent)} od ukupno {fmtHours(totalSpentAll)}
          <span style={{ color: 'var(--textSubtle)', margin: '0 6px' }}>·</span>
          {Math.round(tooltip.d.pct * 100)}%
          <span style={{ color: 'var(--textSubtle)', margin: '0 6px' }}>·</span>
          {tooltip.d.taskCount} {tooltip.d.taskCount === 1 ? 'task' : 'taska'}
        </div>
      )}
    </div>
  )
}
