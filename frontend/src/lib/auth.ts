const TOKEN_KEY = 'mesheures_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export class UnauthorizedError extends Error {
  constructor() {
    super('Session expirée')
    this.name = 'UnauthorizedError'
  }
}

// Permet à api.ts de notifier l'app qu'un 401 a été reçu (token expiré/invalide),
// sans dépendance circulaire avec les hooks React.
let unauthorizedListener: (() => void) | null = null

export function onUnauthorized(listener: () => void): void {
  unauthorizedListener = listener
}

export function notifyUnauthorized(): void {
  unauthorizedListener?.()
}
