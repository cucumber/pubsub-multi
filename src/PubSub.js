/**
 * A simple pubsub implementation.
 */
module.exports = class PubSub {
  constructor() {
    this._subscriptionsBySignal = new Map()
    this._subscriptionCountResolversBySignal = new Map()
  }

  // pub interface

  async publish(signal) {
    const subscriptions = this._subscriptionsBySignal.get(signal) || new Set()
    for (const subscription of subscriptions) {
      await subscription.deliver()
    }
    const wildcardSubscriptions = this._subscriptionsBySignal.get(null) || new Set()
    for (const wildcardSubscription of wildcardSubscriptions) {
      await wildcardSubscription.deliver(signal)
    }
  }

  async subscriptions(signal, count) {
    const subscriptions = this._subscriptionsBySignal.get(signal) || new Set()
    if (subscriptions.size === count) return Promise.resolve()

    return new Promise(resolve => {
      if (!this._subscriptionCountResolversBySignal.has(signal))
        this._subscriptionCountResolversBySignal.set(signal, new Set())
      const subscriptionCountResolver = subscriptionCount => {
        if (subscriptionCount === count) resolve()
      }
      this._subscriptionCountResolversBySignal.get(signal).add(subscriptionCountResolver)
    })
  }

  // sub interface

  async subscribe(signal, signalFunction) {
    if (!this._subscriptionsBySignal.has(signal)) {
      this._subscriptionsBySignal.set(signal, new Set())
    }
    const subscriptions = this._subscriptionsBySignal.get(signal)
    const subscription = new Subscription(signal, signalFunction)
    subscriptions.add(subscription)

    const subscriptionCountResolvers = this._subscriptionCountResolversBySignal.get(signal) || new Set()
    for (const subscriptionCountResolver of subscriptionCountResolvers) {
      subscriptionCountResolver(subscriptions.size)
    }
    return subscription
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
