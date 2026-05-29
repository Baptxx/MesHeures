import type { FastifyInstance } from 'fastify'
import { stmts } from '../db.js'

interface EntryBody {
  arrivee: string
  depart_midi: string
  arivee_midi: string
  depart_soir: string
}

// HH:mm or empty string
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$|^$/

function validateEntry(body: EntryBody): string | null {
  const fields = ['arrivee', 'depart_midi', 'arivee_midi', 'depart_soir'] as const
  for (const f of fields) {
    if (typeof body[f] !== 'string' || !TIME_RE.test(body[f])) {
      return `Champ invalide : ${f}`
    }
  }
  return null
}

export async function entriesRoutes(app: FastifyInstance) {
  // GET /entries — toutes les entrées
  app.get('/entries', async () => {
    return stmts.getAll.all()
  })

  // GET /entries/:date — une entrée
  app.get<{ Params: { date: string } }>('/entries/:date', async (req, reply) => {
    const row = stmts.getOne.get(req.params.date)
    if (!row) return reply.status(404).send({ error: 'Non trouvé' })
    return row
  })

  // PUT /entries/:date — créer ou mettre à jour
  app.put<{ Params: { date: string }; Body: EntryBody }>('/entries/:date', {
    schema: {
      params: { type: 'object', properties: { date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' } }, required: ['date'] },
    },
  }, async (req, reply) => {
    const error = validateEntry(req.body)
    if (error) return reply.status(400).send({ error })

    const { date } = req.params
    const { arrivee, depart_midi, arivee_midi, depart_soir } = req.body
    stmts.upsert.run(date, arrivee, depart_midi, arivee_midi, depart_soir)
    return stmts.getOne.get(date)
  })

  // DELETE /entries/:date
  app.delete<{ Params: { date: string } }>('/entries/:date', async (req, reply) => {
    stmts.delete.run(req.params.date)
    return reply.status(204).send()
  })
}
