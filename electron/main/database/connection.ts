import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { getMigrations } from './migrations'

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

export function initDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'nexus.db')

  fs.mkdirSync(path.dirname(dbPath), { recursive: true })

  db = new Database(dbPath)

  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')
  db.pragma('foreign_keys = ON')

  runMigrations(db)
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

function runMigrations(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT DEFAULT (datetime('now'))
    )
  `)

  const migrations = getMigrations()

  const applied = new Set(
    (database.prepare('SELECT name FROM _migrations').all() as Array<{ name: string }>)
      .map((row) => row.name)
  )

  const insert = database.prepare('INSERT INTO _migrations (name) VALUES (?)')

  for (const migration of migrations) {
    if (!applied.has(migration.name)) {
      database.exec(migration.sql)
      insert.run(migration.name)
      console.log(`[DB] Applied migration: ${migration.name}`)
    }
  }
}
