import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { userStmts, settingsStmts } from '../db.js'

interface Credentials {
  email: string
  password: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateCredentials(body: Credentials): string | null {
  if (typeof body.email !== 'string' || !EMAIL_RE.test(body.email)) return 'Email invalide'
  if (typeof body.password !== 'string' || body.password.length < 8) return 'Mot de passe trop court (8 caractères minimum)'
  return null
}

export async function authRoutes(app: FastifyInstance) {
  app.post<{ Body: Credentials }>('/auth/register', async (req, reply) => {
    const error = validateCredentials(req.body)
    if (error) return reply.status(400).send({ error })

    const email = req.body.email.toLowerCase().trim()
    if (userStmts.getByEmail.get(email)) {
      return reply.status(409).send({ error: 'Un compte existe déjà avec cet email' })
    }

    const passwordHash = bcrypt.hashSync(req.body.password, 10)
    const { lastInsertRowid: userId } = userStmts.create.run(email, passwordHash)
    settingsStmts.ensureDefault.run(Number(userId))

    const token = app.jwt.sign({ sub: Number(userId), email })
    return { token, user: { id: Number(userId), email } }
  })

  app.post<{ Body: Credentials }>('/auth/login', async (req, reply) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase().trim() : ''
    const password = typeof req.body?.password === 'string' ? req.body.password : ''

    const user = userStmts.getByEmail.get(email)
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return reply.status(401).send({ error: 'Email ou mot de passe incorrect' })
    }

    settingsStmts.ensureDefault.run(user.id)
    const token = app.jwt.sign({ sub: user.id, email: user.email })
    return { token, user: { id: user.id, email: user.email } }
  })

  app.get('/auth/me', { preHandler: app.authenticate }, async req => {
    return { id: req.user.sub, email: req.user.email }
  })

  app.patch<{ Body: { currentPassword: string; newPassword: string } }>(
    '/auth/password',
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { currentPassword, newPassword } = req.body ?? {}
      if (typeof newPassword !== 'string' || newPassword.length < 8) {
        return reply.status(400).send({ error: 'Nouveau mot de passe trop court (8 caractères minimum)' })
      }

      const user = userStmts.getById.get(req.user.sub)
      if (!user || typeof currentPassword !== 'string' || !bcrypt.compareSync(currentPassword, user.password_hash)) {
        return reply.status(403).send({ error: 'Mot de passe actuel incorrect' })
      }

      userStmts.updatePassword.run(bcrypt.hashSync(newPassword, 10), user.id)
      return { ok: true }
    },
  )
}
