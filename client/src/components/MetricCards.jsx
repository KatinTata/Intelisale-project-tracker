import { fmtHours } from '../utils.js'

function MetricCard({ label, value, subtitle, icon, valueColor }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '16px',
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{
            fontFamily: "'DM Mono'",
            fontSize: 10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--textMuted)',
            marginBottom: 8,
          }}>{label}</div>
          <div style={{
            fontFamily: 'Syne',
            fontSize: 28,
            fontWeight: 700,
            color: valueColor || 'var(--text)',
            lineHeight: 1,
            marginBottom: 4,
          }}>{value}</div>
          <div style={{ fontSize: 12, color: 'var(--textMuted)', fontFamily: "'DM Sans'" }}>{subtitle}</div>
        </div>
        <span style={{ fontSize: 20, opacity: 0.7 }}>{icon}</span>
      </div>
    </div>
  )
}

export default function MetricCards({ data }) {
  const { total, done, inprog, testing, todo, totalEst, totalSpent, overTasks } = data

  const donePct = total > 0 ? Math.round(done / total * 100) : 0
  const diffSec = totalSpent - totalEst
  const diffH = (diffSec / 3600).toFixed(1)
  const diffPct = totalEst > 0 ? Math.round((diffSec / totalEst) * 100) : 0
  const diffColor = diffSec <= 0 ? 'var(--green)' : 'var(--red)'
  const diffSign = diffSec > 0 ? '+' : ''

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(9, minmax(0, 1fr))',
      gap: 12,
    }}>
      <MetricCard label="Ukupno taskova" value={total} subtitle="projekti i subtask" icon="📋" />
      <MetricCard label="Završeno" value={`${done} (${donePct}%)`} subtitle={`od ${total} ukupno`} icon="✅" valueColor="var(--green)" />
      <MetricCard label="Testing" value={testing} subtitle="čeka QA / u testu" icon="🧪" valueColor="var(--amber)" />
      <MetricCard label="In Progress" value={inprog} subtitle="aktivno u radu" icon="🔄" valueColor="var(--accent)" />
      <MetricCard label="To Do" value={todo} subtitle="čeka planiranje" icon="📋" valueColor="var(--textMuted)" />
      <MetricCard label="Estimacija" value={fmtHours(totalEst)} subtitle="originalna procena" icon="📐" valueColor="var(--accent)" />
      <MetricCard label="Utrošeno" value={fmtHours(totalSpent)} subtitle="logovano vreme" icon="⏱️" valueColor="var(--accent)" />
      <MetricCard
        label="Razlika"
        value={`${diffSign}${diffH}h`}
        subtitle={`${diffSign}${diffPct}% ${diffSec <= 0 ? 'ispod' : 'iznad'} est.`}
        icon={diffSec <= 0 ? '📉' : '📈'}
        valueColor={diffColor}
      />
      <MetricCard
        label="Prekoračenja"
        value={overTasks.length}
        subtitle="taskova >15% over"
        icon="⚠️"
        valueColor={overTasks.length > 0 ? 'var(--red)' : 'var(--green)'}
      />
    </div>
  )
}
