const assert = require('assert')
const uuid = require('uuid/v4')
const MemoryPubSub = require('../src/MemoryPubSub')

module.exports = function verifyContract(makePubSub) {
  describe('Publisher contract', () => {
    let pubSub, subscriber
    beforeEach(async () => {
      pubSub = new MemoryPubSub()
      const pubSub2 = await makePubSub(pubSub)
      subscriber = await pubSub2.makeSubscriber(uuid())
    })

    afterEach(async () => {
      subscriber.stop()
    })

    it('publishes a signal once to each subscription', async () => {
      return new Promise(resolve => {
        subscriber.subscribe('something', async (a, b) => {
          assert.equal(a, 'a')
          assert.equal(b, 'b')
          resolve()
        })
          .then(() => pubSub.publish('something', 'a', 'b'))
      })
    })
  })
}
