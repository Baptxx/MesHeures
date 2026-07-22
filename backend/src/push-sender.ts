import webpush from 'web-push'
import type { FastifyBaseLogger } from 'fastify'
import { pushStmts } from './db.js'

const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? 'mailto:admin@example.com'

export function isPushConfigured(): boolean {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
}

if (isPushConfigured()) {
  webpush.setVapidDetails(VAPID_SUBJECT, process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!)
}

export async function sendToUser(
  userId: number,
  message: string,
  log: FastifyBaseLogger,
): Promise<{ attempted: number; failed: number }> {
  const subscriptions = pushStmts.getByUser.all(userId)
  if (subscriptions.length === 0) return { attempted: 0, failed: 0 }

  const payload = JSON.stringify({ title: 'MesHeures', body: message, url: '/' })
  let failed = 0

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      )
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode
      if (statusCode === 404 || statusCode === 410) {
        pushStmts.deleteByEndpoint.run(sub.endpoint)
      } else {
        log.warn({ err }, 'Échec envoi notification push')
      }
      failed++
    }
  }

  return { attempted: subscriptions.length, failed }
}
