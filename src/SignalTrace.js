module.exports = class NotificationTrace {
  constructor(sub, timeout = 100) {
    if (!sub) throw new Error('No sub')
    this._sub = sub
    this._timeout = timeout
    this._trace = []
    this._resolversBySignal = new Map()
  }

  async start() {
    await this._sub.subscribe(null, async signal => {
      this._trace.push(signal)
      const resolvers = this._resolversBySignal.get(signal) || []
      for (const resolver of resolvers) {
        resolver()
      }
    })
  }

  async containsSignal(signal) {
    if (this._trace.indexOf(signal) !== -1) return Promise.resolve()

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error(`Timed out waiting for "${signal}" for ${this._timeout} ms. Signal trace: ${JSON.stringify(this._trace)}`)),
        this._timeout
      )

      if (!this._resolversBySignal.has(signal)) {
        this._resolversBySignal.set(signal, [])
      }
      const resolver = () => {
        clearTimeout(timeout)
        resolve()
      }
      this._resolversBySignal.get(signal).push(resolver)
    })
  }
}