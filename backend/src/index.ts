import Fastify from 'fastify'
import cors from '@fastify/cors'
import { entriesRoutes } from './routes/entries.js'

const app = Fastify({ logger: { transport: { target: 'pino-pretty' } } })

await app.register(cors, {
  origin: true, // autorise toutes les origines sur le réseau local
  methods: ['GET', 'PUT', 'DELETE', 'OPTIONS'],
})

await app.register(entriesRoutes)

app.get('/health', async () => ({ status: 'ok' }))

try {
  await app.listen({ port: 3000, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
