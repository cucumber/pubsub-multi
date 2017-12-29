const SseStream = require('ssestream')
const uuid = require('uuid/v4')
const { asyncRouter } = require('express-extensions')

module.exports = ({ sub, retry }) => {
  if (!sub) throw new Error('No sub')
  if (!retry) retry = 3000
  const router = asyncRouter()
  const sseByConnectionId = new Map()

  router.get('/pubsub', (req, res) => {
    const sse = new SseStream(req)
    sse.pipe(res)
    const connectionId = uuid()
    sse.write({ retry: retry.toString() })
    sse.write({ event: 'pubsub-connectionId', data: connectionId })

    sseByConnectionId.set(connectionId, sse)

    req.on('close', () => {
      sseByConnectionId.delete(connectionId)
      sse.unpipe(res)
      res.end()
    })
  })

  router.$post('/pubsub/:connectionId', async (req, res) => {
    const { connectionId } = req.params
    const signal = req.body || null
    const sse = sseByConnectionId.get(connectionId)
    if (!sse) return res.status(404).end()

    await sub.subscribe(signal, async (signal) => {
      sse.write({
        event: 'pubsub-signal',
        data: JSON.stringify(signal)
      })
    })
    res.status(201).end()
  })

  return router
}