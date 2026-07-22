import type { FastifyInstance } from 'fastify'
import { settingsStmts } from '../db.js'

interface SettingsBody {
  dailyGoalMinutes: number
  workDays: number[]
  initialBalanceMinutes: number
  leaveCongePayeAnnualDays: number
  leaveRttAnnualDays: number
  reminderMorningEnabled: boolean
  reminderMorningTime: string
  reminderNoonEnabled: boolean
  reminderNoonTime: string
  reminderEveningEnabled: boolean
  reminderEveningTime: string
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

function toApi(row: ReturnType<typeof settingsStmts.get.get>) {
  if (!row) return null
  return {
    dailyGoalMinutes: row.daily_goal_minutes,
    workDays: row.work_days.split(',').map(Number).filter(n => !Number.isNaN(n)),
    initialBalanceMinutes: row.initial_balance_minutes,
    leaveCongePayeAnnualDays: row.leave_conge_paye_annual_days,
    leaveRttAnnualDays: row.leave_rtt_annual_days,
    reminderMorningEnabled: !!row.reminder_morning_enabled,
    reminderMorningTime: row.reminder_morning_time,
    reminderNoonEnabled: !!row.reminder_noon_enabled,
    reminderNoonTime: row.reminder_noon_time,
    reminderEveningEnabled: !!row.reminder_evening_enabled,
    reminderEveningTime: row.reminder_evening_time,
  }
}

function validate(body: SettingsBody): string | null {
  if (typeof body.dailyGoalMinutes !== 'number' || body.dailyGoalMinutes < 1 || body.dailyGoalMinutes > 1440) {
    return 'Objectif horaire invalide'
  }
  if (
    !Array.isArray(body.workDays) ||
    body.workDays.length === 0 ||
    body.workDays.some(d => !Number.isInteger(d) || d < 1 || d > 7)
  ) {
    return 'Jours travaillés invalides'
  }
  if (typeof body.initialBalanceMinutes !== 'number' || !Number.isFinite(body.initialBalanceMinutes)) {
    return 'Solde initial invalide'
  }
  if (typeof body.leaveCongePayeAnnualDays !== 'number' || body.leaveCongePayeAnnualDays < 0) {
    return 'Jours de congés payés invalides'
  }
  if (typeof body.leaveRttAnnualDays !== 'number' || body.leaveRttAnnualDays < 0) {
    return 'Jours de RTT invalides'
  }
  const reminders: [boolean, string, string][] = [
    [body.reminderMorningEnabled, body.reminderMorningTime, 'matin'],
    [body.reminderNoonEnabled, body.reminderNoonTime, 'midi'],
    [body.reminderEveningEnabled, body.reminderEveningTime, 'soir'],
  ] as [boolean, string, string][]
  for (const [enabled, time, label] of reminders) {
    if (typeof enabled !== 'boolean') return `Rappel ${label} invalide`
    if (typeof time !== 'string' || !TIME_RE.test(time)) return `Heure de rappel ${label} invalide`
  }
  return null
}

export async function settingsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  app.get('/settings', async req => {
    settingsStmts.ensureDefault.run(req.user.sub)
    return toApi(settingsStmts.get.get(req.user.sub))
  })

  app.put<{ Body: SettingsBody }>('/settings', async (req, reply) => {
    const error = validate(req.body)
    if (error) return reply.status(400).send({ error })

    const userId = req.user.sub
    settingsStmts.ensureDefault.run(userId)
    const workDays = [...new Set(req.body.workDays)].sort((a, b) => a - b).join(',')
    settingsStmts.update.run(
      req.body.dailyGoalMinutes,
      workDays,
      req.body.initialBalanceMinutes,
      req.body.leaveCongePayeAnnualDays,
      req.body.leaveRttAnnualDays,
      req.body.reminderMorningEnabled ? 1 : 0,
      req.body.reminderMorningTime,
      req.body.reminderNoonEnabled ? 1 : 0,
      req.body.reminderNoonTime,
      req.body.reminderEveningEnabled ? 1 : 0,
      req.body.reminderEveningTime,
      userId,
    )
    return toApi(settingsStmts.get.get(userId))
  })
}
