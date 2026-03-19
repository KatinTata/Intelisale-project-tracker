import { useState } from 'react'
import Badge from './ui/Badge.jsx'
import ProgressBar from './ui/ProgressBar.jsx'
import { fmtHours, getStatusCategory } from '../utils.js'

function statusColor(name) {
  const cat = getStatusCategory(name)
  if (cat === 'done') return 'green'
  if (cat === 'inprog') return 'blue'
  if (name === 'On Hold') return 'amber'
  return 'gray'
}

const COL = '130px 1fr 130px 160px 80px 100px'

function TaskRow({ task, expanded, onToggle }) {
  const pct = task.est > 0 ? Math.min(task.spent / task.est, 2) : 0
  const barColor = task.over ? 'var(--red)' : 'var(--accent)'

  return (
    <>
      <div
        onClick={onToggle}
        style={{
          display: 'grid',
          gridTemplateColumns: COL,
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          cursor: task.subtasks?.length ? 'pointer' : 'default',
          background: task.over ? 'var(--redTint)' : 'transparent',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { if (!task.over) e.currentTarget.style.background = 'var(--surfaceAlt)' }}
        onMouseLeave={e => { if (!task.over) e.currentTarget.style.background = 'transparent' }}
      >
        {/* ID */}
        <div>
          <div style={{
            fontFamily: "'DM Mono'",
            fontSize: 13,
            color: task.over ? 'var(--red)' : 'var(--accent)',
            fontWeight: 500,
          }}>{task.key}</div>
          {task.over && (
            <div style={{ fontSize: 10, color: 'var(--red)', fontFamily: "'DM Mono'", marginTop: 2 }}>
              +{task.overPct}% prekoračenje
            </div>
          )}
        </div>

        {/* Summary */}
        <div style={{
          fontFamily: "'TW Cen MT', 'Century Gothic'",
          fontSize: 13,
          color: 'var(--text)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          paddingRight: 8,
        }}>
          {task.subtasks?.length > 0 && (
            <span style={{ marginRight: 6, opacity: 0.5 }}>{expanded ? '▼' : '▶'}</span>
          )}
          {task.summary}
        </div>

        {/* Status */}
        <div><Badge color={statusColor(task.status)}>{task.status}</Badge></div>

        {/* Progress */}
        <div style={{ paddingRight: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11, color: 'var(--textMuted)' }}>
            <span style={{ fontFamily: "'DM Mono'" }}>{task.est > 0 ? `${Math.round(pct * 100)}%` : '–'}</span>
          </div>
          {task.est > 0 && <ProgressBar value={pct} color={barColor} height={6} />}
        </div>

        {/* Est */}
        <div style={{ fontFamily: "'DM Mono'", fontSize: 12, color: 'var(--textMuted)' }}>
          {task.est > 0 ? fmtHours(task.est) : '–'}
        </div>

        {/* Spent */}
        <div style={{
          fontFamily: "'DM Mono'",
          fontSize: 12,
          color: task.over ? 'var(--red)' : task.spent > 0 ? 'var(--green)' : 'var(--textMuted)',
        }}>
          {task.spent > 0 ? fmtHours(task.spent) : '–'}
        </div>
      </div>

      {/* Subtasks */}
      {expanded && task.subtasks?.map(sub => (
        <div key={sub.key} style={{
          display: 'grid',
          gridTemplateColumns: '130px 1fr 130px 160px 80px 100px',
          alignItems: 'center',
          padding: '8px 16px 8px 48px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surfaceAlt)',
        }}>
          <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: 'var(--textMuted)' }}>{sub.key}</div>
          <div style={{ fontSize: 12, color: 'var(--textMuted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', gap: 6, alignItems: 'center' }}>
            {sub.components?.length > 0 && <Badge color="gray">{sub.components[0]}</Badge>}
            <span>{sub.summary}</span>
          </div>
          <div><Badge color={statusColor(sub.status)}>{sub.status}</Badge></div>
          <div />
          <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: 'var(--textMuted)' }}>
            {sub.timeoriginalestimate > 0 ? fmtHours(sub.timeoriginalestimate) : '–'}
          </div>
          <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: 'var(--textMuted)' }}>
            {sub.timespent > 0 ? fmtHours(sub.timespent) : '–'}
          </div>
        </div>
      ))}
    </>
  )
}

export default function TaskTable({ tasks = [], overTasks = [] }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState({})

  const overKeys = new Set(overTasks.map(t => t.key))

  const filtered = tasks.filter(t => {
    const matchSearch = !search || t.key.toLowerCase().includes(search.toLowerCase()) || t.summary.toLowerCase().includes(search.toLowerCase())
    if (!matchSearch) return false
    if (filter === 'done') return t.statusCategory === 'done'
    if (filter === 'testing') return t.statusCategory === 'testing'
    if (filter === 'inprog') return t.statusCategory === 'inprog'
    if (filter === 'todo') return t.statusCategory === 'todo'
    if (filter === 'over') return overKeys.has(t.key)
    return true
  })

  const counts = {
    all: tasks.length,
    done: tasks.filter(t => t.statusCategory === 'done').length,
    testing: tasks.filter(t => t.statusCategory === 'testing').length,
    inprog: tasks.filter(t => t.statusCategory === 'inprog').length,
    todo: tasks.filter(t => t.statusCategory === 'todo').length,
    over: overTasks.length,
  }

  const filterPills = [
    { key: 'all', label: `Svi ${counts.all}` },
    { key: 'done', label: `✅ Završeni ${counts.done}` },
    { key: 'testing', label: `🧪 Testing ${counts.testing}` },
    { key: 'inprog', label: `🔄 In Progress ${counts.inprog}` },
    { key: 'todo', label: `📋 To Do ${counts.todo}` },
    { key: 'over', label: `⚠️ Prekoračenje ${counts.over}` },
  ]

  function toggleExpand(key) {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Taskovi</span>
            <span style={{ fontFamily: "'DM Mono'", fontSize: 12, color: 'var(--textMuted)' }}>({tasks.length})</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              placeholder="🔍 Pretraži taskove..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '6px 12px',
                color: 'var(--text)',
                fontSize: 13,
                fontFamily: "'TW Cen MT', 'Century Gothic'",
                width: 200,
              }}
            />
            {filterPills.map(p => (
              <button
                key={p.key}
                onClick={() => setFilter(p.key)}
                style={{
                  fontFamily: "'TW Cen MT', 'Century Gothic'",
                  fontSize: 12,
                  padding: '5px 12px',
                  borderRadius: 20,
                  border: filter === p.key ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: filter === p.key ? 'rgba(79,142,247,0.1)' : 'transparent',
                  color: filter === p.key ? 'var(--accent)' : 'var(--textMuted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >{p.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: COL,
        padding: '8px 16px',
        background: 'var(--surfaceAlt)',
        borderBottom: '1px solid var(--border)',
        fontSize: 11,
        fontFamily: "'DM Mono'",
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'var(--textMuted)',
      }}>
        <div>ID</div>
        <div>Naziv</div>
        <div>Status</div>
        <div>Napredak</div>
        <div>Est.</div>
        <div>Utrošeno</div>
      </div>

      {/* Rows */}
      {filtered.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--textMuted)', fontFamily: "'TW Cen MT', 'Century Gothic'" }}>
          Nema taskova
        </div>
      ) : (
        filtered.map(task => (
          <TaskRow
            key={task.key}
            task={task}
            expanded={!!expanded[task.key]}
            onToggle={() => toggleExpand(task.key)}
          />
        ))
      )}
    </div>
  )
}
