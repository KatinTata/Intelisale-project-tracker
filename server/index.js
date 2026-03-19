import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import rateLimit from 'express-rate-limit'
import { authMiddleware } from './auth.js'
import authRoutes from './routes/auth.js'
import projectRoutes from './routes/projects.js'
import jiraRoutes from './routes/jira.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json())

const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 })
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/projects', authMiddleware, projectRoutes)
app.use('/api/jira', authMiddleware, jiraRoutes)

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../client/dist')
  app.use(express.static(distPath))
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')))
}

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
