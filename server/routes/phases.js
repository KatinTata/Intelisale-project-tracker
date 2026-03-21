import { Router } from 'express'
import db from '../db.js'

const router = Router()

// GET /api/phases/:projectId
router.get('/:projectId', (req, res) => {
  const projectId = parseInt(req.params.projectId)
  const phases = db.prepare(
    'SELECT id, name, color, position FROM phases WHERE project_id = ? ORDER BY position ASC, id ASC'
  ).all(projectId)

  const taskRows = db.prepare(
    'SELECT phase_id, task_key FROM phase_tasks WHERE project_id = ? ORDER BY position ASC'
  ).all(projectId)

  const phaseMap = {}
  for (const phase of phases) phaseMap[phase.id] = { ...phase, taskKeys: [] }
  for (const row of taskRows) {
    if (phaseMap[row.phase_id]) phaseMap[row.phase_id].taskKeys.push(row.task_key)
  }

  res.json({ phases: Object.values(phaseMap) })
})

// POST /api/phases/:projectId — create new phase
router.post('/:projectId', (req, res) => {
  const projectId = parseInt(req.params.projectId)
  const { name, color = '#4F8EF7' } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'name je obavezan' })

  const maxPos = db.prepare('SELECT MAX(position) as m FROM phases WHERE project_id = ?').get(projectId)?.m ?? -1
  const result = db.prepare(
    'INSERT INTO phases (project_id, name, color, position) VALUES (?, ?, ?, ?)'
  ).run(projectId, name.trim(), color, maxPos + 1)

  res.json({ phase: { id: result.lastInsertRowid, name: name.trim(), color, position: maxPos + 1, taskKeys: [] } })
})

// PUT /api/phases/:phaseId — rename / recolor
router.put('/:phaseId', (req, res) => {
  const phaseId = parseInt(req.params.phaseId)
  const phase = db.prepare('SELECT * FROM phases WHERE id = ?').get(phaseId)
  if (!phase) return res.status(404).json({ error: 'Faza nije pronađena' })

  const { name, color, position } = req.body
  db.prepare('UPDATE phases SET name = ?, color = ?, position = ? WHERE id = ?')
    .run(name ?? phase.name, color ?? phase.color, position ?? phase.position, phaseId)

  res.json({ ok: true })
})

// DELETE /api/phases/:phaseId — delete phase (tasks go to unassigned)
router.delete('/:phaseId', (req, res) => {
  db.prepare('DELETE FROM phases WHERE id = ?').run(parseInt(req.params.phaseId))
  res.json({ ok: true })
})

// POST /api/phases/:projectId/assign — assign task to phase (phaseId null = unassigned)
router.post('/:projectId/assign', (req, res) => {
  const projectId = parseInt(req.params.projectId)
  const { taskKey, phaseId } = req.body
  if (!taskKey) return res.status(400).json({ error: 'taskKey je obavezan' })

  if (phaseId === null || phaseId === undefined) {
    db.prepare('DELETE FROM phase_tasks WHERE project_id = ? AND task_key = ?').run(projectId, taskKey)
  } else {
    db.prepare('INSERT OR REPLACE INTO phase_tasks (phase_id, project_id, task_key) VALUES (?, ?, ?)')
      .run(phaseId, projectId, taskKey)
  }

  res.json({ ok: true })
})

// POST /api/phases/:projectId/reorder — reorder phases
router.post('/:projectId/reorder', (req, res) => {
  const { phases } = req.body
  if (!Array.isArray(phases)) return res.status(400).json({ error: 'phases je obavezan array' })

  const update = db.prepare('UPDATE phases SET position = ? WHERE id = ?')
  db.transaction(() => { for (const { id, position } of phases) update.run(position, id) })()

  res.json({ ok: true })
})

export default router
