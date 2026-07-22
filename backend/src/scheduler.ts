import type { FastifyBaseLogger } from 'fastify'
import { settingsStmts, stmts, absenceStmts, type EntryRow, type SettingsRow } from './db.js'
import { isPushConfigured, sendToUser } from './push-sender.js'

function localDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

interface ReminderDef {
  key: string
  enabledField: keyof SettingsRow
  timeField: keyof SettingsRow
  message: string
  // Retourne true si le rappel est pertinent (l'étape correspondante n'est pas encore faite)
  isDue: (entry: EntryRow | undefined) => boolean
}

const REMINDERS: ReminderDef[] = [
  {
    key: 'morning',
    enabledField: 'reminder_morning_enabled',
    timeField: 'reminder_morning_time',
    message: "Tu n'as pas encore pointé ton arrivée !",
    isDue: entry => !entry?.arrivee,
  },
  {
    key: 'noon',
    enabledField: 'reminder_noon_enabled',
    timeField: 'reminder_noon_time',
    message: "N'oublie pas de pointer ta pause déjeuner !",
    isDue: entry => !(entry?.depart_midi && entry?.arivee_midi),
  },
  {
    key: 'evening',
    enabledField: 'reminder_evening_enabled',
    timeField: 'reminder_evening_time',
    message: "N'oublie pas de pointer ton départ !",
    isDue: entry => !entry?.depart_soir,
  },
]

// Empêche de renvoyer plusieurs fois le même rappel si le tick se répète dans la même minute
const lastSent = new Map<string, string>() // `${userId}:${reminderKey}` -> date déjà envoyée

async function checkAndSendReminders(log: FastifyBaseLogger) {
  if (!isPushConfigured()) return

  const now = new Date()
  const nowStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const today = localDateStr(now)
  const isoDay = now.getDay() || 7

  const settingsRows = settingsStmts.getAllWithReminders.all()

  for (const s of settingsRows) {
    if (!s.work_days.split(',').map(Number).includes(isoDay)) continue

    for (const reminder of REMINDERS) {
      if (!s[reminder.enabledField]) continue
      if (s[reminder.timeField] !== nowStr) continue

      const dedupKey = `${s.user_id}:${reminder.key}`
      if (lastSent.get(dedupKey) === today) continue

      const entry = stmts.getOne.get(s.user_id, today)
      const absence = absenceStmts.getOne.get(s.user_id, today)
      lastSent.set(dedupKey, today)

      if (absence || !reminder.isDue(entry)) continue

      await sendToUser(s.user_id, reminder.message, log)
    }
  }
}

export function startReminderScheduler(log: FastifyBaseLogger) {
  if (!isPushConfigured()) {
    log.warn('VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY non définis : les rappels push sont désactivés')
    return
  }
  setInterval(() => {
    checkAndSendReminders(log).catch(err => log.error({ err }, 'Erreur planificateur de rappels'))
  }, 30_000)
}
