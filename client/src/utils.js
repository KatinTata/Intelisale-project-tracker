const DONE    = new Set(['Resolved', 'Closed', 'Done'])
const TESTING = new Set(['For Testing', 'TESTING STARTED', 'On Hold - Testing'])
const IN_PROG = new Set(['In Progress', 'Development', 'Review', 'On Hold'])

export function getStatusCategory(statusName) {
  if (DONE.has(statusName)) return 'done'
  if (TESTING.has(statusName)) return 'testing'
  if (IN_PROG.has(statusName)) return 'inprog'
  return 'todo'
}

export function processEpicData(parents, subtasks) {
  // Build subtask map
  const subMap = {}
  for (const sub of subtasks) {
    const f = sub.fields || {}
    const components = (f.components || []).map(c => c.name)
    subMap[sub.key] = {
      key: sub.key,
      summary: f.summary || '',
      status: f.status?.name || '',
      statusCategory: getStatusCategory(f.status?.name || ''),
      timespent: f.timespent || 0,
      timeoriginalestimate: f.timeoriginalestimate || 0,
      components,
    }
  }

  const tasks = []
  let totalEst = 0
  let totalSpent = 0
  let done = 0
  let inprog = 0
  let testing = 0
  let todo = 0
  const overTasks = []

  for (const parent of parents) {
    const f = parent.fields || {}
    const statusName = f.status?.name || ''
    const statusCat = getStatusCategory(statusName)

    const parentEst = f.timeoriginalestimate || 0
    const parentSpent = f.timespent || 0

    let calcEst = parentEst
    let calcSpent = parentSpent
    const subs = []

    for (const subRef of (f.subtasks || [])) {
      const sub = subMap[subRef.key]
      if (!sub) continue

      // Exclude testing subtasks with 0h
      const isTesting = sub.components.some(c => c.toLowerCase() === 'testing')
      if (isTesting && sub.timespent === 0) continue

      calcEst += sub.timeoriginalestimate
      calcSpent += sub.timespent
      subs.push(sub)
    }

    const over = calcEst > 0 && calcSpent > calcEst * 1.15
    const overPct = calcEst > 0 ? Math.round(((calcSpent - calcEst) / calcEst) * 100) : 0

    const task = {
      key: parent.key,
      summary: f.summary || '',
      status: statusName,
      statusCategory: statusCat,
      est: calcEst,
      spent: calcSpent,
      over,
      overPct,
      subtasks: subs,
    }

    tasks.push(task)
    totalEst += calcEst
    totalSpent += calcSpent

    if (statusCat === 'done') done++
    else if (statusCat === 'testing') testing++
    else if (statusCat === 'inprog') inprog++
    else todo++

    if (over) overTasks.push(task)
  }

  const total = tasks.length

  return { tasks, totalEst, totalSpent, done, inprog, testing, todo, total, overTasks }
}

export function fmtHours(seconds) {
  if (!seconds) return '0.0h'
  return (seconds / 3600).toFixed(1) + 'h'
}

// Demo data for users without Jira config
export const DEMO_PROJECTS = [
  {
    id: 'demo-1',
    epicKey: 'KNJAZ-184',
    displayName: 'Knjaz Miloš B2B Portal',
    demo: true,
    data: {
      tasks: generateDemoTasks('KNJAZ', 48, 20, 4, 24),
      totalEst: 221 * 3600,
      totalSpent: 189.6 * 3600,
      done: 20,
      inprog: 4,
      todo: 24,
      total: 48,
      overTasks: [],
    },
  },
  {
    id: 'demo-2',
    epicKey: 'CRM-169',
    displayName: 'IntelliSale CRM',
    demo: true,
    data: {
      tasks: generateDemoTasks('CRM', 35, 28, 5, 2),
      totalEst: 180 * 3600,
      totalSpent: 195 * 3600,
      done: 28,
      inprog: 5,
      todo: 2,
      total: 35,
      overTasks: [],
    },
  },
  {
    id: 'demo-3',
    epicKey: 'MOB-200',
    displayName: 'Mobile App 2.0',
    demo: true,
    data: {
      tasks: generateDemoTasks('MOB', 22, 8, 7, 7),
      totalEst: 140 * 3600,
      totalSpent: 88 * 3600,
      done: 8,
      inprog: 7,
      todo: 7,
      total: 22,
      overTasks: [],
    },
  },
]

function generateDemoTasks(prefix, total, doneCount, inprogCount, todoCount) {
  const tasks = []
  const statuses = [
    ...Array(doneCount).fill('Resolved'),
    ...Array(inprogCount).fill('In Progress'),
    ...Array(todoCount).fill('For Grooming'),
  ]
  for (let i = 0; i < total; i++) {
    const statusName = statuses[i] || 'For Grooming'
    const est = Math.floor(Math.random() * 14 + 2) * 3600
    const spent = Math.floor(est * (0.5 + Math.random() * 0.8))
    tasks.push({
      key: `${prefix}-${1000 + i}`,
      summary: `Demo task ${i + 1} — sample opis zadatka`,
      status: statusName,
      statusCategory: getStatusCategory(statusName),
      est,
      spent: statusName === 'For Grooming' ? 0 : spent,
      over: false,
      overPct: 0,
      subtasks: [],
    })
  }
  return tasks
}
