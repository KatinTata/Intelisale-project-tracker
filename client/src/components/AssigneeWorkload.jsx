import { useState } from 'react'
import { fmtHours } from '../utils.js'

export default function AssigneeWorkload({ data = [] }) {
  const [tooltip, setTooltip] = useState(null)

  if (data.length === 0) {
    return (
      <div style={{ color: 'var(--textMuted)', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
        Taskovi nisu dodeljeni nijednom članu tima
      </div>
    )
  }

  const maxSpent = Math.max(...data.map(d => d.totalSpent)) || 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
      {data.map((d, i) => {
        const fillPct = (d.totalSpent / maxSpent) * 100
        const donePct  = d.totalTasks > 0 ? (d.doneTasks  / d.totalTasks) * 100 : 0
        const inprogPct = d.totalTasks > 0 ? (d.inprogTasks / d.totalTasks) * 100 : 0

        return (
          <div
            key={d.name}
            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
            onMouseEnter={e => {
              const rect = e.currentTarget.getBoundingClientRect()
              setTooltip({ i, name: d.name, done: d.doneTasks, inprog: d.inprogTasks, todo: d.todoTasks, top: rect.top })
            }}
            onMouseLeave={() => setTooltip(null)}
          >
            {/* Name */}
            <div style={{ width: 130, flexShrink: 0, fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {d.name}
            </div>

            {/* Stacked bar */}
            <div style={{ flex: 1, height: 20, background: 'var(--border)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${fillPct}%`, display: 'flex', transition: 'width 0.5s ease' }}>
                {donePct > 0 && (
                  <div style={{ height: '100%', width: `${donePct}%`, background: 'var(--green)', flexShrink: 0 }} />
                )}
                {inprogPct > 0 && (
                  <div style={{ height: '100%', width: `${inprogPct}%`, background: 'var(--amber)', flexShrink: 0 }} />
                )}
                <div style={{ height: '100%', flex: 1, background: 'var(--textSubtle)', opacity: 0.5 }} />
              </div>
            </div>

            {/* Hours */}
            <div style={{ width: 44, flexShrink: 0, fontFamily: "'DM Mono'", fontSize: 11, color: 'var(--textMuted)', textAlign: 'right' }}>
              {fmtHours(d.totalSpent)}
            </div>

            {/* Task count */}
            <div style={{ width: 40, flexShrink: 0, fontFamily: "'DM Mono'", fontSize: 11, color: 'var(--textSubtle)', textAlign: 'right' }}>
              {d.totalTasks}t
            </div>
          </div>
        )
      })}

      {/* Tooltip */}
      {tooltip !== null && (
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
          <span style={{ color: 'var(--green)' }}>Završeno: {tooltip.done}</span>
          <span style={{ color: 'var(--textSubtle)', margin: '0 6px' }}>·</span>
          <span style={{ color: 'var(--amber)' }}>In Progress: {tooltip.inprog}</span>
          <span style={{ color: 'var(--textSubtle)', margin: '0 6px' }}>·</span>
          <span style={{ color: 'var(--textMuted)' }}>Grooming: {tooltip.todo}</span>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, marginTop: 4 }}>
        {[
          { color: 'var(--green)',      label: 'Završeno' },
          { color: 'var(--amber)',      label: 'In Progress' },
          { color: 'var(--textSubtle)', label: 'To Do' },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0, opacity: s.color === 'var(--textSubtle)' ? 0.5 : 1 }} />
            <span style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 11, color: 'var(--textMuted)' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
