const assert = require('assert')
const SignalTrace = require('../src/SignalTrace')
const PubSub = require('../src/PubSub')

describe('SignalTrace', () => {
  it('throws when not enough signals are published', async () => {
    const pubSub = new PubSub(true)
    const trace = new SignalTrace(pubSub, 1)
    await trace.start()
    await pubSub.publish('WANTED')

    try {
      await trace.containsSignal('WANTED', 2)
      throw new Error('Unexpected')
    } catch (err) {
      assert.equal(err.message, 'Timed out waiting for 2 "WANTED" for 1 ms. Signal trace: ["WANTED"]')
    }
  })

  it('contains previously published signal', async () => {
    const pubSub = new PubSub(true)
    const trace = new SignalTrace(pubSub)
    await trace.start()

    await pubSub.publish('WANTED')
    await pubSub.publish('WANTED')
    await trace.containsSignal('WANTED', 2)
  })

  it('throws when not enough signals are published async', async () => {
    const pubSub = new PubSub()
    const trace = new SignalTrace(pubSub, 1)
    await trace.start()

    process.nextTick(() => pubSub.publish('WANTED').catch(err => {
      throw err
    }))
    try {
      await trace.containsSignal('WANTED', 2)
      throw new Error('Unexpected')
    } catch (err) {
      assert.equal(err.message, 'Timed out waiting for 2 "WANTED" for 1 ms. Signal trace: ["WANTED"]')
    }
  })

  it('waits for signal to be published', async () => {
    const pubSub = new PubSub()
    const trace = new SignalTrace(pubSub)
    await trace.start()
    await pubSub.publish('WANTED')

    process.nextTick(() => pubSub.publish('WANTED').catch(err => {
      throw err
    }))
    await trace.containsSignal('WANTED', 2)
  })
})