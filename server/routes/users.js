import { Router } from 'express'
import bcrypt from 'bcrypt'
import db from '../db.js'

const router = Router()

function getUserRole(userId) {
  return db.prepare('SELECT role FROM users WHERE id = ?').get(userId)?.role || 'admin'
}

function requireAdmin(req, res, next) {
  if (getUserRole(req.userId) !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: admin only' })
  }
  next()
}

// GET /api/users — list all client users with their assigned projects
router.get('/', requireAdmin, (req, res) => {
  const users = db.prepare(
    "SELECT id, email, name, role, created_at as createdAt FROM users WHERE role = 'client' ORDER BY created_at ASC"
  ).all()

  const result = users.map(u => {
    const projects = db.prepare(`
      SELECT p.id, p.epic_key as epicKey, p.display_name as displayName
      FROM project_clients pc
      JOIN projects p ON p.id = pc.project_id
      WHERE pc.client_user_id = ?
    `).all(u.id)
    return { ...u, projects }
  })

  res.json(result)
})

// POST /api/users — create a new client user
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Sva polja su obavezna' })
    }
    const hash = await bcrypt.hash(password, 12)
    const result = db.prepare(
      "INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, 'client')"
    ).run(email.toLowerCase(), hash, name)

    const user = db.prepare('SELECT id, email, name, role, created_at as createdAt FROM users WHERE id = ?').get(result.lastInsertRowid)
    res.json({ user: { ...user, projects: [] } })
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Email je već registrovan' })
    }
    console.error(err)
    res.status(500).json({ error: 'Greška servera' })
  }
})

// DELETE /api/users/:id — delete a client user
router.delete('/:id', requireAdmin, (req, res) => {
  const user = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'client'").get(req.params.id)
  if (!user) return res.status(404).json({ error: 'Korisnik nije pronađen' })
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// GET /api/users/:id/projects — list projects assigned to a client
router.get('/:id/projects', requireAdmin, (req, res) => {
  const projects = db.prepare(`
    SELECT p.id, p.epic_key as epicKey, p.display_name as displayName
    FROM project_clients pc
    JOIN projects p ON p.id = pc.project_id
    WHERE pc.client_user_id = ?
  `).all(req.params.id)
  res.json(projects)
})

// POST /api/users/:id/projects — assign project to client
router.post('/:id/projects', requireAdmin, (req, res) => {
  try {
    const { projectId } = req.body
    if (!projectId) return res.status(400).json({ error: 'projectId je obavezan' })

    // Verify project belongs to requesting admin
    const project = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(projectId, req.userId)
    if (!project) return res.status(404).json({ error: 'Projekat nije pronađen' })

    db.prepare('INSERT OR IGNORE INTO project_clients (project_id, client_user_id) VALUES (?, ?)').run(projectId, req.params.id)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Greška servera' })
  }
})

// DELETE /api/users/:id/projects/:projectId — unassign project from client
router.delete('/:id/projects/:projectId', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM project_clients WHERE project_id = ? AND client_user_id = ?').run(req.params.projectId, req.params.id)
  res.json({ ok: true })
})

export default router
