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

// GET /api/users — list all non-self users with their assigned projects (clients get projects, admins don't)
router.get('/', requireAdmin, (req, res) => {
  const users = db.prepare(
    'SELECT id, email, name, role, created_at as createdAt FROM users WHERE id != ? ORDER BY role ASC, created_at ASC'
  ).all(req.userId)

  const result = users.map(u => {
    if (u.role === 'client') {
      const projects = db.prepare(`
        SELECT p.id, p.epic_key as epicKey, p.display_name as displayName
        FROM project_clients pc
        JOIN projects p ON p.id = pc.project_id
        WHERE pc.client_user_id = ?
      `).all(u.id)
      return { ...u, projects }
    }
    return { ...u, projects: [] }
  })

  res.json(result)
})

// POST /api/users — create a new user (admin or client)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role = 'client' } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Sva polja su obavezna' })
    }
    if (!['admin', 'client'].includes(role)) {
      return res.status(400).json({ error: 'Nevalidna uloga' })
    }
    const hash = await bcrypt.hash(password, 12)

    let jiraUrl = null, jiraEmail = null, jiraToken = null
    if (role === 'admin') {
      // Copy Jira credentials from the creating admin
      const creator = db.prepare('SELECT jira_url, jira_email, jira_token FROM users WHERE id = ?').get(req.userId)
      jiraUrl = creator?.jira_url || null
      jiraEmail = creator?.jira_email || null
      jiraToken = creator?.jira_token || null
    }

    const result = db.prepare(
      'INSERT INTO users (email, password, name, role, jira_url, jira_email, jira_token) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(email.toLowerCase(), hash, name, role, jiraUrl, jiraEmail, jiraToken)

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

// PUT /api/users/:id — edit user (name, email, role, optional password)
router.put('/:id', requireAdmin, async (req, res) => {
  const target = db.prepare('SELECT id, role FROM users WHERE id = ? AND id != ?').get(req.params.id, req.userId)
  if (!target) return res.status(404).json({ error: 'Korisnik nije pronađen' })

  const { name, email, role, password } = req.body
  if (!name || !email) return res.status(400).json({ error: 'Ime i email su obavezni' })
  if (role && !['admin', 'client'].includes(role)) return res.status(400).json({ error: 'Nevalidna uloga' })

  try {
    const fields = ['name = ?', 'email = ?']
    const values = [name, email.toLowerCase()]

    if (role && role !== target.role) {
      fields.push('role = ?')
      values.push(role)
      // Copy Jira credentials when promoting to admin
      if (role === 'admin') {
        const creator = db.prepare('SELECT jira_url, jira_email, jira_token FROM users WHERE id = ?').get(req.userId)
        fields.push('jira_url = ?', 'jira_email = ?', 'jira_token = ?')
        values.push(creator?.jira_url || null, creator?.jira_email || null, creator?.jira_token || null)
      }
    }

    if (password?.trim()) {
      const hash = await bcrypt.hash(password.trim(), 12)
      fields.push('password = ?')
      values.push(hash)
    }

    values.push(req.params.id)
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values)

    const updated = db.prepare('SELECT id, email, name, role, created_at as createdAt FROM users WHERE id = ?').get(req.params.id)
    const projects = updated.role === 'client'
      ? db.prepare(`SELECT p.id, p.epic_key as epicKey, p.display_name as displayName FROM project_clients pc JOIN projects p ON p.id = pc.project_id WHERE pc.client_user_id = ?`).all(updated.id)
      : []
    res.json({ user: { ...updated, projects } })
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Email je već registrovan' })
    console.error(err)
    res.status(500).json({ error: 'Greška servera' })
  }
})

// DELETE /api/users/:id
router.delete('/:id', requireAdmin, (req, res) => {
  const user = db.prepare('SELECT id FROM users WHERE id = ? AND id != ?').get(req.params.id, req.userId)
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
