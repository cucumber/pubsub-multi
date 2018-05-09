const assert = require('assert')
const uuid = require('uuid/v4')
const MemoryPublisher = require('../src/MemoryPublisher')
const SignalTrace = require('../src/SignalTrace')

module.exports = function verifyContract(makePublisher) {
  describe('Publisher contract', () => {
    let memoryPublisher, publisher
    beforeEach(async () => {
      memoryPublisher = new MemoryPublisher()
      publisher = await makePublisher(memoryPublisher)
    })

    it('publishes a signal once', async () => {
      let signalCount = 0
      const subscriber = publisher.makeSubscriber(uuid())
      await subscriber.subscribe('something', async (signal, a, b) => {
        assert.equal(signal, 'something')
        assert.equal(a, 'a')
        assert.equal(b, 'b')
        signalCount++
      })
      // Wait for subscription
      const subscriber2 = await memoryPublisher.subscriber(subscriber.id)
      await subscriber2.subscription('something')

      const traceSubscriber = publisher.makeSubscriber(uuid())
      const trace = new SignalTrace(traceSubscriber)
      await trace.start()
      // Wait for trace subscription
      const traceSubscriber2 = await memoryPublisher.subscriber(traceSubscriber.id)
      await traceSubscriber2.subscription(null)

      await memoryPublisher.publish('something', 'a', 'b')
      await trace.containsSignal('something', 1)
      assert.equal(signalCount, 1)
    })
  })
}
