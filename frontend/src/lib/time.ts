import type { DayEntry } from './types'

// ── Jours fériés (France métropolitaine) ────────────────────────────────────

// Dimanche de Pâques (algorithme de Meeus/Jones/Butcher)
function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

const holidaysCache = new Map<number, Map<string, string>>()

function computeFrenchHolidays(year: number): Map<string, string> {
  const holidays = new Map<string, string>()
  const add = (date: Date, name: string) => holidays.set(localDateStr(date), name)

  add(new Date(year, 0, 1), 'Jour de l\'An')
  add(new Date(year, 4, 1), 'Fête du Travail')
  add(new Date(year, 4, 8), 'Victoire 1945')
  add(new Date(year, 6, 14), 'Fête nationale')
  add(new Date(year, 7, 15), 'Assomption')
  add(new Date(year, 10, 1), 'Toussaint')
  add(new Date(year, 10, 11), 'Armistice')
  add(new Date(year, 11, 25), 'Noël')

  const easter = easterSunday(year)
  const easterMonday = new Date(easter)
  easterMonday.setDate(easter.getDate() + 1)
  const ascension = new Date(easter)
  ascension.setDate(easter.getDate() + 39)
  const whitMonday = new Date(easter)
  whitMonday.setDate(easter.getDate() + 50)
  add(easterMonday, 'Lundi de Pâques')
  add(ascension, 'Ascension')
  add(whitMonday, 'Lundi de Pentecôte')

  return holidays
}

export function getFrenchHolidays(year: number): Map<string, string> {
  let cached = holidaysCache.get(year)
  if (!cached) {
    cached = computeFrenchHolidays(year)
    holidaysCache.set(year, cached)
  }
  return cached
}

// Retourne le nom du jour férié pour cette date, ou null
export function getHolidayName(date: string): string | null {
  const year = Number(date.slice(0, 4))
  return getFrenchHolidays(year).get(date) ?? null
}

export function toMinutes(time: string): number | null {
  if (!time) return null
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function fromMinutes(minutes: number): string {
  const h = Math.floor(Math.abs(minutes) / 60)
  const m = Math.abs(minutes) % 60
  return `${h}h${m.toString().padStart(2, '0')}`
}

export function calcDurations(entry: DayEntry) {
  const a = toMinutes(entry.arrivee)
  const dm = toMinutes(entry.departMidi)
  const am = toMinutes(entry.ariveeMidi)
  const ds = toMinutes(entry.departSoir)

  const matin = a !== null && dm !== null ? dm - a : null
  const pause = dm !== null && am !== null ? am - dm : null
  const apresmidi = am !== null && ds !== null ? ds - am : null
  const total = matin !== null && apresmidi !== null ? matin + apresmidi : null

  return { matin, pause, apresmidi, total }
}

// Retourne l'heure de départ théorique (HH:mm) pour atteindre 7h de travail.
// Nécessite au moins arrivée + retour midi (avec départ midi pour la pause exacte).
export function calcTheoreticalDeparture(entry: DayEntry, goalMinutes = 7 * 60): string | null {
  const a = toMinutes(entry.arrivee)
  const dm = toMinutes(entry.departMidi)
  const am = toMinutes(entry.ariveeMidi)

  if (a === null) return null

  // Cas 1 : arrivée + départ midi + arrivée midi → calcul précis
  if (dm !== null && am !== null) {
    const malin = dm - a
    const remaining = goalMinutes - malin
    const departure = am + remaining
    const h = Math.floor(departure / 60)
    const m = departure % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  // Cas 2 : arrivée seulement → départ minimum sans connaître la pause
  const departure = a + goalMinutes
  const h = Math.floor(departure / 60)
  const m = departure % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export function isComplete(entry: DayEntry): boolean {
  return !!(entry.arrivee && entry.departMidi && entry.ariveeMidi && entry.departSoir)
}

export function isStarted(entry: DayEntry): boolean {
  return !!(entry.arrivee || entry.departMidi || entry.ariveeMidi || entry.departSoir)
}

// Formatte une Date en YYYY-MM-DD selon l'heure locale (pas UTC)
export function localDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayStr(): string {
  return localDateStr(new Date())
}

export function addDays(dateStr: string, delta: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + delta)
  return localDateStr(d)
}

// Liste des dates entre `from` et `to` inclus, quel que soit leur ordre
export function dateRange(from: string, to: string): string[] {
  const [start, end] = from <= to ? [from, to] : [to, from]
  const dates: string[] = []
  let cur = start
  while (cur <= end) {
    dates.push(cur)
    cur = addDays(cur, 1)
  }
  return dates
}

export interface CalendarCell {
  date: string
  inMonth: boolean
}

// Grille complète (semaines de lundi à dimanche) pour un mois donné, avec les jours
// des mois adjacents nécessaires pour compléter la première/dernière semaine.
export function getCalendarGrid(year: number, month: number): CalendarCell[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const firstWeekday = firstDay.getDay() || 7
  const lastWeekday = lastDay.getDay() || 7

  const start = new Date(firstDay)
  start.setDate(firstDay.getDate() - (firstWeekday - 1))
  const end = new Date(lastDay)
  end.setDate(lastDay.getDate() + (7 - lastWeekday))

  const cells: CalendarCell[] = []
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    cells.push({ date: localDateStr(d), inMonth: d.getMonth() === month })
  }
  return cells
}

// Un jour est "travaillable" s'il tombe sur un jour de la semaine travaillé
// ET que ce n'est pas un jour férié.
export function isWorkableDay(date: string, workDays: number[]): boolean {
  const isoDay = new Date(date + 'T00:00:00').getDay() || 7
  return workDays.includes(isoDay) && !getHolidayName(date)
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Retourne le numéro de semaine ISO et l'année pour un date string
export function getWeekInfo(dateStr: string): { week: number; year: number; monday: string } {
  const d = new Date(dateStr + 'T00:00:00')
  // Algo ISO 8601 : lundi = jour 1
  const day = d.getDay() || 7 // dimanche devient 7
  const monday = new Date(d)
  monday.setDate(d.getDate() - day + 1)
  const thursday = new Date(monday)
  thursday.setDate(monday.getDate() + 3)
  const year = thursday.getFullYear()
  const jan1 = new Date(year, 0, 1)
  const week = Math.ceil(((monday.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
  return { week, year, monday: localDateStr(monday) }
}

export const DEFAULT_WORK_DAYS = [1, 2, 3, 4, 5]

// Étiquette courte (L, M, M, J, V, S, D) pour un jour ISO (lundi = 1 ... dimanche = 7)
export const DAY_LETTERS: Record<number, string> = { 1: 'L', 2: 'M', 3: 'M', 4: 'J', 5: 'V', 6: 'S', 7: 'D' }

export function getWeekDays(dateStr: string, workDays: number[] = DEFAULT_WORK_DAYS): string[] {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((day + 6) % 7))
  return workDays.map(isoDay => {
    const dd = new Date(monday)
    dd.setDate(monday.getDate() + (isoDay - 1))
    return localDateStr(dd)
  })
}

export function getMonthWeeks(
  dateStr: string,
  workDays: number[] = DEFAULT_WORK_DAYS,
): { monday: string; days: string[]; week: number }[] {
  const d = new Date(dateStr + 'T00:00:00')
  const year = d.getFullYear()
  const month = d.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const firstDayOfWeek = firstDay.getDay() || 7
  const cur = new Date(firstDay)
  cur.setDate(firstDay.getDate() - firstDayOfWeek + 1)
  const weeks: { monday: string; days: string[]; week: number }[] = []
  while (cur <= lastDay) {
    const monday = localDateStr(cur)
    const days = workDays.map(isoDay => {
      const dd = new Date(cur)
      dd.setDate(cur.getDate() + (isoDay - 1))
      return localDateStr(dd)
    })
    weeks.push({ monday, days, week: getWeekInfo(monday).week })
    cur.setDate(cur.getDate() + 7)
  }
  return weeks
}

export function formatDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function currentMonthLabel(): string {
  return new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

export function currentYear(): number {
  return new Date().getFullYear()
}

// Solde d'heures cumulé : solde initial + somme des écarts (jour travaillé réel - objectif)
// pour chaque jour déjà saisi (passé ou aujourd'hui) tombant sur un jour travaillé.
// Les jours d'absence n'apparaissent pas dans `entries` : ils sont neutres (ni + ni -).
// Écart d'un jour par rapport à l'objectif. En télétravail, le surplus n'est jamais
// crédité (plafonné à 0) car les heures supplémentaires n'y sont pas autorisées ;
// un déficit reste en revanche décompté normalement.
export function dayDeltaContribution(total: number | null, goalMinutes: number, isRemote: boolean): number {
  if (total === null) return -goalMinutes
  const raw = total - goalMinutes
  return isRemote ? Math.min(raw, 0) : raw
}

export function calcRunningBalance(
  entries: Record<string, DayEntry>,
  settings: { dailyGoalMinutes: number; workDays: number[]; initialBalanceMinutes: number },
): number {
  const today = todayStr()
  let balance = settings.initialBalanceMinutes
  for (const entry of Object.values(entries)) {
    if (entry.date > today) continue
    const d = new Date(entry.date + 'T00:00:00')
    const isoDay = d.getDay() || 7
    if (!settings.workDays.includes(isoDay)) continue
    const { total } = calcDurations(entry)
    if (total === null) continue
    balance += dayDeltaContribution(total, settings.dailyGoalMinutes, entry.isRemote)
  }
  return balance
}

// Retourne les 12 mois de l'année, chacun avec ses semaines de travail
export function getYearMonths(
  year: number,
  workDays: number[] = DEFAULT_WORK_DAYS,
): { month: number; label: string; days: string[] }[] {
  return Array.from({ length: 12 }, (_, m) => {
    const firstDay = new Date(year, m, 1)
    const lastDay = new Date(year, m + 1, 0)
    const days: string[] = []
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const isoDay = d.getDay() || 7
      if (workDays.includes(isoDay)) days.push(localDateStr(new Date(d)))
    }
    const label = firstDay.toLocaleDateString('fr-FR', { month: 'short' })
    return { month: m, label, days }
  })
}
