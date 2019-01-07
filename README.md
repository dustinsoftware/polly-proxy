# polly proxy
A proxy server configurable at runtime that can record and replay HTTP web requests. Uses the [Polly.JS library](https://netflix.github.io/pollyjs/#/) by Netflix, and [node-http-proxy](https://github.com/nodejitsu/node-http-proxy). 

It was designed for use by applications written in any language (such as C#) that make external web requests during integration tests. Ideally you would consume Polly.JS directly in your tests so that the extra layer of indirection is unnecessary.

Usage:
* Install polly-proxy via `npx polly-proxy` or `npm i -g polly-proxy`
* Start the polly proxy service locally before your tests run. 
* Register a service to be proxied. You will receive a JSON response with the open port you can send requests to. (repeat for all services)
    * `POST /addproxy?proxyPath=${encodeURIComponent('http://myservice.example.com')}`.
* Start a test session. Test data will be recorded using the provided test name. 
    * `POST /replay?testName=your-unique-test-name-here`
    * Any API calls that were not present in the recorded data will be externally made and the response persisted.
		* Each time `replay` is called, the current replay will be stopped and started over from the beginning.
* Make HTTP requests from your app, but change the base URL to http://localhost:(port). For example, if the port returned `/addproxy` was 56064, and the URL was http://myservice.example.com/getsomething/foo, have your app make requests to http://localhost:56064/getsomething/foo.
    * Right now the order of the requests does not matter, but you can fork this library and change the polly settings to whatever you want [here](https://github.com/dustinsoftware/polly-proxy/blob/487505dd0ed63b7bac18d5a047ecce651aefa7a9/src/polly-service.ts#L31-L33)
* Stop the test session when your test completes. This will record a HAR file to disk locally, which will be used in future replays.
    * `POST /stop?testName=your-unique-test-name-here`
* See [this test](https://github.com/dustinsoftware/polly-proxy/blob/616a3d00a5588ab2d2bf617624ca623ed714600b/src/__tests__/server.e2e.test.ts#L66-L116) as an example for how to consume the API
* Read the [Polly.JS documentation](https://netflix.github.io/pollyjs/#/) for more information on how the record-replay logic works.

Limitations:
* Does not support parallel tests (yet!)
* Proxies will be automatically cleaned up after a short time
* The Polly.JS options are not yet configurable. Fork this library or open an issue with what you'd like to see exposed.
