const uuid = require('uuid/v4')

/**
 * A simple pubsub implementation.
 */
module.exports = class PubSub {
  constructor() {
    this._subscriberById = new Map()
    this._subscriberResolveById = new Map()
  }

  /**
   */
  async publish(signal) {
    for(const subscriber of this._subscriberById.values()) {
      await subscriber.publish(signal)
    }
  }
  
  async subscriptions(subscriberId, signal, count) {
    const subscriber = this._subscriberById.get(subscriberId)
    if(!subscriber) throw new Error(`No subscriber for ${subscriberId}. ${this._subscriberById.size} ids: ${[...this._subscriberById.keys()]}`)
    return subscriber.subscriptions(signal, count)
  }

  makeSubscriber(id = uuid()) {
    const subscriber = new Subscriber(id)
    this._subscriberById.set(id, subscriber)
    if(this._subscriberResolveById.has(id))
      this._subscriberResolveById.get(id)(subscriber)
    return subscriber
  }
  
  async subscriber(id) {
    if(this._subscriberById.has(id)) 
      return Promise.resolve(this._subscriberById.get(id))
    return new Promise(resolve => {
      this._subscriberResolveById.set(id, resolve)
    })
  }
}

class Subscriber {
  constructor(id) {
    this._subscriptionBySignal = new Map()
    this._subscriptionCountResolversBySignal = new Map()
    this._id = id
  }

  get id() {
    return this._id
  }
  
  get subscriptions() {
    return this._subscriptionBySignal.values()
  }

  async subscribe(signal, signalFunction) {
    if (this._subscriptionBySignal.has(signal)) {
      //console.error(`Already subscribed to ${signal} - ignoring`)
      return
    }
    const subscription = new Subscription(signal, signalFunction)
    this._subscriptionBySignal.set(signal, subscription)

    const subscriptionCountResolvers = this._subscriptionCountResolversBySignal.get(signal) || new Set()
    for (const subscriptionCountResolver of subscriptionCountResolvers) {
      subscriptionCountResolver(subscriptions.size)
    }
  }
  
  /**
   * Wait for subscriptions to be established
   */
  async subscription(signal) {
    if (this._subscriptionBySignal.has(signal)) return Promise.resolve()

    return new Promise(resolve => {
      if (!this._subscriptionCountResolversBySignal.has(signal))
        this._subscriptionCountResolversBySignal.set(signal, new Set())
      const subscriptionCountResolver = subscriptionCount => {
        if (subscriptionCount === count) resolve()
      }
      this._subscriptionCountResolversBySignal.get(signal).add(subscriptionCountResolver)
    })
  }

  async publish(signal) {
    const subscription = this._subscriptionBySignal.get(signal)
    if (subscription) {
      await subscription.deliver(signal)
    }
    const wildcardSubscription = this._subscriptionBySignal.get(null)
    if (wildcardSubscription) {
      await wildcardSubscription.deliver(signal)
    }
  }
}

class Subscription {
  constructor(signal, signalFunction) {
    this._signal = signal
    this._signalFunction = signalFunction
  }

  get signal() {
    return this._signal
  }

  async deliver(signal) {
    await this._signalFunction(signal)
  }
}
