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

function ChangeSummaryBanner({ data, previousData, previousTime, onClose }) {
  if (!previousData) return null

  const changes = []

  const doneDiff = data.done - previousData.done
  const testingDiff = data.testing - previousData.testing
  const inprogDiff = data.inprog - previousData.inprog
  const spentDiff = data.totalSpent - previousData.totalSpent
  const overDiff = data.overTasks.length - previousData.overTasks.length

  if (doneDiff !== 0) changes.push({
    icon: '✅',
    text: `${doneDiff > 0 ? '+' : ''}${doneDiff} završen${Math.abs(doneDiff) === 1 ? 'o' : 'ih'}`,
    color: doneDiff > 0 ? 'var(--green)' : 'var(--textMuted)',
  })
  if (testingDiff !== 0) changes.push({
    icon: '🧪',
    text: `${testingDiff > 0 ? '+' : ''}${testingDiff} testing`,
    color: testingDiff > 0 ? 'var(--amber)' : 'var(--textMuted)',
  })
  if (inprogDiff !== 0) changes.push({
    icon: '🔄',
    text: `${inprogDiff > 0 ? '+' : ''}${inprogDiff} in progress`,
    color: 'var(--accent)',
  })
  if (Math.abs(spentDiff) > 60) changes.push({
    icon: '⏱️',
    text: `${spentDiff > 0 ? '+' : ''}${fmtHours(Math.abs(spentDiff))} utrošeno`,
    color: 'var(--textMuted)',
  })
  if (overDiff !== 0) changes.push({
    icon: '⚠️',
    text: `${overDiff > 0 ? '+' : ''}${overDiff} prekoračenje`,
    color: overDiff > 0 ? 'var(--red)' : 'var(--green)',
  })

  if (changes.length === 0) return null

  return (
    <div style={{
      background: 'var(--surfaceAlt)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap',
    }}>
      <span style={{ fontFamily: "'TW Cen MT', 'Century Gothic'", fontSize: 12, color: 'var(--textMuted)', flexShrink: 0 }}>
        Promene od poslednjeg osvežavanja{previousTime ? ` (pre ${fmtLastRefresh(previousTime)})` : ''}:
      </span>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flex: 1 }}>
        {changes.map((c, i) => (
          <span key={i} style={{
            fontFamily: "'TW Cen MT', 'Century Gothic'",
            fontSize: 13,
            fontWeight: 600,
            color: c.color,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            {c.icon} {c.text}
          </span>
        ))}
      </div>
      <button
        onClick={onClose}
        style={{
          marginLeft: 'auto',
          flexShrink: 0,
          width: 24,
          height: 24,
          borderRadius: '50%',
          border: '1px solid var(--border)',
          background: 'transparent',
          color: 'var(--textMuted)',
          fontSize: 14,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  )
}

export default function ProjectCard({
  project, data, onArchive, loading, error,
  hasJira, refreshing, lastRefresh, onRefresh,
  previousData, previousTime, isClient, onOpenMessages,
}) {
  const [changeBannerDismissed, setChangeBannerDismissed] = useState(false)
  const { isMobile, isTablet } = useWindowSize()

  useEffect(() => {
    setChangeBannerDismissed(false)
  }, [previousTime])

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--textMuted)', fontFamily: "'TW Cen MT', 'Century Gothic'" }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
        Učitavam podatke iz Jire...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>❌</div>
        <div style={{ color: 'var(--red)', fontFamily: "'TW Cen MT', 'Century Gothic'", marginBottom: 8 }}>{error}</div>
        <button onClick={onArchive} style={{ color: 'var(--textMuted)', fontFamily: "'TW Cen MT', 'Century Gothic'", fontSize: 13 }}>
          Ukloni projekat
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--textMuted)', fontFamily: "'TW Cen MT', 'Century Gothic'" }}>
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
                <span style={{ fontFamily: "'TW Cen MT', 'Century Gothic'", fontSize: 11, color: 'var(--textMuted)' }}>završeno</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 20, color: 'var(--amber)' }}>{Math.round(testingPct * 100)}%</span>
                <span style={{ fontFamily: "'TW Cen MT', 'Century Gothic'", fontSize: 11, color: 'var(--textMuted)' }}>testing</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 20, color: 'var(--accent)' }}>{Math.round(inprogPct * 100)}%</span>
                <span style={{ fontFamily: "'TW Cen MT', 'Century Gothic'", fontSize: 11, color: 'var(--textMuted)' }}>in progress</span>
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
                  <span style={{ fontFamily: "'TW Cen MT', 'Century Gothic'", fontSize: 11, color: 'var(--textMuted)' }}>{s.label}</span>
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
                fontFamily: "'TW Cen MT', 'Century Gothic'",
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

      {/* Change summary banner */}
      {!changeBannerDismissed && (
        <ChangeSummaryBanner
          data={data}
          previousData={previousData}
          previousTime={previousTime}
          onClose={() => setChangeBannerDismissed(true)}
        />
      )}

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

      {/* Overrun banner — admin only */}
      {!isClient && <OverrunBanner overTasks={overTasks} />}

      {/* Task table */}
      <TaskTable tasks={tasks} overTasks={overTasks} isClient={isClient} projectId={project.id} onOpenMessages={onOpenMessages} />
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
