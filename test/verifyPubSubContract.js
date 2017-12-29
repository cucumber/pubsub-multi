const assert = require('assert')
const PubSub = require('../src/PubSub')
const SignalTrace = require('../src/SignalTrace')

module.exports = function verifyContract(makeSub) {
  describe('PubSub contract', () => {
    let pub, sub
    beforeEach(async () => {
      const pubSub = new PubSub()
      pub = pubSub
      sub = await makeSub({ sub: pubSub })
    })

    it('publishes', async () => {
      let signalCount = 0
      await sub.subscribe('something', async () => {
        signalCount++
      })

      const trace = new SignalTrace(sub)
      await trace.start()

      await pub.subscriptions(null, 1)
      await pub.subscriptions('something', 1)
      await pub.publish('something')
      await trace.containsSignal('something')
      assert.equal(signalCount, 1)
    })
  })
}
