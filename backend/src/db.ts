import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.DB_PATH ?? path.join(__dirname, '../../mesheures.db')

const db = new Database(DB_PATH)
db.pragma('foreign_keys = ON')

// ── Schéma ────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    user_id                      INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    daily_goal_minutes           INTEGER NOT NULL DEFAULT 420,
    work_days                   TEXT NOT NULL DEFAULT '1,2,3,4,5',
    initial_balance_minutes      INTEGER NOT NULL DEFAULT 0,
    leave_conge_paye_annual_days REAL NOT NULL DEFAULT 25,
    leave_rtt_annual_days        REAL NOT NULL DEFAULT 0,
    reminder_morning_enabled     INTEGER NOT NULL DEFAULT 0,
    reminder_morning_time        TEXT NOT NULL DEFAULT '09:00',
    reminder_noon_enabled        INTEGER NOT NULL DEFAULT 0,
    reminder_noon_time           TEXT NOT NULL DEFAULT '12:30',
    reminder_evening_enabled     INTEGER NOT NULL DEFAULT 0,
    reminder_evening_time        TEXT NOT NULL DEFAULT '18:00'
  );

  CREATE TABLE IF NOT EXISTS absences (
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date       TEXT NOT NULL,
    type       TEXT NOT NULL CHECK (type IN ('conge_paye', 'rtt', 'maladie', 'autre')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, date)
  );

  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint   TEXT NOT NULL UNIQUE,
    p256dh     TEXT NOT NULL,
    auth       TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

// Ajout des colonnes de rappel sur une base settings pré-existante (avant cette fonctionnalité,
// ou avant le passage à 3 rappels matin/midi/soir)
const settingsColumns = db.prepare(`PRAGMA table_info(settings)`).all() as { name: string }[]
const reminderColumns: [string, string][] = [
  ['reminder_morning_enabled', `INTEGER NOT NULL DEFAULT 0`],
  ['reminder_morning_time', `TEXT NOT NULL DEFAULT '09:00'`],
  ['reminder_noon_enabled', `INTEGER NOT NULL DEFAULT 0`],
  ['reminder_noon_time', `TEXT NOT NULL DEFAULT '12:30'`],
  ['reminder_evening_enabled', `INTEGER NOT NULL DEFAULT 0`],
  ['reminder_evening_time', `TEXT NOT NULL DEFAULT '18:00'`],
]
for (const [name, def] of reminderColumns) {
  if (!settingsColumns.some(c => c.name === name)) {
    db.exec(`ALTER TABLE settings ADD COLUMN ${name} ${def}`)
  }
}

// La table entries pré-existe potentiellement sans user_id (version mono-utilisateur).
// On migre les données existantes vers un utilisateur "legacy" plutôt que de les perdre.
const entriesColumns = db.prepare(`PRAGMA table_info(entries)`).all() as { name: string }[]
const entriesExists = entriesColumns.length > 0
const hasUserId = entriesColumns.some(c => c.name === 'user_id')

if (!entriesExists) {
  db.exec(`
    CREATE TABLE entries (
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date        TEXT NOT NULL,
      arrivee     TEXT NOT NULL DEFAULT '',
      depart_midi TEXT NOT NULL DEFAULT '',
      arivee_midi TEXT NOT NULL DEFAULT '',
      depart_soir TEXT NOT NULL DEFAULT '',
      updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, date)
    )
  `)
} else if (!hasUserId) {
  const migrate = db.transaction(() => {
    const legacyEmail = process.env.SEED_EMAIL ?? 'bapt.hbt@gmail.com'
    const legacyPassword = process.env.SEED_PASSWORD ?? Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
    const passwordHash = bcrypt.hashSync(legacyPassword, 10)

    const { lastInsertRowid: userId } = db
      .prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
      .run(legacyEmail, passwordHash)

    db.prepare('INSERT INTO settings (user_id) VALUES (?)').run(userId)

    db.exec('ALTER TABLE entries RENAME TO entries_legacy')
    db.exec(`
      CREATE TABLE entries (
        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date        TEXT NOT NULL,
        arrivee     TEXT NOT NULL DEFAULT '',
        depart_midi TEXT NOT NULL DEFAULT '',
        arivee_midi TEXT NOT NULL DEFAULT '',
        depart_soir TEXT NOT NULL DEFAULT '',
        updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (user_id, date)
      )
    `)
    db.prepare(`
      INSERT INTO entries (user_id, date, arrivee, depart_midi, arivee_midi, depart_soir, updated_at)
      SELECT ?, date, arrivee, depart_midi, arivee_midi, depart_soir, updated_at FROM entries_legacy
    `).run(userId)
    db.exec('DROP TABLE entries_legacy')

    if (!process.env.SEED_PASSWORD) {
      console.log('─'.repeat(60))
      console.log('Migration : compte créé pour vos données existantes')
      console.log(`  email    : ${legacyEmail}`)
      console.log(`  password : ${legacyPassword}`)
      console.log('  → changez ce mot de passe depuis les Réglages une fois connecté')
      console.log('─'.repeat(60))
    }
  })
  migrate()
}

// Ajout de la colonne is_remote (télétravail) sur une base entries pré-existante
const entriesColumnsAfterMigration = db.prepare(`PRAGMA table_info(entries)`).all() as { name: string }[]
if (!entriesColumnsAfterMigration.some(c => c.name === 'is_remote')) {
  db.exec(`ALTER TABLE entries ADD COLUMN is_remote INTEGER NOT NULL DEFAULT 0`)
}

export interface UserRow {
  id: number
  email: string
  password_hash: string
  created_at: string
}

export interface EntryRow {
  user_id: number
  date: string
  arrivee: string
  depart_midi: string
  arivee_midi: string
  depart_soir: string
  is_remote: number
  updated_at: string
}

export interface SettingsRow {
  user_id: number
  daily_goal_minutes: number
  work_days: string
  initial_balance_minutes: number
  leave_conge_paye_annual_days: number
  leave_rtt_annual_days: number
  reminder_morning_enabled: number
  reminder_morning_time: string
  reminder_noon_enabled: number
  reminder_noon_time: string
  reminder_evening_enabled: number
  reminder_evening_time: string
}

export interface PushSubscriptionRow {
  id: number
  user_id: number
  endpoint: string
  p256dh: string
  auth: string
  created_at: string
}

export type AbsenceType = 'conge_paye' | 'rtt' | 'maladie' | 'autre'

export interface AbsenceRow {
  user_id: number
  date: string
  type: AbsenceType
  created_at: string
}

export const userStmts = {
  getByEmail: db.prepare<[string], UserRow>('SELECT * FROM users WHERE email = ?'),
  getById: db.prepare<[number], UserRow>('SELECT * FROM users WHERE id = ?'),
  create: db.prepare<[string, string], void>('INSERT INTO users (email, password_hash) VALUES (?, ?)'),
  updatePassword: db.prepare<[string, number], void>('UPDATE users SET password_hash = ? WHERE id = ?'),
}

export const stmts = {
  getAll: db.prepare<[number], EntryRow>('SELECT * FROM entries WHERE user_id = ? ORDER BY date DESC'),
  getOne: db.prepare<[number, string], EntryRow>('SELECT * FROM entries WHERE user_id = ? AND date = ?'),
  upsert: db.prepare<[number, string, string, string, string, string, number], void>(`
    INSERT INTO entries (user_id, date, arrivee, depart_midi, arivee_midi, depart_soir, is_remote, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, date) DO UPDATE SET
      arrivee     = excluded.arrivee,
      depart_midi = excluded.depart_midi,
      arivee_midi = excluded.arivee_midi,
      depart_soir = excluded.depart_soir,
      is_remote   = excluded.is_remote,
      updated_at  = excluded.updated_at
  `),
  delete: db.prepare<[number, string], void>('DELETE FROM entries WHERE user_id = ? AND date = ?'),
}

export const settingsStmts = {
  get: db.prepare<[number], SettingsRow>('SELECT * FROM settings WHERE user_id = ?'),
  ensureDefault: db.prepare<[number], void>('INSERT OR IGNORE INTO settings (user_id) VALUES (?)'),
  update: db.prepare<[number, string, number, number, number, number, string, number, string, number, string, number], void>(`
    UPDATE settings SET
      daily_goal_minutes = ?,
      work_days = ?,
      initial_balance_minutes = ?,
      leave_conge_paye_annual_days = ?,
      leave_rtt_annual_days = ?,
      reminder_morning_enabled = ?,
      reminder_morning_time = ?,
      reminder_noon_enabled = ?,
      reminder_noon_time = ?,
      reminder_evening_enabled = ?,
      reminder_evening_time = ?
    WHERE user_id = ?
  `),
  getAllWithReminders: db.prepare<[], SettingsRow>(`
    SELECT * FROM settings
    WHERE reminder_morning_enabled = 1 OR reminder_noon_enabled = 1 OR reminder_evening_enabled = 1
  `),
}

export const absenceStmts = {
  getAll: db.prepare<[number], AbsenceRow>('SELECT * FROM absences WHERE user_id = ? ORDER BY date DESC'),
  getOne: db.prepare<[number, string], AbsenceRow>('SELECT * FROM absences WHERE user_id = ? AND date = ?'),
  upsert: db.prepare<[number, string, string], void>(`
    INSERT INTO absences (user_id, date, type)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, date) DO UPDATE SET type = excluded.type
  `),
  delete: db.prepare<[number, string], void>('DELETE FROM absences WHERE user_id = ? AND date = ?'),
}

export const pushStmts = {
  getByUser: db.prepare<[number], PushSubscriptionRow>('SELECT * FROM push_subscriptions WHERE user_id = ?'),
  upsert: db.prepare<[number, string, string, string], void>(`
    INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth, user_id = excluded.user_id
  `),
  deleteByEndpoint: db.prepare<[string], void>('DELETE FROM push_subscriptions WHERE endpoint = ?'),
}

export default db
