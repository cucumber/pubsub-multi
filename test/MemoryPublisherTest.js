const verifyPublisherContract = require('./verifyPublisherContract')

describe('MemoryPublisher', () => {
  verifyPublisherContract(async memoryPublisher => memoryPublisher)
})