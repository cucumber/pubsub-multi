const uuid = require('uuid/v4')
const PubSub = require('./MemoryPublisher')

module.exports = class EventSourceSub {
  constructor({ fetch22, eventSource }) {
    this._pubSub = new PubSub()
    this._subscriberById = new Map()

    if (!fetch22) throw new Error("No fetch22")
    if (!eventSource) throw new Error("No eventSource")
    this._fetch22 = fetch22
    eventSource.onerror = e => {
      this._connectionId = null
    }

    eventSource.addEventListener('pubsub-signal', e => {
      const { subscriberId, subscribedSignal, signal, args } = JSON.parse(e.data)
      const subscriber = this._subscriberById.get(subscriberId)
      if(!subscriber) throw new Error(`Unknown subscriber ${subscriberId}`)
      subscriber.publish(signal, ...args)
        .catch(err => console.error('Signalling failed', err))
    })

    eventSource.addEventListener('pubsub-connectionId', e => {
      this._connectionId = e.data
      // This event handler will be called again on reconnect, so we need
      // to resubscribe in that case
      this._postSubscriptions()
        .catch(err => console.error('Failed to post subscriptions', err))
    })
  }

  makeSubscriber(id = uuid()) {
    const subscriber = new PostSubscriber(this._pubSub.makeSubscriber(id), this)
    this._subscriberById.set(id, subscriber)
    return subscriber
  }

  async _postSubscription(subscriberId, signal) {
    if (!this._connectionId) {
      return
    }
    const path = `/pubsub/${encodeURIComponent(this._connectionId)}/${encodeURIComponent(subscriberId)}`
    await this._fetch22.post(path, signal)
  }

  async _postSubscriptions() {
    for(const subscriber of this._subscriberById.values()) {
      await subscriber._postSubscriptions()
    }
  }
}

class PostSubscriber {
  constructor(subscriber, transport) {
    this._subscriber = subscriber
    this._transport = transport
  }

  get id() {
    return this._subscriber.id
  }

  async subscribe(signal, signalFunction) {
    await this._subscriber.subscribe(signal, signalFunction)
    await this._transport._postSubscription(this.id, signal)
  }

  async publish(signal, ...args) {
    return this._subscriber.publish(signal, ...args)
  }

  async _postSubscriptions() {
    for(const subscription of this._subscriber.subscriptions) {
      await this._transport._postSubscription(this.id, subscription.signal)
    }
  }
}
