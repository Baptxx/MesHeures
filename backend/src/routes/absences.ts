import type { FastifyInstance } from 'fastify'
import { absenceStmts, stmts, type AbsenceType } from '../db.js'

const TYPES: AbsenceType[] = ['conge_paye', 'rtt', 'maladie', 'autre']

export async function absencesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // GET /absences — toutes les absences de l'utilisateur connecté
  app.get('/absences', async req => {
    return absenceStmts.getAll.all(req.user.sub)
  })

  // PUT /absences/:date — créer ou mettre à jour une absence
  app.put<{ Params: { date: string }; Body: { type: AbsenceType } }>('/absences/:date', {
    schema: {
      params: { type: 'object', properties: { date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' } }, required: ['date'] },
    },
  }, async (req, reply) => {
    const { type } = req.body ?? {}
    if (!TYPES.includes(type)) {
      return reply.status(400).send({ error: `Type invalide (attendu : ${TYPES.join(', ')})` })
    }

    const userId = req.user.sub
    const { date } = req.params
    // Un jour est soit travaillé, soit absent : on nettoie l'entrée de pointage éventuelle
    stmts.delete.run(userId, date)
    absenceStmts.upsert.run(userId, date, type)
    return { user_id: userId, date, type }
  })

  // DELETE /absences/:date
  app.delete<{ Params: { date: string } }>('/absences/:date', async (req, reply) => {
    absenceStmts.delete.run(req.user.sub, req.params.date)
    return reply.status(204).send()
  })
}
