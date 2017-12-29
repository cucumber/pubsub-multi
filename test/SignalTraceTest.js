const assert = require('assert')
const SignalTrace = require('../src/SignalTrace')
const PubSub = require('../src/PubSub')

describe('SignalTrace', () => {
  it('throws when no signal is published', async () => {
    const pubSub = new PubSub(true)
    const trace = new SignalTrace(pubSub, 1)

    try {
      await trace.containsSignal('WANTED')
      throw new Error('Unexpected')
    } catch (err) {
      assert.equal(err.message, 'Timed out waiting for "WANTED" for 1 ms. Signal trace: []')
    }
  })

  it('contains previously published signal', async () => {
    const pubSub = new PubSub(true)
    const trace = new SignalTrace(pubSub)
    await trace.start()

    await pubSub.publish('WANTED')
    await trace.containsSignal('WANTED')
  })

  it('waits for signal to be published', async () => {
    const pubSub = new PubSub()
    const trace = new SignalTrace(pubSub)
    await trace.start()

    process.nextTick(() => pubSub.publish('WANTED').catch(err => {
      throw err
    }))
    await trace.containsSignal('WANTED')
  })
})