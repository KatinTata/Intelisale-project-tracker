import { fmtHours } from '../utils.js'
import { useWindowSize } from '../hooks/useWindowSize.js'

function MetricCard({ label, value, subtitle, valueColor, isMobile }) {
  return (
    <div className="glass-card" style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: isMobile ? '12px' : '16px',
      transition: 'all 0.2s ease',
      cursor: 'default',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.borderColor = 'var(--borderHover)'
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = ''
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = ''
      }}>
      <div style={{
        fontFamily: "'DM Mono'",
        fontSize: isMobile ? 9 : 10,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--textMuted)',
        marginBottom: isMobile ? 4 : 8,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>{label}</div>
      <div style={{
        fontFamily: 'Syne',
        fontSize: isMobile ? 20 : 28,
        fontWeight: 700,
        color: valueColor || 'var(--text)',
        lineHeight: 1,
        marginBottom: 4,
      }}>{value}</div>
      {!isMobile && (
        <div style={{ fontSize: 12, color: 'var(--textMuted)', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>{subtitle}</div>
      )}
    </div>
  )
}

export default function MetricCards({ data, isClient }) {
  const { total, done, inprog, testing, todo, totalEst, totalSpent, overTasks } = data
  const { isMobile, isTablet } = useWindowSize()

  const donePct = total > 0 ? Math.round(done / total * 100) : 0
  const diffSec = totalSpent - totalEst
  const absDiffH = Math.abs(diffSec / 3600).toFixed(1)
  const absDiffPct = totalEst > 0 ? Math.abs(Math.round((diffSec / totalEst) * 100)) : 0
  const isOver = diffSec > 0

  if (isClient) {
    const clientCols = isMobile ? 'repeat(2, 1fr)' : 'repeat(5, minmax(0, 1fr))'
    return (
      <div style={{ display: 'grid', gridTemplateColumns: clientCols, gap: isMobile ? 8 : 12 }}>
        <MetricCard isMobile={isMobile} label="Ukupno taskova" value={total} subtitle="projekti i subtask" />
        <MetricCard isMobile={isMobile} label="Završeno" value={`${done} (${donePct}%)`} subtitle={`od ${total} ukupno`} valueColor="var(--green)" />
        <MetricCard isMobile={isMobile} label="Testing" value={testing} subtitle="čeka QA / u testu" valueColor="var(--amber)" />
        <MetricCard isMobile={isMobile} label="In Progress" value={inprog} subtitle="aktivno u radu" valueColor="var(--accent)" />
        <MetricCard isMobile={isMobile} label="To Do" value={todo} subtitle="To Do / Grooming / Estimated" valueColor="var(--textMuted)" />
      </div>
    )
  }

  const cols = isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(4, 1fr)' : 'repeat(9, minmax(0, 1fr))'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: cols, gap: isMobile ? 8 : 12 }}>
      <MetricCard isMobile={isMobile} label="Ukupno taskova" value={total} subtitle="projekti i subtask" />
      <MetricCard isMobile={isMobile} label="Završeno" value={`${done} (${donePct}%)`} subtitle={`od ${total} ukupno`} valueColor="var(--green)" />
      <MetricCard isMobile={isMobile} label="Testing" value={testing} subtitle="čeka QA / u testu" valueColor="var(--amber)" />
      <MetricCard isMobile={isMobile} label="In Progress" value={inprog} subtitle="aktivno u radu" valueColor="var(--accent)" />
      <MetricCard isMobile={isMobile} label="To Do" value={todo} subtitle="To Do / Grooming / Estimated" valueColor="var(--textMuted)" />
      <MetricCard isMobile={isMobile} label="Estimacija" value={fmtHours(totalEst)} subtitle="originalna procena" valueColor="var(--accent)" />
      <MetricCard isMobile={isMobile} label="Utrošeno" value={fmtHours(totalSpent)} subtitle="logovano vreme" valueColor="var(--accent)" />
      <MetricCard
        isMobile={isMobile}
        label="Razlika"
        value={`${absDiffH}h`}
        subtitle={`${absDiffPct}% ${isOver ? 'iznad' : 'ispod'} estimacije`}
        valueColor={isOver ? 'var(--red)' : 'var(--green)'}
      />
      <MetricCard
        isMobile={isMobile}
        label="Prekoračenja"
        value={overTasks.length}
        subtitle="taskova >15% over"
        valueColor={overTasks.length > 0 ? 'var(--red)' : 'var(--green)'}
      />
    </div>
  )
}
