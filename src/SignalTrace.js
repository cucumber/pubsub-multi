module.exports = class NotificationTrace {
  constructor(subscriber, timeout = 100) {
    if (!subscriber) throw new Error('No subscriber')
    this._subscriber = subscriber
    this._timeout = timeout
    this._trace = []
    this._resolversBySignal = new Map()
  }

  async start() {
    await this._subscriber.subscribe(null, async signal => {
      this._trace.push(signal)
      const resolvers = this._resolversBySignal.get(signal) || []
      for (const resolver of resolvers) {
        resolver()
      }
    })
  }

  async containsSignal(signal, count=1) {
    const traceCount = this._trace.reduce((total, sig) => sig === signal ? total + 1 : total, 0)
    if (traceCount === count) return Promise.resolve()

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error(`Timed out waiting for ${count} "${signal}" for ${this._timeout} ms. Signal trace: ${JSON.stringify(this._trace)}`)),
        this._timeout
      )

      if (!this._resolversBySignal.has(signal)) {
        this._resolversBySignal.set(signal, [])
      }
      const resolver = () => {
        const traceCount = this._trace.reduce((total, sig) => sig === signal ? total + 1 : total, 0)
        if (traceCount === count) {
          clearTimeout(timeout)
          resolve()
        }
      }
      this._resolversBySignal.get(signal).push(resolver)
    })
  }
}