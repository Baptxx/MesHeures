import type { FastifyInstance } from 'fastify'
import { pushStmts } from '../db.js'
import { isPushConfigured, sendToUser } from '../push-sender.js'

interface SubscriptionBody {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export async function pushRoutes(app: FastifyInstance) {
  // Clé publique VAPID — pas de données sensibles, pas besoin d'authentification
  app.get('/push/vapid-public-key', async () => {
    return { publicKey: process.env.VAPID_PUBLIC_KEY ?? '' }
  })

  // Routes protégées, isolées dans leur propre scope pour ne pas affecter la route ci-dessus
  await app.register(async protectedApp => {
    protectedApp.addHook('preHandler', protectedApp.authenticate)

    protectedApp.post<{ Body: SubscriptionBody }>('/push/subscribe', async (req, reply) => {
      const { endpoint, keys } = req.body ?? {}
      if (typeof endpoint !== 'string' || !endpoint || !keys?.p256dh || !keys?.auth) {
        return reply.status(400).send({ error: 'Abonnement push invalide' })
      }
      pushStmts.upsert.run(req.user.sub, endpoint, keys.p256dh, keys.auth)
      return { ok: true }
    })

    protectedApp.post<{ Body: { endpoint: string } }>('/push/unsubscribe', async (req, reply) => {
      const { endpoint } = req.body ?? {}
      if (typeof endpoint !== 'string' || !endpoint) {
        return reply.status(400).send({ error: 'Endpoint manquant' })
      }
      pushStmts.deleteByEndpoint.run(endpoint)
      return { ok: true }
    })

    protectedApp.post('/push/test', async (req, reply) => {
      if (!isPushConfigured()) {
        return reply.status(503).send({ error: 'Notifications non configurées côté serveur' })
      }
      const subscriptionsCount = pushStmts.getByUser.all(req.user.sub).length
      if (subscriptionsCount === 0) {
        return reply.status(400).send({ error: 'Aucun abonnement actif pour cet appareil' })
      }
      const { attempted, failed } = await sendToUser(req.user.sub, 'Ceci est un test 🎉 Les rappels fonctionnent.', req.log)
      if (failed === attempted) {
        return reply.status(502).send({ error: `Échec de l'envoi (${failed}/${attempted})` })
      }
      return { ok: true, attempted, failed }
    })
  })
}
