const BASE = '/api'

function getToken() {
  return localStorage.getItem('jt_token')
}

async function request(method, path, body) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    localStorage.removeItem('jt_token')
    window.location.href = '/login'
    return
  }

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Greška servera')
  return data
}

export const api = {
  // Auth
  register: (body) => request('POST', '/auth/register', body),
  verify: (body) => request('POST', '/auth/verify', body),
  resendVerification: (body) => request('POST', '/auth/resend-verification', body),
  login: (body) => request('POST', '/auth/login', body),
  me: () => request('GET', '/auth/me'),
  updateJiraConfig: (body) => request('PUT', '/auth/jira-config', body),
  testJiraConnection: (body) => request('POST', '/auth/jira-test', body),
  changePassword: (body) => request('PUT', '/auth/password', body),
  deleteAccount: () => request('DELETE', '/auth/account'),

  // Projects
  getProjects: () => request('GET', '/projects'),
  addProject: (body) => request('POST', '/projects', body),
  archiveProject: (id) => request('DELETE', `/projects/${id}`),
  getArchivedProjects: () => request('GET', '/projects/archived'),
  restoreProject: (id) => request('PUT', `/projects/${id}/restore`),
  permanentDeleteProject: (id) => request('DELETE', `/projects/${id}/permanent`),
  reorderProjects: (ids) => request('PUT', '/projects/reorder', { ids }),

  // Jira
  getEpic: (key) => request('GET', `/jira/epic/${key}`),
  getTasks: (key) => request('GET', `/jira/tasks/${key}`),

  // Snapshots
  saveSnapshot: (epicKey, body) => request('POST', `/snapshots/${epicKey}`, body),
  getSnapshots: (epicKey) => request('GET', `/snapshots/${epicKey}`),
}
