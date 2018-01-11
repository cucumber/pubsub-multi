const assert = require('assert')
const SignalTrace = require('../src/SignalTrace')
const MemoryPublisher = require('../src/MemoryPublisher')

describe('SignalTrace', () => {
  let publisher, subscriber
  beforeEach(() => {
    publisher = new MemoryPublisher()
    subscriber = publisher.makeSubscriber()
  })
  
  it('throws when not enough signals are published', async () => {
    const trace = new SignalTrace(subscriber, 1)
    await trace.start()
    await publisher.publish('WANTED')

    try {
      await trace.containsSignal('WANTED', 2)
      throw new Error('Unexpected')
    } catch (err) {
      assert.equal(err.message, 'Timed out waiting for 2 "WANTED" for 1 ms. Signal trace: ["WANTED"]')
    }
  })

  it('contains previously published signal', async () => {
    const trace = new SignalTrace(subscriber)
    await trace.start()

    await publisher.publish('WANTED')
    await publisher.publish('WANTED')
    await trace.containsSignal('WANTED', 2)
  })

  it('throws when not enough signals are published async', async () => {
    const trace = new SignalTrace(subscriber, 1)
    await trace.start()

    process.nextTick(() => publisher.publish('WANTED').catch(err => {
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
    const trace = new SignalTrace(subscriber)
    await trace.start()
    await publisher.publish('WANTED')

    process.nextTick(() => publisher.publish('WANTED').catch(err => {
      throw err
    }))
    await trace.containsSignal('WANTED', 2)
  })
})