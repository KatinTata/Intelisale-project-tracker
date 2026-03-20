import { useState, useEffect } from 'react'
import MetricCards from './MetricCards.jsx'
import DonutChart from './DonutChart.jsx'
import BarChart from './BarChart.jsx'
import OverrunBanner from './OverrunBanner.jsx'
import TaskTable from './TaskTable.jsx'
import Badge from './ui/Badge.jsx'
import { fmtHours } from '../utils.js'
import { useWindowSize } from '../hooks/useWindowSize.js'

function fmtLastRefresh(date) {
  if (!date) return null
  const diff = Math.floor((Date.now() - date) / 1000)
  if (diff < 60) return 'upravo'
  if (diff < 3600) return `pre ${Math.floor(diff / 60)} min`
  return `pre ${Math.floor(diff / 3600)}h`
}

function jiraLink(jiraUrl, key) {
  if (!jiraUrl) return null
  const base = jiraUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
  return `https://${base}/browse/${key}`
}

function changeIcon(type, toStatus) {
  if (type === 'new') return '🆕'
  if (type === 'spent') return '⏱️'
  if (type === 'est') return '📐'
  if (type === 'status') {
    if (['Resolved', 'Closed', 'Done'].includes(toStatus)) return '✅'
    if (['For Testing', 'TESTING STARTED'].includes(toStatus)) return '🧪'
    if (['For Grooming', 'To Do', 'Estimated'].includes(toStatus)) return '📋'
    return '🔄'
  }
  return '•'
}

function changeColor(type, toStatus) {
  if (type === 'new') return 'var(--accent)'
  if (type === 'spent') return 'var(--textMuted)'
  if (type === 'est') return 'var(--textMuted)'
  if (type === 'status') {
    if (['Resolved', 'Closed', 'Done'].includes(toStatus)) return 'var(--green)'
    if (['For Testing', 'TESTING STARTED'].includes(toStatus)) return 'var(--amber)'
    return 'var(--accent)'
  }
  return 'var(--textMuted)'
}

function computeChanges(data, previousData) {
  if (!previousData?.tasks) return []
  const prevMap = {}
  previousData.tasks.forEach(t => { prevMap[t.key] = t })
  const changes = []
  for (const task of data.tasks) {
    const prev = prevMap[task.key]
    if (!prev) {
      changes.push({ type: 'new', key: task.key, summary: task.summary })
    } else {
      if (prev.status !== task.status) {
        changes.push({ type: 'status', key: task.key, summary: task.summary, from: prev.status, to: task.status })
      }
      if (Math.abs(task.est - prev.est) > 300) {
        changes.push({ type: 'est', key: task.key, summary: task.summary, from: prev.est, to: task.est })
      }
      if (task.spent - prev.spent > 300) {
        changes.push({ type: 'spent', key: task.key, summary: task.summary, diff: task.spent - prev.spent })
      }
    }
  }
  return changes
}

function ChangesFeed({ data, previousData, previousTime, jiraUrl, onClose }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  const changes = computeChanges(data, previousData)
  if (changes.length === 0) return null

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        background: 'var(--surfaceAlt)',
        borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
          📊 {changes.length} {changes.length === 1 ? 'promena' : changes.length < 5 ? 'promene' : 'promena'} od poslednjeg osvežavanja
        </span>
        {previousTime && (
          <span style={{ fontFamily: "'DM Mono'", fontSize: 11, color: 'var(--textSubtle)' }}>
            pre {fmtLastRefresh(previousTime)}
          </span>
        )}
        <button
          onClick={() => { setDismissed(true); onClose?.() }}
          style={{ marginLeft: 'auto', width: 22, height: 22, borderRadius: '50%', border: '1px solid var(--border)', background: 'transparent', color: 'var(--textMuted)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >×</button>
      </div>

      {/* Change rows */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {changes.map((c, i) => {
          const link = jiraLink(jiraUrl, c.key)
          const color = changeColor(c.type, c.to)
          return (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 16px',
              borderBottom: i < changes.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{changeIcon(c.type, c.to)}</span>
              {link ? (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontFamily: "'DM Mono'", fontSize: 12, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                >{c.key}</a>
              ) : (
                <span style={{ fontFamily: "'DM Mono'", fontSize: 12, color: 'var(--accent)', fontWeight: 600, flexShrink: 0 }}>{c.key}</span>
              )}
              <span style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 13, color: 'var(--textMuted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                {c.summary}
              </span>
              <span style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 12, fontWeight: 600, color, flexShrink: 0, marginLeft: 'auto' }}>
                {c.type === 'new'    && 'Novi task'}
                {c.type === 'status' && <>{c.from} <span style={{ color: 'var(--textSubtle)' }}>→</span> {c.to}</>}
                {c.type === 'est'    && <>{fmtHours(c.from)} <span style={{ color: 'var(--textSubtle)' }}>→</span> {fmtHours(c.to)}</>}
                {c.type === 'spent'  && `+${fmtHours(c.diff)} utrošeno`}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ProjectCard({
  project, data, onArchive, loading, error,
  hasJira, refreshing, lastRefresh, onRefresh,
  previousData, previousTime, isClient, onOpenMessages, jiraUrl,
}) {
  const { isMobile, isTablet } = useWindowSize()

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--textMuted)', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
        Učitavam podatke iz Jire...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>❌</div>
        <div style={{ color: 'var(--red)', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", marginBottom: 8 }}>{error}</div>
        <button onClick={onArchive} style={{ color: 'var(--textMuted)', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 13 }}>
          Ukloni projekat
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--textMuted)', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>
        Nema podataka
      </div>
    )
  }

  const { tasks, totalEst, totalSpent, done, inprog, testing, todo, total, overTasks } = data

  const donePct = total > 0 ? done / total : 0
  const inprogPct = total > 0 ? inprog / total : 0
  const testingPct = total > 0 ? testing / total : 0

  const statusLabel = donePct >= 0.8 ? 'active' : donePct >= 0.4 ? 'paused' : 'active'
  const statusColor = donePct >= 0.8 ? 'green' : donePct >= 0.4 ? 'amber' : 'blue'

  const barData = tasks
    .filter(t => t.est > 0)
    .map(t => ({ label: t.key, est: t.est, spent: t.spent }))

  const donutSegments = [
    { value: done,    color: 'var(--green)',      label: 'Završeno'    },
    { value: testing, color: 'var(--amber)',      label: 'Testing'     },
    { value: inprog,  color: 'var(--accent)',     label: 'In Progress' },
    { value: todo,    color: 'var(--textSubtle)', label: 'To Do'       },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Project header */}
      <div className="glass-card" style={{
        padding: isMobile ? '16px' : '20px 24px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
      }}>
        {/* Top row: name/status left, progress right */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
        }}>
          <div>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: isMobile ? 18 : 24, color: 'var(--text)', marginBottom: 8 }}>
              {project.displayName || project.epicKey}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Badge color={statusColor}>{statusLabel}</Badge>
              <FilterBadge project={project} />
              <span style={{ fontFamily: "'DM Mono'", fontSize: 12, color: 'var(--textMuted)' }}>
                {total} taskova
              </span>
            </div>
          </div>

          <div style={isMobile ? { width: '100%' } : { flex: '0 0 320px' }}>
            {/* Percentages row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 20, color: 'var(--green)' }}>{Math.round(donePct * 100)}%</span>
                <span style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 11, color: 'var(--textMuted)' }}>završeno</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 20, color: 'var(--amber)' }}>{Math.round(testingPct * 100)}%</span>
                <span style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 11, color: 'var(--textMuted)' }}>testing</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 20, color: 'var(--accent)' }}>{Math.round(inprogPct * 100)}%</span>
                <span style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 11, color: 'var(--textMuted)' }}>in progress</span>
              </div>
            </div>

            {/* Multi-segment progress bar */}
            <div style={{ height: 10, background: 'var(--border)', borderRadius: 5, overflow: 'hidden', display: 'flex' }}>
              {donePct > 0 && <div style={{ width: `${donePct * 100}%`, background: 'var(--green)', transition: 'width 0.6s ease' }} />}
              {testingPct > 0 && <div style={{ width: `${testingPct * 100}%`, background: 'var(--amber)', transition: 'width 0.6s ease' }} />}
              {inprogPct > 0 && <div style={{ width: `${inprogPct * 100}%`, background: 'var(--accent)', opacity: 0.7, transition: 'width 0.6s ease' }} />}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 12, marginTop: 7, flexWrap: 'wrap' }}>
              {[
                { color: 'var(--green)',      label: 'Završeno',    count: done    },
                { color: 'var(--amber)',      label: 'Testing',     count: testing },
                { color: 'var(--accent)',     label: 'In Progress', count: inprog  },
                { color: 'var(--textSubtle)', label: 'To Do',       count: todo    },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 11, color: 'var(--textMuted)' }}>{s.label}</span>
                  <span style={{ fontFamily: "'DM Mono'", fontSize: 11, color: s.color }}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Refresh strip */}
        {hasJira && !isClient && (
          <div style={{
            borderTop: '1px solid var(--border)',
            marginTop: 16,
            paddingTop: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <button
              onClick={onRefresh}
              disabled={refreshing || loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '6px 14px',
                fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                fontWeight: 600,
                fontSize: 13,
                cursor: refreshing || loading ? 'not-allowed' : 'pointer',
                opacity: refreshing || loading ? 0.7 : 1,
                transition: 'all 0.2s ease',
                minHeight: 36,
              }}
            >
              <span style={{ display: 'inline-block', animation: refreshing || loading ? 'spin 1s linear infinite' : 'none' }}>↻</span>
              Osveži
            </button>

            {lastRefresh && (
              <span style={{ fontFamily: "'DM Mono'", fontSize: 12, color: 'var(--textSubtle)', marginLeft: 'auto' }}>
                {refreshing || loading
                  ? '⏳ Osvežavam...'
                  : `🕐 ${fmtLastRefresh(lastRefresh)}`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Metric cards */}
      <MetricCards data={{ total, done, inprog, testing, todo, totalEst, totalSpent, overTasks }} isClient={isClient} />

      {/* Charts row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isClient ? '1fr' : (isMobile || isTablet ? '1fr' : '340px 1fr'),
        gap: 16,
      }}>
        {/* Donut */}
        <div className="glass-card" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: isMobile ? '16px' : '20px 24px',
        }}>
          <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
            Distribucija taskova
          </h3>
          <DonutChart segments={donutSegments} size={isMobile ? 150 : 200} innerRadius={isMobile ? 52 : 70} horizontal={isClient && !isMobile} />
        </div>

        {/* Bar chart — admin only */}
        {!isClient && (
          <div className="glass-card" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: isMobile ? '16px' : '20px 24px',
            overflow: 'hidden',
          }}>
            <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
              Estimacija vs Utrošeno (top taskovi)
            </h3>
            <div style={{ overflowX: isMobile ? 'auto' : 'hidden' }}>
              <BarChart data={barData} width={isMobile ? 480 : 600} height={isMobile ? 200 : 260} />
            </div>
          </div>
        )}
      </div>

      {/* Changes feed — admin only, below charts */}
      {!isClient && (
        <ChangesFeed
          data={data}
          previousData={previousData}
          previousTime={previousTime}
          jiraUrl={jiraUrl}
        />
      )}

      {/* Overrun banner — admin only */}
      {!isClient && <OverrunBanner overTasks={overTasks} />}

      {/* Task table */}
      <TaskTable tasks={tasks} overTasks={overTasks} isClient={isClient} projectId={project.id} onOpenMessages={onOpenMessages} jiraUrl={jiraUrl} />
    </div>
  )
}

function FilterBadge({ project }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const ft = project.filterType || 'epic'

  if (ft === 'epic') {
    return (
      <span style={{ fontFamily: "'DM Mono'", fontSize: 11, color: 'var(--textMuted)', background: 'var(--surfaceAlt)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px' }}>
        Epic {project.epicKey}
      </span>
    )
  }

  const label = ft === 'jql' ? 'Custom JQL' : 'Kombinovani filteri'
  const tooltip = project.filterJql || ''

  return (
    <span
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span style={{ fontFamily: "'DM Mono'", fontSize: 11, color: 'var(--accent)', background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.25)', borderRadius: 4, padding: '2px 6px', cursor: 'default' }}>
        {label}
      </span>
      {showTooltip && tooltip && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
          padding: '8px 12px', minWidth: 260, maxWidth: 400,
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          fontFamily: "'DM Mono'", fontSize: 11, color: 'var(--textMuted)',
          lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
        }}>
          {tooltip}
        </div>
      )}
    </span>
  )
}
