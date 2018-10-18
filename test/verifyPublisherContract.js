const assert = require('assert')
const uuid = require('uuid/v4')
const MemoryPubSub = require('../src/MemoryPubSub')

module.exports = function verifyContract(makePubSub) {
  describe('Publisher contract', () => {
    let pubSub, subscriber
    beforeEach(async () => {
      pubSub = new MemoryPubSub({_version: async () => 99})
      const pubSub2 = await makePubSub(pubSub)
      subscriber = await pubSub2.makeSubscriber(uuid())
    })

    afterEach(async () => {
      subscriber.stop()
    })

    it('publishes a signal once to each subscriber', async () => {
      return new Promise(resolve => {
        subscriber.subscribe('something', async (a, b) => {
          assert.equal(a, 'a')
          assert.equal(b, 'b')
          resolve()
        })
          .then(() => pubSub.publish('something', 'a', 'b'))
      })
    })

    it('publishes a version number when a subscriber subscribes', async () => {
      return new Promise(resolve => {
        subscriber.subscribe('_version', async (version) => {
          assert.equal(version, 99)
          resolve()
        })
      })
    })
  })
}
