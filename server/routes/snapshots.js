import { Router } from 'express'
import db from '../db.js'

const router = Router()

// POST /api/snapshots/:epicKey — upsert today's snapshot
router.post('/:epicKey', (req, res) => {
  const userId = req.userId
  const epicKey = req.params.epicKey
  const { total, done, testing, inprog, todo, total_est, total_spent, over_count, date: bodyDate } = req.body
  const date = bodyDate || new Date().toISOString().slice(0, 10)

  db.prepare(`
    INSERT INTO snapshots (user_id, epic_key, date, total, done, testing, inprog, todo, total_est, total_spent, over_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, epic_key, date) DO UPDATE SET
      total       = excluded.total,
      done        = excluded.done,
      testing     = excluded.testing,
      inprog      = excluded.inprog,
      todo        = excluded.todo,
      total_est   = excluded.total_est,
      total_spent = excluded.total_spent,
      over_count  = excluded.over_count
  `).run(userId, epicKey, date, total, done, testing, inprog, todo, total_est, total_spent, over_count)

  res.json({ ok: true })
})

// GET /api/snapshots/:epicKey — all snapshots for this epic
router.get('/:epicKey', (req, res) => {
  const userId = req.userId
  const epicKey = req.params.epicKey

  const snapshots = db.prepare(`
    SELECT * FROM snapshots
    WHERE user_id = ? AND epic_key = ?
    ORDER BY date ASC
  `).all(userId, epicKey)

  res.json({ snapshots })
})

export default router
