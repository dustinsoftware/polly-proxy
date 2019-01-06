# polly proxy
A proxy server configurable at runtime that can record and replay HTTP web requests. Uses the [Polly.JS library](https://netflix.github.io/pollyjs/#/) by Netflix, and [node-http-proxy](https://github.com/nodejitsu/node-http-proxy). 

It was designed for use by applications written in any language (such as C#) that make external web requests during integration tests. Ideally you would consume Polly.JS directly in your tests so that the extra layer of indirection is unnecessary.

Usage:
* Start the polly proxy service locally before your tests run (npm run build, npm start)
* Register a service to be proxied (repeat for all services)
    * `POST /addproxy?proxyPath=${encodeURIComponent('http://myservice.example.com')}`. Returns a JSON response with the port
* Start a test session. Test data will be recorded using the provided test name. Each time `replay` is called, the current replay will be stopped and started over from the beginning.
    * `POST /replay?testName=your-unique-test-name-here`
    * Any API calls that were not present in the recorded data will be externally made and the response persisted.
* Stop the test session when your test completes
    * `POST /stop?testName=your-unique-test-name-here`
* See [this test](https://github.com/dustinsoftware/polly-proxy/blob/616a3d00a5588ab2d2bf617624ca623ed714600b/src/__tests__/server.e2e.test.ts#L66-L116) as an example for how to consume the API

Limitations:
* Does not support parallel tests
* Proxies will be automatically cleaned up after about 30 seconds
* The Polly.JS options are not yet configurable
