const SseStream = require('ssestream')
const uuid = require('uuid/v4')
const { asyncRouter } = require('express-extensions')

module.exports = ({ publisher, retry }) => {
  if (!publisher) throw new Error('No publisher')
  if (!retry) retry = 3000
  const router = asyncRouter()
  const connectionByConnectionId = new Map()

  router.get('/pubsub', (req, res) => {
    const sse = new SseStream(req)
    sse.pipe(res)
    req.on('close', () => {
      connectionByConnectionId.delete(connectionId)
      sse.unpipe(res)
      res.end()
    })

    const connectionId = uuid()
    const connection = new Connection(sse, connectionId, publisher)
    connectionByConnectionId.set(connectionId, connection)
    connection.sendConnectionId()
  })

  router.$post('/pubsub/:connectionId/:subscriberId', async (req, res) => {
    const { connectionId, subscriberId } = req.params
    const subscribedSignal = req.body || null

    const connection = connectionByConnectionId.get(connectionId)
    if (!connection) return res.status(404).end()
    
    await connection.subscribe(subscriberId, subscribedSignal)
    res.status(201).end()
  })

  return router
}

class Connection {
  constructor(sse, connectionId, publisher) {
    this._subscriberById = new Map()

    this._sse = sse
    this._connectionId = connectionId
    this._publisher = publisher
  }
  
  sendConnectionId() {
    // this._sse.write({ retry: retry.toString() })
    this._sse.write({ event: 'pubsub-connectionId', data: this._connectionId })
  }

  async subscribe(subscriberId, subscribedSignal) {
    if(!this._subscriberById.has(subscriberId)) {
      const subscriber = this._publisher.makeSubscriber(subscriberId)
      this._subscriberById.set(subscriberId, subscriber)
    }
    const subscriber = this._subscriberById.get(subscriberId)
    await subscriber.subscribe(subscribedSignal, async (signal, ...args) => {
      this._sse.write({
        event: 'pubsub-signal',
        data: JSON.stringify({
          subscriberId,
          subscribedSignal,
          signal,
          args
        })
      })
    })
  }
}
