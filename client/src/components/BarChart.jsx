import { useState } from 'react'

export default function BarChart({ data = [], width = 600, height = 260 }) {
  const [tooltip, setTooltip] = useState(null)

  const paddingLeft = 48
  const paddingRight = 16
  const paddingTop = 16
  const paddingBottom = 56
  const chartW = width - paddingLeft - paddingRight
  const chartH = height - paddingTop - paddingBottom

  // Top 12 tasks with estimate
  const filtered = data.filter(d => d.est > 0).slice(0, 12)
  if (filtered.length === 0) return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--textMuted)', fontFamily: "'DM Sans', sans-serif" }}>
      Nema taskova sa estimacijom
    </div>
  )

  const maxVal = Math.max(...filtered.flatMap(d => [d.est, d.spent])) || 1
  const yMax = Math.ceil(maxVal / 3600 / 5) * 5 // round to nearest 5h

  const barGroupW = chartW / filtered.length
  const barW = Math.min(barGroupW * 0.35, 18)
  const gap = barW * 0.5

  // Y grid lines
  const gridLines = 5
  const yTicks = Array.from({ length: gridLines + 1 }, (_, i) => i * (yMax / gridLines))

  function toY(seconds) {
    return chartH - (seconds / 3600 / yMax) * chartH
  }

  function toBarH(seconds) {
    return (seconds / 3600 / yMax) * chartH
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
        <span><span style={{ color: 'var(--accent)' }}>●</span> Estimacija</span>
        <span><span style={{ color: 'var(--green)' }}>●</span> Utrošeno</span>
        <span><span style={{ color: 'var(--red)' }}>●</span> Prekoračenje</span>
      </div>

      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        {/* Y grid lines */}
        {yTicks.map((tick, i) => {
          const y = paddingTop + toY(tick * 3600)
          return (
            <g key={i}>
              <line
                x1={paddingLeft} y1={y}
                x2={paddingLeft + chartW} y2={y}
                stroke="var(--border)" strokeWidth={1}
              />
              <text x={paddingLeft - 4} y={y + 4} textAnchor="end"
                style={{ fontSize: 10, fill: 'var(--textMuted)', fontFamily: "'DM Mono'" }}>
                {tick}h
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {filtered.map((d, i) => {
          const xCenter = paddingLeft + barGroupW * i + barGroupW / 2
          const xEst = xCenter - gap / 2 - barW
          const xSpent = xCenter + gap / 2

          const estH = toBarH(d.est)
          const spentH = toBarH(d.spent)
          const isOver = d.spent > d.est * 1.15
          const spentColor = isOver ? 'var(--red)' : 'var(--green)'

          return (
            <g key={d.label}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.closest('svg').getBoundingClientRect()
                setTooltip({ d, x: xCenter, y: Math.min(paddingTop + toY(Math.max(d.est, d.spent)), chartH - 60) })
              }}
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: 'pointer' }}>

              {/* Est bar */}
              <rect
                x={xEst} y={paddingTop + toY(d.est)}
                width={barW} height={estH}
                rx={2} fill="var(--accent)" opacity={0.85}
              />

              {/* Spent bar */}
              <rect
                x={xSpent} y={paddingTop + toY(d.spent)}
                width={barW} height={spentH}
                rx={2} fill={spentColor} opacity={0.85}
              />

              {/* X label */}
              <text
                x={xCenter} y={paddingTop + chartH + 8}
                textAnchor="end"
                transform={`rotate(-45, ${xCenter}, ${paddingTop + chartH + 8})`}
                style={{ fontSize: 10, fill: 'var(--textMuted)', fontFamily: "'DM Mono'" }}>
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: `${(tooltip.x / width) * 100}%`,
          top: tooltip.y,
          transform: 'translateX(-50%)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 12,
          fontFamily: "'DM Sans', sans-serif",
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          zIndex: 10,
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>{tooltip.d.label}</div>
          <div style={{ color: 'var(--accent)' }}>Est: {(tooltip.d.est / 3600).toFixed(1)}h</div>
          <div style={{ color: tooltip.d.spent > tooltip.d.est * 1.15 ? 'var(--red)' : 'var(--green)' }}>
            Spent: {(tooltip.d.spent / 3600).toFixed(1)}h
          </div>
          {tooltip.d.spent > tooltip.d.est * 1.15 && (
            <div style={{ color: 'var(--red)' }}>
              +{Math.round(((tooltip.d.spent - tooltip.d.est) / tooltip.d.est) * 100)}% prekoračenje
            </div>
          )}
        </div>
      )}
    </div>
  )
}
