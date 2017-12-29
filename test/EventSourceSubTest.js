const express = require('express')
const bodyParser = require('body-parser')
const fetch = require('node-fetch')
const EventSource = require('eventsource')
const HttpJsonClient = require('http-json-client')
const PubSub = require('../src/PubSub')
const EventSourceSub = require('../src/EventSourceSub')
const SignalTrace = require('../src/SignalTrace')
const subRouter = require('../src/subRouter')
const { WebServer } = require('express-extensions')
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
    const httpJsonClient = new HttpJsonClient({ baseUrl, fetch })
    eventSource = new EventSource(`${baseUrl}/pubsub`)
    return new EventSourceSub({ httpJsonClient, eventSource })
  }

  afterEach(async () => {
    eventSource.close()
    // await new Promise(resolve => setTimeout(resolve, 2000))
    await webServer.stop()
  })
})