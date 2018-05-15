module.exports = class MemoryPubSub {
  constructor() {
    this._subscribers = []
  }

  async makeSubscriber() {
    const subscriber = new Subscriber()
    this._subscribers.push(subscriber)
    return subscriber
  }

  async publish(signal, ...args) {
    for (const subscriber of this._subscribers) {
      await subscriber._publish(signal, ...args)
    }
  }
}

class Subscriber {
  constructor() {
    this._signalFunctionsBySignal = new Map()
  }

  async subscribe(signal, signalFunction) {
    if (!this._signalFunctionsBySignal.has(signal)) {
      this._signalFunctionsBySignal.set(signal, [])
    }
    this._signalFunctionsBySignal.get(signal).push(signalFunction)
  }

  async stop() {}

  async _publish(signal, ...args) {
    const signalFunctions = this._signalFunctionsBySignal.get(signal)
    for (const signalFunction of signalFunctions) {
      await signalFunction(...args)
    }
  }
}
