import { Router } from 'express'
import db from '../db.js'
import { decryptToken, makeJiraAuth, jiraGet, jiraPost, fetchEpicTasks, fetchByJql, fetchSubtasks } from '../jiraClient.js'

const router = Router()

function getUserJira(userId) {
  const user = db.prepare('SELECT jira_url, jira_email, jira_token FROM users WHERE id = ?').get(userId)
  if (!user?.jira_url || !user?.jira_email || !user?.jira_token) return null
  const token = decryptToken(user.jira_token)
  const auth = makeJiraAuth(user.jira_email, token)
  return { jiraUrl: user.jira_url, auth }
}

function getUserRole(userId) {
  return db.prepare('SELECT role FROM users WHERE id = ?').get(userId)?.role || 'admin'
}

function getClientOwnerJira(clientUserId, epicKey) {
  const assignment = db.prepare(`
    SELECT p.user_id as ownerId FROM project_clients pc
    JOIN projects p ON p.id = pc.project_id
    WHERE pc.client_user_id = ? AND p.epic_key = ?
  `).get(clientUserId, epicKey)
  if (!assignment) return null
  return getUserJira(assignment.ownerId)
}

function getClientOwnerJiraByProjectId(clientUserId, projectId) {
  const assignment = db.prepare(`
    SELECT p.user_id as ownerId FROM project_clients pc
    JOIN projects p ON p.id = pc.project_id
    WHERE pc.client_user_id = ? AND p.id = ?
  `).get(clientUserId, projectId)
  if (!assignment) return null
  return getUserJira(assignment.ownerId)
}

router.get('/epic/:epicKey', async (req, res) => {
  try {
    const role = getUserRole(req.userId)
    const jira = role === 'client'
      ? getClientOwnerJira(req.userId, req.params.epicKey)
      : getUserJira(req.userId)
    if (!jira) return res.status(400).json({ error: 'Jira nije konfigurisan' })
    const data = await jiraGet(jira.jiraUrl, `/issue/${req.params.epicKey}`, jira.auth)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/jira/tasks — supports epic, jql, combined filter types
router.post('/tasks', async (req, res) => {
  try {
    const { filterType = 'epic', epicKey, jql, projectId } = req.body
    const role = getUserRole(req.userId)

    let jira
    if (role === 'client') {
      jira = projectId
        ? getClientOwnerJiraByProjectId(req.userId, projectId)
        : getClientOwnerJira(req.userId, epicKey)
    } else {
      jira = getUserJira(req.userId)
    }
    if (!jira) return res.status(400).json({ error: 'Jira nije konfigurisan' })

    let resolvedJql
    if (filterType === 'epic') {
      resolvedJql = `parent = ${epicKey} ORDER BY created ASC`
    } else {
      resolvedJql = jql
    }

    const parents = await fetchByJql(jira.jiraUrl, resolvedJql, jira.auth)

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

// POST /api/jira/test-jql — test a JQL query and return count + preview
router.post('/test-jql', async (req, res) => {
  try {
    const { jql } = req.body
    if (!jql?.trim()) return res.status(400).json({ error: 'JQL je obavezan' })

    const jira = getUserJira(req.userId)
    if (!jira) return res.status(400).json({ error: 'Jira nije konfigurisan' })

    const data = await jiraPost(jira.jiraUrl, '/search/jql', {
      jql,
      fields: ['summary', 'status'],
      maxResults: 5,
    }, jira.auth)

    const preview = (data.issues || []).map(i => ({
      key: i.key,
      summary: i.fields?.summary || '',
      status: i.fields?.status?.name || '',
    }))

    res.json({ count: data.total ?? preview.length, preview })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
