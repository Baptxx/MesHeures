import type { DayEntry, Absence, AbsenceType, Settings, User } from './types'
import { getToken, clearToken, notifyUnauthorized, UnauthorizedError } from './auth'

// En prod (Docker), VITE_API_URL='' → requêtes relatives proxifiées par nginx
// En dev, VITE_API_URL=http://localhost:3000 ou http://192.168.x.x:3000
const BASE = import.meta.env.VITE_API_URL ?? ''

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken()
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init.body) headers.set('Content-Type', 'application/json')

  const res = await fetch(`${BASE}${path}`, { ...init, headers })
  // Un 401 alors qu'on avait un token signifie que la session a expiré/est invalide.
  // Un 401 sans token (ex: identifiants de connexion refusés) est une erreur métier normale.
  if (res.status === 401 && token) {
    clearToken()
    notifyUnauthorized()
    throw new UnauthorizedError()
  }
  return res
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json() as { error?: string }
    return body.error ?? fallback
  } catch {
    return fallback
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────

export async function register(email: string, password: string): Promise<{ token: string; user: User }> {
  const res = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) })
  if (!res.ok) throw new Error(await errorMessage(res, 'Erreur lors de l\'inscription'))
  return res.json()
}

export async function login(email: string, password: string): Promise<{ token: string; user: User }> {
  const res = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
  if (!res.ok) throw new Error(await errorMessage(res, 'Erreur lors de la connexion'))
  return res.json()
}

export async function fetchMe(): Promise<User> {
  const res = await apiFetch('/auth/me')
  if (!res.ok) throw new Error('Session invalide')
  return res.json()
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const res = await apiFetch('/auth/password', { method: 'PATCH', body: JSON.stringify({ currentPassword, newPassword }) })
  if (!res.ok) throw new Error(await errorMessage(res, 'Erreur lors du changement de mot de passe'))
}

// ── Entries ───────────────────────────────────────────────────────────────

// Convertit le format snake_case de l'API vers le format camelCase du frontend
function fromApi(row: Record<string, string | number>): DayEntry {
  return {
    date: row.date as string,
    arrivee: (row.arrivee as string) ?? '',
    departMidi: (row.depart_midi as string) ?? '',
    ariveeMidi: (row.arivee_midi as string) ?? '',
    departSoir: (row.depart_soir as string) ?? '',
    isRemote: !!row.is_remote,
  }
}

// Convertit le format camelCase du frontend vers le format snake_case de l'API
function toApi(entry: DayEntry) {
  return {
    arrivee: entry.arrivee,
    depart_midi: entry.departMidi,
    arivee_midi: entry.ariveeMidi,
    depart_soir: entry.departSoir,
    is_remote: entry.isRemote,
  }
}

export async function fetchAllEntries(): Promise<DayEntry[]> {
  const res = await apiFetch('/entries')
  if (!res.ok) throw new Error('Erreur lors du chargement')
  const rows = await res.json() as Record<string, string | number>[]
  return rows.map(fromApi)
}

export async function saveEntry(entry: DayEntry): Promise<DayEntry> {
  const res = await apiFetch(`/entries/${entry.date}`, { method: 'PUT', body: JSON.stringify(toApi(entry)) })
  if (!res.ok) throw new Error('Erreur lors de la sauvegarde')
  return fromApi(await res.json() as Record<string, string | number>)
}

export async function deleteEntry(date: string): Promise<void> {
  const res = await apiFetch(`/entries/${date}`, { method: 'DELETE' })
  if (!res.ok && res.status !== 404) throw new Error('Erreur lors de la suppression')
}

// ── Settings ──────────────────────────────────────────────────────────────

export async function fetchSettings(): Promise<Settings> {
  const res = await apiFetch('/settings')
  if (!res.ok) throw new Error('Erreur lors du chargement des réglages')
  return res.json()
}

export async function saveSettings(settings: Settings): Promise<Settings> {
  const res = await apiFetch('/settings', { method: 'PUT', body: JSON.stringify(settings) })
  if (!res.ok) throw new Error(await errorMessage(res, 'Erreur lors de la sauvegarde des réglages'))
  return res.json()
}

// ── Absences ──────────────────────────────────────────────────────────────

export async function fetchAbsences(): Promise<Absence[]> {
  const res = await apiFetch('/absences')
  if (!res.ok) throw new Error('Erreur lors du chargement des absences')
  const rows = await res.json() as { date: string; type: AbsenceType }[]
  return rows.map(r => ({ date: r.date, type: r.type }))
}

export async function saveAbsence(date: string, type: AbsenceType): Promise<Absence> {
  const res = await apiFetch(`/absences/${date}`, { method: 'PUT', body: JSON.stringify({ type }) })
  if (!res.ok) throw new Error(await errorMessage(res, 'Erreur lors de la sauvegarde de l\'absence'))
  return res.json()
}

export async function deleteAbsence(date: string): Promise<void> {
  const res = await apiFetch(`/absences/${date}`, { method: 'DELETE' })
  if (!res.ok && res.status !== 404) throw new Error('Erreur lors de la suppression')
}

// ── Push notifications ───────────────────────────────────────────────────

export async function fetchVapidPublicKey(): Promise<string> {
  const res = await apiFetch('/push/vapid-public-key')
  if (!res.ok) throw new Error('Erreur lors de la récupération de la clé push')
  const body = await res.json() as { publicKey: string }
  return body.publicKey
}

export async function subscribePush(subscription: PushSubscriptionJSON): Promise<void> {
  const res = await apiFetch('/push/subscribe', { method: 'POST', body: JSON.stringify(subscription) })
  if (!res.ok) throw new Error(await errorMessage(res, "Erreur lors de l'activation des rappels"))
}

export async function unsubscribePush(endpoint: string): Promise<void> {
  const res = await apiFetch('/push/unsubscribe', { method: 'POST', body: JSON.stringify({ endpoint }) })
  if (!res.ok) throw new Error(await errorMessage(res, 'Erreur lors de la désactivation des rappels'))
}

export async function sendTestPush(): Promise<void> {
  const res = await apiFetch('/push/test', { method: 'POST' })
  if (!res.ok) throw new Error(await errorMessage(res, "Erreur lors de l'envoi du test"))
}
