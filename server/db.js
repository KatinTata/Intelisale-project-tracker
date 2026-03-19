import { DatabaseSync } from 'node:sqlite'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = process.env.DATA_DIR || path.join(__dirname, '../data')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const db = new DatabaseSync(path.join(dataDir, 'tracker.db'))

db.exec(`PRAGMA journal_mode = WAL`)
db.exec(`PRAGMA foreign_keys = ON`)

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    email                 TEXT UNIQUE NOT NULL,
    password              TEXT NOT NULL,
    name                  TEXT NOT NULL,
    jira_url              TEXT,
    jira_email            TEXT,
    jira_token            TEXT,
    verified              INTEGER DEFAULT 0,
    verification_code     TEXT,
    verification_expires  INTEGER,
    created_at            DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

// Migrations for existing DBs
try { db.exec(`ALTER TABLE users ADD COLUMN verified INTEGER DEFAULT 0`) } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN verification_code TEXT`) } catch {}
try { db.exec(`ALTER TABLE users ADD COLUMN verification_expires INTEGER`) } catch {}

db.exec(`
  CREATE TABLE IF NOT EXISTS snapshots (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
    epic_key     TEXT NOT NULL,
    date         TEXT NOT NULL,
    total        INTEGER,
    done         INTEGER,
    testing      INTEGER,
    inprog       INTEGER,
    todo         INTEGER,
    total_est    REAL,
    total_spent  REAL,
    over_count   INTEGER,
    UNIQUE(user_id, epic_key, date)
  )
`)

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

// Wrapper to mimic better-sqlite3 API used throughout the codebase
const dbWrapper = {
  prepare(sql) {
    const stmt = db.prepare(sql)
    return {
      run(...args) {
        return stmt.run(...args)
      },
      get(...args) {
        return stmt.get(...args)
      },
      all(...args) {
        return stmt.all(...args)
      },
    }
  },
  exec(sql) {
    return db.exec(sql)
  },
  transaction(fn) {
    return (...args) => {
      db.exec('BEGIN')
      try {
        fn(...args)
        db.exec('COMMIT')
      } catch (e) {
        db.exec('ROLLBACK')
        throw e
      }
    }
  },
}

export default dbWrapper
