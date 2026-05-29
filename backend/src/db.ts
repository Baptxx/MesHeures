import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.DB_PATH ?? path.join(__dirname, '../../mesheures.db')

const db = new Database(DB_PATH)

db.exec(`
  CREATE TABLE IF NOT EXISTS entries (
    date        TEXT PRIMARY KEY,  -- YYYY-MM-DD
    arrivee     TEXT NOT NULL DEFAULT '',
    depart_midi TEXT NOT NULL DEFAULT '',
    arivee_midi TEXT NOT NULL DEFAULT '',
    depart_soir TEXT NOT NULL DEFAULT '',
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  )
`)

export interface EntryRow {
  date: string
  arrivee: string
  depart_midi: string
  arivee_midi: string
  depart_soir: string
  updated_at: string
}

export const stmts = {
  getAll: db.prepare<[], EntryRow>('SELECT * FROM entries ORDER BY date DESC'),
  getOne: db.prepare<[string], EntryRow>('SELECT * FROM entries WHERE date = ?'),
  upsert: db.prepare<[string, string, string, string, string], void>(`
    INSERT INTO entries (date, arrivee, depart_midi, arivee_midi, depart_soir, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(date) DO UPDATE SET
      arrivee     = excluded.arrivee,
      depart_midi = excluded.depart_midi,
      arivee_midi = excluded.arivee_midi,
      depart_soir = excluded.depart_soir,
      updated_at  = excluded.updated_at
  `),
  delete: db.prepare<[string], void>('DELETE FROM entries WHERE date = ?'),
}

export default db
