# PubSub Multi

Multiple implementations of Publish-Subscribe.

* In-memory
* HTTP EventSource and POST as transport

The library also ships with a `SignalTrace` utility which is useful for testing asynchronous code. This is inspired from
the [GOOS Book](http://www.growing-object-oriented-software.com/)'s `NotificationTrace`.

Both implementations share the same contract tests, allowing them to be used interchangeably.

The API for subscription is simple:

```javascript
// sub is an instance of PubSub or EventSourceSub
await sub.subscribe('some-signal', async () => {
  console.log('received some-signal')
})
```

The API for publishing too:

```javascript
// pub is an instance of PubSub
await pub.publish('some-signal')
```

## HTTP

To use this over HTTP, you would mount the express middleware in your express app:

```javascript
const express = require('express')
const bodyParser = require('body-parser')
const { PubSub, subRouter } = require('pubsub-multi')

const pubSub = new PubSub() // Implements both pub and sub interface
const pub = pubSub
const sub = pubSub

const app = express()
app.use(bodyParser.json())
app.use(bodyParser.text())
app.use(subRouter({ sub }))
```

To publish, you would use `pub.publish` as described above. The `subRouter` then sends signals to subscribers
using Server-Sent Events as the transport.

Clients would create asubscribe as follows:

```javascript
const HttpJsonClient = require('http-json-client') // Tiny lib that simplifies HTTP
const fetch = window.fetch.bind(window)
const httpJsonClient = new HttpJsonClient({ baseUrl, fetch })
const eventSource = new EventSource(`${baseUrl}/pubsub`)
const sub = new EventSourceSub({ httpJsonClient, eventSource })
```

To subscribe, you would use `sub.subscribe` as described above. The `EventSourceSub` registers subscriptions on the server
with HTTP POST.
