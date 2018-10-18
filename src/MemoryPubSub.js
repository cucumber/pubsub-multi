module.exports = class MemoryPubSub {
  constructor(immediates = {}) {
    this._subscribers = []
    this._immediates = immediates
  }

  async makeSubscriber() {
    const subscriber = new Subscriber(this._immediates)
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
  constructor(immediates) {
    this._signalFunctionsBySignal = new Map()
    this._immediates = immediates
  }

  async subscribe(signal, signalFunction) {
    if (!this._signalFunctionsBySignal.has(signal)) {
      this._signalFunctionsBySignal.set(signal, [])
    }
    this._signalFunctionsBySignal.get(signal).push(signalFunction)

    const immediate = this._immediates[signal]
    if (immediate) {
      const value = (typeof immediate === 'function') ? await immediate() : immediate
      await this._publish(signal, value)
    }
  }

  async stop() {
  }

  async _publish(signal, ...args) {
    const signalFunctions = this._signalFunctionsBySignal.get(signal) || []
    for (const signalFunction of signalFunctions) {
      await signalFunction(...args)
    }
  }
}
