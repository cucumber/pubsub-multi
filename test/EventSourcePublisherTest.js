const express = require('express')
const bodyParser = require('body-parser')
const fetch = require('node-fetch')
const EventSource = require('eventsource')
const Fetch22 = require('fetch-22')
const { WebServer } = require('express-extensions')
const EventSourcePublisher = require('../src/EventSourcePublisher')
const pubSubRouter = require('../src/pubSubRouter')
const verifyPublisherContract = require('./verifyPublisherContract')

describe('EventSourcePublisher', () => {
  let webServer, port, eventSource

  verifyPublisherContract(async memoryPublisher => makeEventSourcePublisher(memoryPublisher))

  async function makeEventSourcePublisher(memoryPublisher) {
    const app = express()
    // subscription keys can be either JSON or strings
    app.use(bodyParser.json())
    app.use(bodyParser.text())
    app.use(pubSubRouter({ publisher: memoryPublisher, retry: 10 }))
    webServer = new WebServer(app)
    port = await webServer.listen(0)
    const baseUrl = `http://localhost:${port}`
    const fetch22 = new Fetch22({ baseUrl, fetch })
    eventSource = new EventSource(`${baseUrl}/pubsub`)
    return new EventSourcePublisher({ fetch22, eventSource })
  }

  afterEach(async () => {
    eventSource.close()
    // await new Promise(resolve => setTimeout(resolve, 2000))
    await webServer.stop()
  })
})