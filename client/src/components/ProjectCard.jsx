import MetricCards from './MetricCards.jsx'
import DonutChart from './DonutChart.jsx'
import BarChart from './BarChart.jsx'
import OverrunBanner from './OverrunBanner.jsx'
import TaskTable from './TaskTable.jsx'
import ProgressBar from './ui/ProgressBar.jsx'
import Badge from './ui/Badge.jsx'
import { fmtHours } from '../utils.js'

export default function ProjectCard({ project, data, onDelete, loading, error }) {
  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--textMuted)', fontFamily: "'DM Sans'" }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
        Učitavam podatke iz Jire...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>❌</div>
        <div style={{ color: 'var(--red)', fontFamily: "'DM Sans'", marginBottom: 8 }}>{error}</div>
        <button onClick={onDelete} style={{ color: 'var(--textMuted)', fontFamily: "'DM Sans'", fontSize: 13 }}>
          Ukloni projekat
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--textMuted)', fontFamily: "'DM Sans'" }}>
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
    { value: done, color: 'var(--green)', label: 'Završeno' },
    { value: testing, color: 'var(--amber)', label: 'Testing' },
    { value: inprog, color: 'var(--accent)', label: 'In Progress' },
    { value: todo, color: 'var(--textSubtle)', label: 'To Do' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Project header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 16,
        padding: '20px 24px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
      }}>
        <div>
          <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 24, color: 'var(--text)', marginBottom: 8 }}>
            {project.displayName || project.epicKey}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Badge color={statusColor}>{statusLabel}</Badge>
            <span style={{ fontFamily: "'DM Mono'", fontSize: 12, color: 'var(--textMuted)' }}>
              {project.epicKey} · {total} taskova
            </span>
          </div>
        </div>

        <div style={{ minWidth: 240, flex: '0 0 280px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, fontFamily: "'DM Sans'" }}>
            <span style={{ color: 'var(--textMuted)' }}>Napredak</span>
            <span style={{ color: 'var(--text)', fontFamily: "'DM Mono'" }}>
              {Math.round(donePct * 100)}%
            </span>
          </div>
          <ProgressBar
            value={donePct}
            secondary
            secondaryValue={inprogPct}
            color="var(--green)"
            secondaryColor="var(--amber)"
            height={10}
          />
          <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, fontFamily: "'DM Sans'", color: 'var(--textMuted)' }}>
            <span>● <span style={{ color: 'var(--green)' }}>Završeno {done}</span></span>
            <span>● <span style={{ color: 'var(--amber)' }}>Testing {testing}</span></span>
            <span>● <span style={{ color: 'var(--accent)' }}>In Progress {inprog}</span></span>
            <span>● <span style={{ color: 'var(--textSubtle)' }}>To Do {todo}</span></span>
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <MetricCards data={{ total, done, inprog, testing, todo, totalEst, totalSpent, overTasks }} />

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16 }}>
        {/* Donut */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '20px 24px',
        }}>
          <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
            Distribucija taskova
          </h3>
          <DonutChart segments={donutSegments} />
        </div>

        {/* Bar chart */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '20px 24px',
          overflow: 'hidden',
        }}>
          <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
            Estimacija vs Utrošeno (top taskovi)
          </h3>
          <BarChart data={barData} width={600} height={260} />
        </div>
      </div>

      {/* Overrun banner */}
      <OverrunBanner overTasks={overTasks} />

      {/* Task table */}
      <TaskTable tasks={tasks} overTasks={overTasks} />
    </div>
  )
}
