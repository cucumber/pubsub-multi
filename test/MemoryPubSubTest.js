const verifyPublisherContract = require('./verifyPublisherContract')

describe('MemoryPubSub', () => {
  verifyPublisherContract(async pubSub => pubSub)
})