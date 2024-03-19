# browserify Connect Client SDK Example

🚨 Please note that this example is only compatible with SDK versions up to major version 4. 
To see how to include version 5+, please refer to the minimal vite-esm or webpack example.

### What is it?

This example shows you how to load the [Worldline Connect JavaScript Client SDK](https://github.com/Worldline-Global-Collect/connect-sdk-client-js) with the browserify module loader.

The Connect SDK is used for all communication to the Worldline Connect Server API and crypto. 
See the [Worldline Connect Developer Hub](https://docs.connect.worldline-solutions.com/documentation/sdk/mobile/javascript/) for more information on how to use the Worldline Connect Client API.
A complete copy of forge is included. which is used to do the actual crypto.

### How to install

Make sure you have installed [Node.js](https://nodejs.org/en/); the LTS version is recommended. Run

```bash
npm install
```

Get a copy of [forge](https://github.com/digitalbazaar/forge/) and build it following the guide on GitHub. You have to use this build since forge is incompatible with module loaders at the moment.
Place the minified version in `dist/js`. A forge package is included in this example but you should update it to the latest version.

### How to start the payment process

Create a client session identifier and a customer identifier, which the Client API needs for authentication purposes.  
These can be obtained by your e-commerce server using the [Server SDKs](https://docs.connect.worldline-solutions.com/documentation/sdk/server/) or directly using 
the [Server API](https://apireference.connect.worldline-solutions.com/s2sapi/v1/index.html). Use this information along with the geographical region of the Client API you want to connect to and the payment details to start the process.  
If you incorporate this into your production process all this information should be used to initialize the payment process.

In `app.js` you include the session details, this is the only file that is browserify specific. See `create-payload.js` on how to set-up the actual payment request which is the same for all module loaders.

### Folder structure

```
+-- dist
|   +-- js
|       -- app.bundle.js - the example app bundled with browserify
|       -- create-payload.js - generic code which provides an example on how the SDK works, this is common for all minimal examples
|       -- forge.min.js - the encryption library; self packed since it's incompatible with webpack
+-- node_modules
|   ... folder containing all node dependencies; run npm install to get the dependencies
+-- src
|   +-- js
|       +-- app.js - the example app itself
|-- index.html - html page as start page
```
