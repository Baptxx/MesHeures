import type { DayEntry } from './types'

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

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function getWeekDays(dateStr: string): string[] {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((day + 6) % 7))
  return Array.from({ length: 5 }, (_, i) => {
    const dd = new Date(monday)
    dd.setDate(monday.getDate() + i)
    return dd.toISOString().slice(0, 10)
  })
}
