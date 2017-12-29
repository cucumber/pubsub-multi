const express = require('express')
const bodyParser = require('body-parser')
const fetch = require('node-fetch')
const EventSource = require('eventsource')
const Fetch22 = require('fetch-22')
const { WebServer } = require('express-extensions')
const PubSub = require('../src/PubSub')
const EventSourceSub = require('../src/EventSourceSub')
const SignalTrace = require('../src/SignalTrace')
const subRouter = require('../src/subRouter')
const verifyContract = require('./verifyPubSubContract')

describe('EventSourceSub', () => {
  let webServer, port, eventSource

  verifyContract(async ({ sub }) => {
    return makeEventSourceSub(sub)
  })

  async function makeEventSourceSub(sub) {
    const app = express()
    // subscription keys can be either JSON or strings
    app.use(bodyParser.json())
    app.use(bodyParser.text())
    app.use(subRouter({ sub, retry: 10 }))
    webServer = new WebServer(app)
    port = await webServer.listen(0)
    const baseUrl = `http://localhost:${port}`
    const fetch22 = new Fetch22({ baseUrl, fetch })
    eventSource = new EventSource(`${baseUrl}/pubsub`)
    return new EventSourceSub({ fetch22, eventSource })
  }

  afterEach(async () => {
    eventSource.close()
    // await new Promise(resolve => setTimeout(resolve, 2000))
    await webServer.stop()
  })
})