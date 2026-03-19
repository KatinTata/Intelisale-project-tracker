import { Router } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req, res) => {
  const projects = db.prepare(
    'SELECT id, epic_key as epicKey, display_name as displayName, position FROM projects WHERE user_id = ? AND (archived IS NULL OR archived = 0) ORDER BY position ASC, id ASC'
  ).all(req.userId)
  res.json(projects)
})

router.post('/', (req, res) => {
  try {
    const { epicKey, displayName } = req.body
    if (!epicKey) return res.status(400).json({ error: 'epicKey je obavezan' })

    const maxPos = db.prepare('SELECT MAX(position) as m FROM projects WHERE user_id = ?').get(req.userId)
    const position = (maxPos?.m ?? -1) + 1

    const result = db.prepare(
      'INSERT INTO projects (user_id, epic_key, display_name, position) VALUES (?, ?, ?, ?)'
    ).run(req.userId, epicKey.trim().toUpperCase(), displayName || null, position)

    const project = db.prepare(
      'SELECT id, epic_key as epicKey, display_name as displayName, position FROM projects WHERE id = ?'
    ).get(result.lastInsertRowid)

    res.json({ project })
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Projekat već postoji' })
    }
    res.status(500).json({ error: 'Greška servera' })
  }
})

// Archive (soft delete)
router.delete('/:id', (req, res) => {
  const project = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(req.params.id, req.userId)
  if (!project) return res.status(404).json({ error: 'Projekat nije pronađen' })
  const now = new Date().toISOString()
  db.prepare('UPDATE projects SET archived = 1, archived_at = ? WHERE id = ?').run(now, req.params.id)
  res.json({ ok: true })
})

// Get archived projects
router.get('/archived', (req, res) => {
  const projects = db.prepare(
    'SELECT id, epic_key as epicKey, display_name as displayName, archived_at as archivedAt FROM projects WHERE user_id = ? AND archived = 1 ORDER BY archived_at DESC'
  ).all(req.userId)
  res.json(projects)
})

// Restore from archive
router.put('/:id/restore', (req, res) => {
  const project = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(req.params.id, req.userId)
  if (!project) return res.status(404).json({ error: 'Projekat nije pronađen' })
  db.prepare('UPDATE projects SET archived = 0, archived_at = NULL WHERE id = ?').run(req.params.id)
  const restored = db.prepare(
    'SELECT id, epic_key as epicKey, display_name as displayName, position FROM projects WHERE id = ?'
  ).get(req.params.id)
  res.json({ project: restored })
})

// Permanent delete
router.delete('/:id/permanent', (req, res) => {
  const project = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(req.params.id, req.userId)
  if (!project) return res.status(404).json({ error: 'Projekat nije pronađen' })
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

router.put('/reorder', (req, res) => {
  try {
    const { ids } = req.body
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids mora biti niz' })

    const update = db.prepare('UPDATE projects SET position = ? WHERE id = ? AND user_id = ?')
    const updateMany = db.transaction((ids) => {
      ids.forEach((id, idx) => update.run(idx, id, req.userId))
    })
    updateMany(ids)
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Greška servera' })
  }
})

export default router
