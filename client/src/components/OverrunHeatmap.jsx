import { fmtHours } from '../utils.js'

function cardStyle(overPct) {
  if (overPct > 50)  return { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }
  if (overPct > 15)  return { background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }
  return { background: 'var(--greenTint)', border: '1px solid rgba(34,197,94,0.2)' }
}

function pctLabel(overPct) {
  if (overPct > 0)  return { text: `+${overPct}%`, color: 'var(--red)' }
  if (overPct < -2) return { text: `${overPct}% ispod`, color: 'var(--green)' }
  return { text: 'na cilju', color: 'var(--textMuted)' }
}

export default function OverrunHeatmap({ tasks = [] }) {
  const withEst = tasks
    .filter(t => t.est > 0)
    .slice()
    .sort((a, b) => b.overPct - a.overPct)

  if (withEst.length === 0) {
    return (
      <div style={{ color: 'var(--green)', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
        Svi taskovi su u okviru estimacije
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
      {withEst.map(t => {
        const cs = cardStyle(t.overPct)
        const lbl = pctLabel(t.overPct)
        const spentPct = Math.min(t.spent / t.est, 1)
        const barColor = t.overPct > 15 ? 'var(--red)' : 'var(--green)'

        return (
          <div key={t.key} style={{ ...cs, borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {/* Key */}
            <span style={{ fontFamily: "'DM Mono'", fontSize: 11, color: t.overPct > 15 ? 'var(--red)' : 'var(--accent)', fontWeight: 600 }}>
              {t.key}
            </span>

            {/* Summary */}
            <div style={{
              fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
              fontSize: 12,
              color: 'var(--textMuted)',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {t.summary}
            </div>

            {/* Spent / Est label */}
            <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: 'var(--textMuted)', marginTop: 2 }}>
              {fmtHours(t.spent)} / {fmtHours(t.est)}
            </div>

            {/* Bar */}
            <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${spentPct * 100}%`, background: barColor, borderRadius: 2, transition: 'width 0.4s ease' }} />
            </div>

            {/* Percent */}
            <div style={{ fontFamily: "'DM Mono'", fontSize: 11, fontWeight: 600, color: lbl.color }}>
              {lbl.text}
            </div>
          </div>
        )
      })}
    </div>
  )
}
