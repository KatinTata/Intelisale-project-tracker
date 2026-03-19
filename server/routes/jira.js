import { Router } from 'express'
import db from '../db.js'
import { decryptToken, makeJiraAuth, jiraGet, fetchEpicTasks, fetchSubtasks } from '../jiraClient.js'

const router = Router()

function getUserJira(userId) {
  const user = db.prepare('SELECT jira_url, jira_email, jira_token FROM users WHERE id = ?').get(userId)
  if (!user?.jira_url || !user?.jira_email || !user?.jira_token) {
    return null
  }
  const token = decryptToken(user.jira_token)
  const auth = makeJiraAuth(user.jira_email, token)
  return { jiraUrl: user.jira_url, auth }
}

router.get('/epic/:epicKey', async (req, res) => {
  try {
    const jira = getUserJira(req.userId)
    if (!jira) return res.status(400).json({ error: 'Jira nije konfigurisan' })

    const data = await jiraGet(jira.jiraUrl, `/issue/${req.params.epicKey}`, jira.auth)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/tasks/:epicKey', async (req, res) => {
  try {
    const jira = getUserJira(req.userId)
    if (!jira) return res.status(400).json({ error: 'Jira nije konfigurisan' })

    const parents = await fetchEpicTasks(jira.jiraUrl, req.params.epicKey, jira.auth)

    // Collect all subtask keys
    const subKeys = []
    for (const p of parents) {
      if (p.fields?.subtasks?.length) {
        subKeys.push(...p.fields.subtasks.map(s => s.key))
      }
    }

    const subtasks = subKeys.length > 0
      ? await fetchSubtasks(jira.jiraUrl, subKeys, jira.auth)
      : []

    res.json({ parents, subtasks })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
