import crypto from 'crypto'
import axios from 'axios'

const ALGO = 'aes-256-cbc'

export function encryptToken(text) {
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

export function decryptToken(stored) {
  const [ivHex, encHex] = stored.split(':')
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
  const iv = Buffer.from(ivHex, 'hex')
  const enc = Buffer.from(encHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGO, key, iv)
  const decrypted = Buffer.concat([decipher.update(enc), decipher.final()])
  return decrypted.toString('utf8')
}

export function makeJiraAuth(email, token) {
  return 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64')
}

function jiraClient(jiraUrl, auth) {
  const baseUrl = jiraUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
  return axios.create({
    baseURL: `https://${baseUrl}/rest/api/3`,
    headers: {
      Authorization: auth,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })
}

export async function jiraPost(jiraUrl, path, body, auth) {
  try {
    const res = await jiraClient(jiraUrl, auth).post(path, body)
    return res.data
  } catch (err) {
    const msg = err.response?.data ? JSON.stringify(err.response.data) : err.message
    throw new Error(`Jira API error ${err.response?.status ?? ''}: ${msg}`)
  }
}

export async function jiraGet(jiraUrl, path, auth) {
  try {
    const res = await jiraClient(jiraUrl, auth).get(path)
    return res.data
  } catch (err) {
    const msg = err.response?.data ? JSON.stringify(err.response.data) : err.message
    throw new Error(`Jira API error ${err.response?.status ?? ''}: ${msg}`)
  }
}

const TASK_FIELDS = [
  'summary', 'status', 'timespent', 'timeoriginalestimate',
  'subtasks', 'components', 'issuetype', 'parent', 'issuelinks',
]

export async function fetchEpicTasks(jiraUrl, epicKey, auth) {
  const jql = `parent = ${epicKey} ORDER BY created ASC`
  const fields = TASK_FIELDS
  let results = []
  let token = null

  do {
    const body = { jql, fields, maxResults: 100, ...(token ? { nextPageToken: token } : {}) }
    const data = await jiraPost(jiraUrl, '/search/jql', body, auth)
    results.push(...(data.issues || []))
    token = data.isLast ? null : (data.nextPageToken || null)
  } while (token)

  return results
}

export async function fetchByJql(jiraUrl, jql, auth) {
  const fields = TASK_FIELDS
  let results = []
  let token = null
  do {
    const body = { jql, fields, maxResults: 100, ...(token ? { nextPageToken: token } : {}) }
    const data = await jiraPost(jiraUrl, '/search/jql', body, auth)
    results.push(...(data.issues || []))
    token = data.isLast ? null : (data.nextPageToken || null)
  } while (token)
  return results
}

export async function fetchSubtasks(jiraUrl, subKeys, auth) {
  const fields = TASK_FIELDS
  const subs = []

  for (let i = 0; i < subKeys.length; i += 50) {
    const batch = subKeys.slice(i, i + 50)
    const jql = `issuekey in (${batch.join(',')})`
    const data = await jiraPost(jiraUrl, '/search/jql', { jql, fields, maxResults: 50 }, auth)
    subs.push(...(data.issues || []))
  }

  return subs
}
