import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import db from '../db.js'
import { authMiddleware } from '../auth.js'
import { encryptToken, makeJiraAuth, jiraGet } from '../jiraClient.js'

const router = Router()

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

// Public routes
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Sva polja su obavezna' })
    }
    const hash = await bcrypt.hash(password, 12)
    const stmt = db.prepare('INSERT INTO users (email, password, name) VALUES (?, ?, ?)')
    const result = stmt.run(email.toLowerCase(), hash, name)
    const user = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(result.lastInsertRowid)
    const token = signToken(user.id)
    res.json({ token, user })
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Email je već registrovan' })
    }
    res.status(500).json({ error: 'Greška servera' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email?.toLowerCase())
    if (!user) return res.status(401).json({ error: 'Pogrešan email ili lozinka' })

    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(401).json({ error: 'Pogrešan email ili lozinka' })

    const token = signToken(user.id)
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, jiraUrl: user.jira_url, jiraEmail: user.jira_email },
    })
  } catch {
    res.status(500).json({ error: 'Greška servera' })
  }
})

// Protected routes
router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, email, name, jira_url, jira_email FROM users WHERE id = ?').get(req.userId)
  if (!user) return res.status(404).json({ error: 'Korisnik nije pronađen' })
  res.json({ user: { id: user.id, email: user.email, name: user.name, jiraUrl: user.jira_url, jiraEmail: user.jira_email } })
})

router.put('/jira-config', authMiddleware, async (req, res) => {
  try {
    const { jiraUrl, jiraEmail, jiraToken } = req.body
    let encryptedToken = null
    if (jiraToken) {
      encryptedToken = encryptToken(jiraToken)
    } else {
      const existing = db.prepare('SELECT jira_token FROM users WHERE id = ?').get(req.userId)
      encryptedToken = existing?.jira_token || null
    }
    db.prepare('UPDATE users SET jira_url = ?, jira_email = ?, jira_token = ? WHERE id = ?')
      .run(jiraUrl, jiraEmail, encryptedToken, req.userId)
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Greška servera' })
  }
})

router.post('/jira-test', authMiddleware, async (req, res) => {
  try {
    const { jiraUrl, jiraEmail, jiraToken } = req.body
    const auth = makeJiraAuth(jiraEmail, jiraToken)
    const data = await jiraGet(jiraUrl, '/myself', auth)
    res.json({ ok: true, displayName: data.displayName })
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message })
  }
})

router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId)
    const match = await bcrypt.compare(oldPassword, user.password)
    if (!match) return res.status(400).json({ error: 'Pogrešna trenutna lozinka' })
    const hash = await bcrypt.hash(newPassword, 12)
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, req.userId)
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Greška servera' })
  }
})

router.delete('/account', authMiddleware, async (req, res) => {
  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.userId)
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Greška servera' })
  }
})

export default router
