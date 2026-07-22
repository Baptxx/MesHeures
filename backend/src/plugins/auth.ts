import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: number; email: string }
    user: { sub: number; email: string }
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

export default fp(async function authPlugin(app: FastifyInstance) {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    app.log.warn('JWT_SECRET non défini : un secret temporaire est utilisé (les tokens seront invalidés au redémarrage)')
  }

  await app.register(fastifyJwt, {
    secret: secret ?? 'dev-only-insecure-secret-set-JWT_SECRET-env-var',
  })

  app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify()
    } catch {
      reply.status(401).send({ error: 'Non authentifié' })
    }
  })
})
