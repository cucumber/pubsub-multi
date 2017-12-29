const PubSub = require('./PubSub')

module.exports = class EventSourceSub {
  constructor({ fetch22, eventSource }) {
    if (!fetch22) throw new Error("No fetch22")
    if (!eventSource) throw new Error("No eventSource")
    this._fetch22 = fetch22
    this._pubSub = new PubSub(true)
    this._subscriptions = []

    eventSource.onerror = e => {
      this._connectionId = null
    }
    eventSource.addEventListener('pubsub-signal', e => {
      const signal = JSON.parse(e.data)
      this._pubSub.publish(signal)
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

  async subscribe(signal, signalFunction) {
    const subscription = await this._pubSub.subscribe(signal, signalFunction)
    this._subscriptions.push(subscription)
    if (this._connectionId)
      await this._postSubscription()
    return subscription
  }

  async _postSubscriptions() {
    for (const subscription of this._subscriptions) {
      await this._postSubscription(subscription.signal)
    }
  }

  async _postSubscription(signal) {
    if (!this._connectionId) throw new Error(`Shouldn't post subscription when disconnected`)
    const path = `/pubsub/${encodeURIComponent(this._connectionId)}`
    await this._fetch22.post(path, signal)
  }
}

