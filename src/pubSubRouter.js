const SseStream = require('ssestream')
const uuid = require('uuid/v4')
const { asyncRouter } = require('express-extensions')

module.exports = (pubSub) => {
  if (!pubSub) throw new Error('No publisher')
  const router = asyncRouter()
  const connectionByConnectionId = new Map()

  router.$get('/pubsub', async (req, res) => {
    console.log('/pubsub')
    const sse = new SseStream(req)
    sse.pipe(res)
    req.on('close', () => {
      connectionByConnectionId.delete(connectionId)
      sse.unpipe(res)
      res.end()
    })

    const connectionId = uuid()
    const subscriber = await pubSub.makeSubscriber()
    const connection = new Connection(sse, connectionId, subscriber)
    connectionByConnectionId.set(connectionId, connection)
    connection.sendConnectionId()
  })

  router.$post('/pubsub/:connectionId/:signal', async (req, res) => {
    const { connectionId, signal } = req.params
    console.log('/pubsub/:connectionId/:signal',  { connectionId, signal })

    const connection = connectionByConnectionId.get(connectionId)
    if (!connection) return res.status(404).end()
    
    await connection.subscribe(signal)
    res.status(201).end()
  })

  return router
}

class Connection {
  constructor(sse, connectionId, subscriber) {
    this._sse = sse
    this._connectionId = connectionId
    this._subscriber = subscriber
  }
  
  sendConnectionId() {
    this._sse.write({ event: 'pubsub-connectionId', data: this._connectionId })
  }

  async subscribe(signal) {
    await this._subscriber.subscribe(signal, async (...args) => {
      this._sse.write({
        event: 'pubsub-signal',
        data: JSON.stringify({
          signal,
          args
        })
      })
    })
  }
}
