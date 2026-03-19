export default function OverrunBanner({ overTasks = [] }) {
  if (overTasks.length === 0) return null

  return (
    <div style={{
      background: '#EF444408',
      border: '1px solid #EF444430',
      borderRadius: 10,
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap',
    }}>
      <span style={{ color: 'var(--red)', fontWeight: 600, fontFamily: "'TW Cen MT', 'Century Gothic'", fontSize: 14 }}>
        ⚠️  {overTasks.length} {overTasks.length === 1 ? 'task prekoračuje' : 'taska prekoračuju'} estimaciju za više od 15%
      </span>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {overTasks.map(t => (
          <span key={t.key} style={{
            background: 'var(--redTint)',
            color: 'var(--red)',
            borderRadius: 6,
            padding: '3px 8px',
            fontFamily: "'DM Mono'",
            fontSize: 12,
          }}>
            {t.key} {t.overPct > 0 ? `+${t.overPct}%` : ''}
          </span>
        ))}
      </div>
    </div>
  )
}
