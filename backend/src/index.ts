import Fastify from 'fastify'
import cors from '@fastify/cors'
import authPlugin from './plugins/auth.js'
import { authRoutes } from './routes/auth.js'
import { entriesRoutes } from './routes/entries.js'
import { settingsRoutes } from './routes/settings.js'
import { absencesRoutes } from './routes/absences.js'
import { pushRoutes } from './routes/push.js'
import { startReminderScheduler } from './scheduler.js'

const app = Fastify({ logger: { transport: { target: 'pino-pretty' } } })

await app.register(cors, {
  origin: true, // autorise toutes les origines sur le réseau local
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
})

await app.register(authPlugin)
await app.register(authRoutes)
await app.register(entriesRoutes)
await app.register(settingsRoutes)
await app.register(absencesRoutes)
await app.register(pushRoutes)

app.get('/health', async () => ({ status: 'ok' }))

startReminderScheduler(app.log)

try {
  await app.listen({ port: 3000, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
