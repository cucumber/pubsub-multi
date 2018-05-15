const express = require('express')
const bodyParser = require('body-parser')
const fetch = require('node-fetch')
const EventSource = require('eventsource')
const Fetch22 = require('fetch-22')
const {WebServer} = require('express-extensions')
const EventSourcePubSub = require('../src/EventSourcePubSub')
const pubSubRouter = require('../src/pubSubRouter')
const verifyPublisherContract = require('./verifyPublisherContract')

describe('EventSourcePubSub', () => {
  let webServer, port

  verifyPublisherContract(async pubSub => makeEventSourcePublisher(pubSub))

  async function makeEventSourcePublisher(pubSub) {
    const app = express()
    app.use(bodyParser.json())
    app.use(bodyParser.text())
    app.use(pubSubRouter(pubSub))
    webServer = new WebServer(app)
    port = await webServer.listen(0)
    const baseUrl = `http://localhost:${port}`
    const fetch22 = new Fetch22({baseUrl, fetch})
    const eventSourceUrl = `${baseUrl}/pubsub`;
    return new EventSourcePubSub({fetch22, EventSource, eventSourceUrl})
  }

  afterEach(async () => {
    await webServer.stop()
  })
})