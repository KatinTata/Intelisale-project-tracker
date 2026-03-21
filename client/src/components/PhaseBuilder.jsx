import { useState, useEffect, useRef } from 'react'
import { DndContext, DragOverlay, pointerWithin } from '@dnd-kit/core'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { api } from '../api.js'
import PhaseProgress from './PhaseProgress.jsx'

const PHASE_COLORS = ['#4F8EF7', '#22C55E', '#F59E0B', '#A78BFA', '#14B8A6', '#EF4444', '#F97316', '#64748B']
const UNASSIGNED_ID = '__unassigned__'

// ── TaskChip display ──────────────────────────────────────────────────────────

function TaskChip({ task, faded }) {
  const sc = task.statusCategory
  const statusColor = sc === 'done' ? '#22C55E' : sc === 'testing' ? '#F59E0B' : sc === 'inprog' ? '#4F8EF7' : '#6B7A99'
  const statusLabel = sc === 'done' ? 'Done' : sc === 'testing' ? 'Testing' : sc === 'inprog' ? 'In Progress' : 'To Do'

  return (
    <div style={{
      background: 'var(--surfaceAlt)',
      border: '1px solid var(--border)',
      borderRadius: 6,
      padding: '7px 10px',
      opacity: faded ? 0.4 : 1,
      transition: 'opacity 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
        <span style={{ fontFamily: "'DM Mono'", fontSize: 10, fontWeight: 600, color: 'var(--accent)', flexShrink: 0 }}>
          {task.key}
        </span>
        <span style={{
          fontFamily: "'DM Mono'", fontSize: 9, padding: '1px 5px',
          borderRadius: 3, background: `${statusColor}1A`, color: statusColor,
          border: `1px solid ${statusColor}33`, flexShrink: 0, marginLeft: 'auto',
        }}>
          {statusLabel}
        </span>
      </div>
      <div style={{
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: 11, color: 'var(--textMuted)', lineHeight: 1.4,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {task.summary}
      </div>
    </div>
  )
}

// ── DraggableChip ─────────────────────────────────────────────────────────────

function DraggableChip({ task }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.key })
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}>
      <TaskChip task={task} faded={isDragging} />
    </div>
  )
}

// ── DroppablePhaseColumn ──────────────────────────────────────────────────────

function DroppablePhaseColumn({ id, phase, tasks, isUnassigned = false, onRename, onDelete, activeTaskKey }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(phase.name)
  const inputRef = useRef(null)

  const doneTasks = tasks.filter(t => t.statusCategory === 'done').length
  const donePct = tasks.length > 0 ? (doneTasks / tasks.length) * 100 : 0

  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus() }, [editing])

  function commitRename() {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== phase.name) onRename?.(trimmed)
    setEditing(false)
  }

  const borderColor = isOver ? 'var(--accent)' : isUnassigned ? 'var(--border)' : 'var(--border)'
  const borderStyle = isUnassigned ? 'dashed' : 'solid'

  return (
    <div
      ref={setNodeRef}
      style={{
        display: 'flex', flexDirection: 'column', gap: 6,
        minWidth: 210, maxWidth: 240, flexShrink: 0,
        background: isOver ? 'rgba(79,142,247,0.04)' : 'var(--surface)',
        border: `1px ${borderStyle} ${borderColor}`,
        borderRadius: 10, padding: '10px',
        transition: 'border-color 0.15s, background 0.15s',
        alignSelf: 'flex-start',
      }}
    >
      {/* Column header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 24 }}>
        {!isUnassigned && (
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: phase.color, flexShrink: 0 }} />
        )}

        {editing ? (
          <input
            ref={inputRef}
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setEditName(phase.name); setEditing(false) } }}
            style={{
              flex: 1, background: 'var(--bg)', border: '1px solid var(--accent)',
              borderRadius: 4, padding: '2px 6px', color: 'var(--text)',
              fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
              fontSize: 12, fontWeight: 600, outline: 'none',
            }}
          />
        ) : (
          <span
            onDoubleClick={() => !isUnassigned && setEditing(true)}
            title={isUnassigned ? undefined : 'Dvoklik za rename'}
            style={{
              flex: 1, fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
              fontSize: 12, fontWeight: 600, color: isUnassigned ? 'var(--textMuted)' : 'var(--text)',
              cursor: isUnassigned ? 'default' : 'text',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {phase.name}
          </span>
        )}

        <span style={{
          fontFamily: "'DM Mono'", fontSize: 10, color: 'var(--textMuted)',
          background: 'var(--surfaceAlt)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '1px 6px', flexShrink: 0,
        }}>
          {tasks.length}
        </span>

        {!isUnassigned && !editing && (
          <>
            <button
              onClick={() => setEditing(true)}
              title="Preimenuj"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--textSubtle)', padding: '1px 2px', fontSize: 11, lineHeight: 1, flexShrink: 0, transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--textSubtle)'}
            >✏️</button>
            <button
              onClick={() => { if (window.confirm(`Obrisati fazu "${phase.name}"?\nTaskovi će biti prebačeni u Neraspoređeno.`)) onDelete?.() }}
              title="Obriši fazu"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--textSubtle)', padding: '1px 2px', fontSize: 11, lineHeight: 1, flexShrink: 0, transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--textSubtle)'}
            >🗑️</button>
          </>
        )}
      </div>

      {/* Progress bar */}
      {!isUnassigned && tasks.length > 0 && (
        <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${donePct}%`, background: 'var(--green)', transition: 'width 0.4s' }} />
        </div>
      )}

      {/* Task chips */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minHeight: 40 }}>
        {tasks.map(task => <DraggableChip key={task.key} task={task} />)}
        {tasks.length === 0 && isUnassigned && !activeTaskKey && (
          <div style={{
            padding: '14px 8px', textAlign: 'center',
            fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: 11, color: 'var(--textSubtle)', fontStyle: 'italic',
          }}>
            ← prevuci u fazu
          </div>
        )}
      </div>
    </div>
  )
}

// ── Phase charts ──────────────────────────────────────────────────────────────

function PhaseCharts({ phases, tasksByPhase }) {
  const withTasks = phases.filter(p => (tasksByPhase[p.id] || []).length > 0)
  if (withTasks.length === 0) return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
      <PhaseStatBar phases={withTasks} tasksByPhase={tasksByPhase} mode="pct" />
      <PhaseStatBar phases={withTasks} tasksByPhase={tasksByPhase} mode="count" />
    </div>
  )
}

function PhaseStatBar({ phases, tasksByPhase, mode }) {
  return (
    <div style={{ background: 'var(--surfaceAlt)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 11, color: 'var(--textMuted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        {mode === 'pct' ? 'Napredak po fazama' : 'Taskovi po fazama'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {phases.map(phase => {
          const pt = tasksByPhase[phase.id] || []
          const total = pt.length
          const done = pt.filter(t => t.statusCategory === 'done').length
          const inprog = pt.filter(t => t.statusCategory === 'inprog' || t.statusCategory === 'testing').length
          const todo = total - done - inprog
          const donePct = total > 0 ? (done / total) * 100 : 0
          const inprogPct = total > 0 ? (inprog / total) * 100 : 0
          const todoPct = total > 0 ? (todo / total) * 100 : 0
          const label = mode === 'pct' ? `${Math.round(donePct)}%` : `${done}/${total}`

          return (
            <div key={phase.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: phase.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 11, color: 'var(--textMuted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {phase.name}
                </span>
                <span style={{ fontFamily: "'DM Mono'", fontSize: 10, color: 'var(--textMuted)', flexShrink: 0 }}>
                  {label}
                </span>
              </div>
              <div style={{ height: 8, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                {donePct > 0 && <div style={{ width: `${donePct}%`, background: 'var(--green)' }} />}
                {inprogPct > 0 && <div style={{ width: `${inprogPct}%`, background: 'var(--amber)' }} />}
                {todoPct > 0 && <div style={{ width: `${todoPct}%`, background: 'var(--textSubtle)', opacity: 0.35 }} />}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── AddPhasePanel ─────────────────────────────────────────────────────────────

function AddPhasePanel({ onAdd, onCancel }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(PHASE_COLORS[0])
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function submit() {
    if (name.trim()) onAdd(name.trim(), color)
  }

  return (
    <div style={{
      minWidth: 200, flexShrink: 0,
      border: '1px solid var(--accent)', borderRadius: 10, padding: '10px',
      background: 'var(--surface)', alignSelf: 'flex-start',
    }}>
      <input
        ref={inputRef}
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onCancel() }}
        placeholder="Naziv faze"
        style={{
          width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
          borderRadius: 6, padding: '5px 8px', color: 'var(--text)',
          fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: 12, outline: 'none', marginBottom: 8, boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
        {PHASE_COLORS.map(c => (
          <div
            key={c}
            onClick={() => setColor(c)}
            style={{
              width: 18, height: 18, borderRadius: '50%', background: c,
              border: `2px solid ${color === c ? 'var(--text)' : 'transparent'}`,
              cursor: 'pointer', transition: 'border-color 0.15s', flexShrink: 0,
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={submit}
          style={{
            flex: 1, padding: '5px 0', background: 'var(--accent)', color: '#fff',
            border: 'none', borderRadius: 6, cursor: 'pointer',
            fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: 12, fontWeight: 600,
          }}
        >
          Dodaj
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '5px 10px', background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--textMuted)', borderRadius: 6, cursor: 'pointer',
            fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 12,
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

// ── Main PhaseBuilder ─────────────────────────────────────────────────────────

export default function PhaseBuilder({ projectId, tasks, isClient }) {
  const [phases, setPhases] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTask, setActiveTask] = useState(null)
  const [addingPhase, setAddingPhase] = useState(false)

  useEffect(() => { loadPhases() }, [projectId])

  async function loadPhases() {
    setLoading(true)
    try {
      const data = await api.getPhases(projectId)
      setPhases(data.phases || [])
    } catch { setPhases([]) }
    setLoading(false)
  }

  // Build taskKey → phaseId map
  const taskPhaseMap = {}
  for (const phase of phases) {
    for (const key of (phase.taskKeys || [])) taskPhaseMap[key] = phase.id
  }

  // Tasks grouped by column
  const tasksByPhase = {}
  for (const phase of phases) tasksByPhase[phase.id] = []
  tasksByPhase[UNASSIGNED_ID] = []
  for (const task of tasks) {
    const pid = taskPhaseMap[task.key]
    if (pid && tasksByPhase[pid]) tasksByPhase[pid].push(task)
    else tasksByPhase[UNASSIGNED_ID].push(task)
  }

  async function handleDragEnd({ active, over }) {
    setActiveTask(null)
    if (!over) return
    const taskKey = active.id
    const toId = over.id
    const fromPhaseId = taskPhaseMap[taskKey]
    const fromColId = fromPhaseId ? fromPhaseId.toString() : UNASSIGNED_ID
    if (toId === fromColId) return

    const newPhaseId = toId === UNASSIGNED_ID ? null : parseInt(toId)

    // Optimistic update
    setPhases(prev => {
      const next = prev.map(p => ({ ...p, taskKeys: p.taskKeys.filter(k => k !== taskKey) }))
      if (newPhaseId !== null) {
        return next.map(p => p.id === newPhaseId ? { ...p, taskKeys: [...p.taskKeys, taskKey] } : p)
      }
      return next
    })

    try {
      await api.assignTaskToPhase(projectId, { taskKey, phaseId: newPhaseId })
    } catch { loadPhases() }
  }

  async function addPhase(name, color) {
    try {
      const data = await api.createPhase(projectId, { name, color })
      setPhases(prev => [...prev, data.phase])
      setAddingPhase(false)
    } catch {}
  }

  async function renamePhase(phaseId, name) {
    const phase = phases.find(p => p.id === phaseId)
    if (!phase) return
    setPhases(prev => prev.map(p => p.id === phaseId ? { ...p, name } : p))
    try { await api.updatePhase(phaseId, { name, color: phase.color, position: phase.position }) }
    catch { loadPhases() }
  }

  async function deletePhase(phaseId) {
    setPhases(prev => prev.filter(p => p.id !== phaseId))
    try { await api.deletePhase(phaseId) }
    catch { loadPhases() }
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--textMuted)', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 13 }}>
        Učitavam faze...
      </div>
    )
  }

  // Client view — PhaseProgress only
  if (isClient) {
    return <PhaseProgress phases={phases} tasksByPhase={tasksByPhase} />
  }

  // Empty state
  if (phases.length === 0 && !addingPhase) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>
          Nema definisanih faza
        </div>
        <div style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 13, color: 'var(--textMuted)' }}>
          Svi taskovi su u Neraspoređeno. Kreiraj faze da organizuješ projekat.
        </div>
        <button
          onClick={() => setAddingPhase(true)}
          style={{
            marginTop: 4, padding: '8px 20px', background: 'var(--accent)', color: '#fff',
            border: 'none', borderRadius: 8, cursor: 'pointer',
            fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
            fontWeight: 600, fontSize: 13, transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          + Kreiraj prvu fazu
        </button>
      </div>
    )
  }

  return (
    <div>
      <DndContext
        collisionDetection={pointerWithin}
        onDragStart={({ active }) => setActiveTask(tasks.find(t => t.key === active.id) || null)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveTask(null)}
      >
        {/* Kanban board */}
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '4px 0 12px', alignItems: 'flex-start' }}>
          {phases.map(phase => (
            <DroppablePhaseColumn
              key={phase.id}
              id={phase.id.toString()}
              phase={phase}
              tasks={tasksByPhase[phase.id] || []}
              onRename={name => renamePhase(phase.id, name)}
              onDelete={() => deletePhase(phase.id)}
              activeTaskKey={activeTask?.key}
            />
          ))}

          {/* Unassigned column */}
          <DroppablePhaseColumn
            id={UNASSIGNED_ID}
            phase={{ name: 'Neraspoređeno', color: 'var(--textSubtle)' }}
            tasks={tasksByPhase[UNASSIGNED_ID] || []}
            isUnassigned
            activeTaskKey={activeTask?.key}
          />

          {/* Add phase */}
          <div style={{ minWidth: 200, flexShrink: 0 }}>
            {addingPhase ? (
              <AddPhasePanel onAdd={addPhase} onCancel={() => setAddingPhase(false)} />
            ) : (
              <button
                onClick={() => setAddingPhase(true)}
                style={{
                  width: '100%', padding: '10px', background: 'transparent',
                  border: '1px dashed var(--border)', borderRadius: 10, cursor: 'pointer',
                  color: 'var(--textMuted)', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                  fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--textMuted)' }}
              >
                + Nova faza
              </button>
            )}
          </div>
        </div>

        {/* Drag overlay */}
        <DragOverlay dropAnimation={null}>
          {activeTask && (
            <div style={{ width: 220, opacity: 0.9, transform: 'rotate(2deg)', pointerEvents: 'none' }}>
              <TaskChip task={activeTask} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Phase charts */}
      <PhaseCharts phases={phases} tasksByPhase={tasksByPhase} />
    </div>
  )
}
