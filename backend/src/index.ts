import Fastify from 'fastify'
import cors from '@fastify/cors'
import { entriesRoutes } from './routes/entries.js'

const app = Fastify({ logger: { transport: { target: 'pino-pretty' } } })

await app.register(cors, {
  origin: ['http://localhost:5173', 'http://localhost:4173'],
  methods: ['GET', 'PUT', 'DELETE', 'OPTIONS'],
})

await app.register(entriesRoutes)

app.get('/health', async () => ({ status: 'ok' }))

try {
  await app.listen({ port: 3000, host: '127.0.0.1' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
