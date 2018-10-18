const MemoryPubSub = require('./MemoryPubSub')

module.exports = class EventSourcePubSub {
  constructor({fetch22, EventSource, eventSourceUrl}) {
    if (!fetch22) throw new Error("No fetch22")
    if (!EventSource) throw new Error("No EventSource")
    if (!eventSourceUrl) throw new Error("No eventSourceUrl")

    this._fetch22 = fetch22
    this._EventSource = EventSource;
    this._eventSourceUrl = eventSourceUrl;

    this._subscribers = []
  }

  async makeSubscriber() {
    const subscriber = new EventSourceSubscriber(this._fetch22)
    const eventSource = new this._EventSource(this._eventSourceUrl)
    await subscriber.connect(eventSource)
    this._subscribers.push(subscriber)
    return subscriber
  }
}

class EventSourceSubscriber {
  constructor(fetch22) {
    this._fetch22 = fetch22
    this._pubSub = new MemoryPubSub()
    this._connectionId = null
    this._subscriber = null
  }

  connect(eventSource) {
    this._eventSource = eventSource
    return new Promise((resolve, reject) => {
      eventSource.onerror = e => {
        this._connectionId = null
        reject(new Error('EventSource error: ' + e))
      }

      eventSource.addEventListener('pubsub-signal', e => {
        const {signal, args} = JSON.parse(e.data)
        this._pubSub.publish(signal, ...args)
          .catch(err => console.error('Signalling failed', err))
      })

      eventSource.addEventListener('pubsub-connectionId', e => {
        this._connectionId = e.data
        resolve()
      })
    })
  }

  async stop() {
    this._eventSource.close()
  }

  async subscribe(signal, signalFunction) {
    if (!this._subscriber) {
      this._subscriber = await this._pubSub.makeSubscriber()
    }
    await this._subscriber.subscribe(signal, signalFunction)
    await this._postSubscription(signal)
  }

  async _postSubscription(signal) {
    if (!this._connectionId) {
      // TODO: Throw error instead?
      return
    }
    // TODO: Make path configurable
    const path = `/pubsub/${encodeURIComponent(this._connectionId)}/${encodeURIComponent(signal)}`
    await this._fetch22.post(path)
  }
}
