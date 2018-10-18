const express = require('express')
const bodyParser = require('body-parser')
const fetch = require('node-fetch')
const EventSource = require('eventsource')
const {WebServer} = require('express-extensions')
const EventSourcePubSub = require('../src/EventSourcePubSub')
const pubSubRouter = require('../src/pubSubRouter')
const verifyPublisherContract = require('./verifyPublisherContract')

const BASEPATH = '/blablabl'

describe('EventSourcePubSub', () => {
  let webServer, port

  verifyPublisherContract(async pubSub => makeEventSourcePublisher(pubSub))

  async function makeEventSourcePublisher(pubSub) {
    const app = express()
    app.use(bodyParser.json())
    app.use(bodyParser.text())
    app.use(pubSubRouter(pubSub, BASEPATH))
    webServer = new WebServer(app)
    port = await webServer.listen(0)
    const baseUrl = `http://localhost:${port}${BASEPATH}`
    return new EventSourcePubSub(fetch, EventSource, baseUrl)
  }

  afterEach(async () => {
    await webServer.stop()
  })
})
