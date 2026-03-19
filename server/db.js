import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = process.env.DATA_DIR || path.join(__dirname, '../data')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const db = new Database(path.join(dataDir, 'tracker.db'))

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    name        TEXT NOT NULL,
    role        TEXT DEFAULT 'admin',
    jira_url    TEXT,
    jira_email  TEXT,
    jira_token  TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

// Migrations for existing DBs
try { db.exec(`ALTER TABLE projects ADD COLUMN archived INTEGER DEFAULT 0`) } catch {}
try { db.exec(`ALTER TABLE projects ADD COLUMN archived_at TEXT`) } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'admin'`) } catch {}
try { db.exec(`ALTER TABLE projects ADD COLUMN filter_type TEXT DEFAULT 'epic'`) } catch {}
try { db.exec(`ALTER TABLE projects ADD COLUMN filter_jql TEXT`) } catch {}
try { db.exec(`ALTER TABLE projects ADD COLUMN filter_meta TEXT`) } catch {}

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    epic_key     TEXT NOT NULL,
    display_name TEXT,
    position     INTEGER DEFAULT 0,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, epic_key)
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS project_clients (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id     INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    client_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(project_id, client_user_id)
  )
`)

export default db
