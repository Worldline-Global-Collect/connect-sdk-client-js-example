# [Vite](https://vitejs.dev) Connect Client SDK Example with ESM

### What is it?

This example shows you how to load the
[Worldline Connect JavaScript Client SDK](https://github.com/Worldline-Global-Collect/connect-sdk-client-js) with 
[Vite](https://vitejs.dev/guide/features.html) as an ESM module.

The Connect SDK is used for all communication to the Worldline Connect Server API and crypto.
See [Worldline Connect Developer Hub](https://docs.connect.worldline-solutions.com/documentation/sdk/mobile/javascript/) for more
information on how to use the Worldline Connect Client API.

### How to install

Make sure you have installed [Node.js](https://nodejs.org/en/); the LTS version is recommended. Run

```bash
npm install
```

### How to start the payment process

Create a client session identifier and a customer identifier, which the Client API needs for authentication purposes.
These can be obtained by your e-commerce server using the [Server SDKs](https://docs.connect.worldline-solutions.com/documentation/sdk/server/) or directly using the [Server API](https://apireference.connect.worldline-solutions.com/s2sapi/v1/index.html). 
Use this information along with the geographical region of the Client API
you want to connect to and the payment details to start the process. 
If you incorporate this into your production process all this information should be used to initialize the payment process.

Create an environment file `.env` with the following variable names:

```dotenv
VITE_ASSET_URL="xxx"
VITE_CLIENT_API_URL="xxx"
VITE_CLIENT_SESSION_ID="xxx"
VITE_CUSTOMER_ID="xxx"
```

Replace `xxx` with correct values from the session details. 
Once these env variables are set, you'll be able to start Vite dev-server by running command:

```bash
npm start
```

### Folder structure

```
+-- src
|   -- app.ts - the ESM module entry point (loaded in `index.html`)
|   -- create-payload.ts - generic code which provides an example on how the SDK works
|   -- get-supoported-iin-details.ts - helper function to get IinDetailsResponse instance only when status is `"SUPPORTED"`
|   -- promise-with-error.ts - helper function to wrap a promise and override the error message if promise is being rejected
|   -- vite-env.d.ts - typescript declaration file for Vite; this adds typescript support for Vite's environmnet variables
|   -- types.ts - shared types
+-- node_modules
|   ... folder containing all node dependencies; run `npm install` to get the dependencies
|-- index.html - html page as start page
|-- tsconfig.json - typescript configuration file
```
