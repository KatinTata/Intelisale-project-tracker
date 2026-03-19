import MetricCards from './MetricCards.jsx'
import DonutChart from './DonutChart.jsx'
import BarChart from './BarChart.jsx'
import OverrunBanner from './OverrunBanner.jsx'
import TaskTable from './TaskTable.jsx'
import ProgressBar from './ui/ProgressBar.jsx'
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

export default function ProjectCard({
  project, data, onDelete, loading, error,
  hasJira, refreshing, lastRefresh, onRefresh,
}) {
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
        <button onClick={onDelete} style={{ color: 'var(--textMuted)', fontFamily: "'TW Cen MT', 'Century Gothic'", fontSize: 13 }}>
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

  const { isMobile, isTablet } = useWindowSize()
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
      <div style={{
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Badge color={statusColor}>{statusLabel}</Badge>
              <span style={{ fontFamily: "'DM Mono'", fontSize: 12, color: 'var(--textMuted)' }}>
                {project.epicKey} · {total} taskova
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
        {hasJira && (
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

      {/* Metric cards */}
      <MetricCards data={{ total, done, inprog, testing, todo, totalEst, totalSpent, overTasks }} />

      {/* Charts row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile || isTablet ? '1fr' : '340px 1fr',
        gap: 16,
      }}>
        {/* Donut */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: isMobile ? '16px' : '20px 24px',
        }}>
          <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
            Distribucija taskova
          </h3>
          <DonutChart segments={donutSegments} size={isMobile ? 150 : 200} innerRadius={isMobile ? 52 : 70} />
        </div>

        {/* Bar chart */}
        <div style={{
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
      </div>

      {/* Overrun banner */}
      <OverrunBanner overTasks={overTasks} />

      {/* Task table */}
      <TaskTable tasks={tasks} overTasks={overTasks} />
    </div>
  )
}
