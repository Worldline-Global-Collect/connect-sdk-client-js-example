# Lit (3.x) Connect Client SDK Example

[toc]

## What is it?

This application is a Vite application which uses [web components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) defined with [Lit](https://lit.dev) and is an implementation of a Worldline Connect checkout process.
You can use this application as a base for your own integrated Worldline Connect powered payment solution.

It offers the following features:

* payment product selection
* payment product detail pages
* co-branded cards support
* payment product grouping
* payment product switching based on IIN Lookup

The [Worldline Connect JavaScript Client SDK](https://github.com/Worldline-Global-Collect/connect-sdk-client-js) is used for all communication to the Connect API and crypto.
The application is using [Vite](https://vitejs.dev) which comes with a development server and build tooling to make this application easy to install and run.
See the [Worldline Connect Developer Hub](https://docs.connect.worldline-solutions.com/documentation/sdk/mobile/javascript/) for more information on how to use the Worldline Connect API.

## How to install

Make sure you have installed [Node.js](https://nodejs.org/en/); the LTS version is recommended. Run

```bash
npm install
```

## How to start the application

To start the development environment of Vite you can run the following command:

```bash
npm start
```

When the webserver has started, it will automatically load a page in which you have to provide details about the Worldline Connect client session and the payment details. 
This page is for example and development purposes only.

## How to start the payment process

Create a client session identifier and a customer identifier, which the Client API needs for authentication purposes.
These can be obtained by your e-commerce server using the [Server SDKs](https://docs.connect.worldline-solutions.com/documentation/sdk/server/) or directly using the [Server API](https://apireference.connect.worldline-solutions.com/s2sapi/v1/en_US/index.html). 
Use this information along with the geographical region of the Client API you want to connect to and the payment details to start the process.
If you incorporate this into your production process all this information should be used to initialize the payment process.

## In depth

This application uses the following key frameworks and libraries which are managed by npm:

* [Lit](https://lit.dev); for building web components
* [Tailwind CSS](https://tailwindcss.com); for styling the application
* [Tailwind Merge](https://www.npmjs.com/package/tailwind-merge); for merging tailwind classes (useful for component based development)
* [Tailwind Form](https://github.com/tailwindlabs/tailwindcss-forms); for reset and styling form elements
* [Floating UI](https://floating-ui.com); for floating UI elements (like PopperJS)
* [Lit Labs Motion](https://www.npmjs.com/package/@lit-labs/motion); for animating Lit elements
* [Lit Context](https://lit.dev/docs/data/context/); provide Context API for the application (global store)
* [Lit Task](https://lit.dev/docs/data/task/); handle async tasks in Lit elements
* [Vaadin Router](https://github.com/vaadin/router); for routing in the application
* [Worldline Connect Client SDK](https://github.com/Worldline-Global-Collect/connect-sdk-client-js)

## Other npm commands

| Command               | Description                                        |
|:----------------------|:---------------------------------------------------|
| `npm run analyze`     | Creates a manifest for the custom elements         |

## Folder structure

```
+-- public - The public files of the application (favicon and logo)
+-- src - The source files of the application
|   +-- types.ts - Contains global types for the app
|   +-- context.ts - Data provided from the first page (`wl-view-details.ts`) can be accessed from child web elements using this context object
|   +-- tailwind.css - Entry CSS for the tailwind
|   +-- controllers - Contains the controllers for the application (see https://lit.dev/docs/composition/controllers)
|       - session-controller.ts - The middleware for Client SDK Session 
|   +-- elements - Contains all Lit elements of the application
|       +-- icons - Contains icons for the application as lit elements
|       +-- payment-product-fields - Payment product field as element (see `./mixins/wl-field-mixin.ts`)
|           - index.ts - export the variants of the payment product field elements and contains mapping to icons / additional props
|           - wl-payment-product-field-card-number.ts - Card number as product payment field element
|           - wl-payment-product-field-default-input.ts - Default input as product payment field element
|       +-- ui - Contains presentational web components of the application such as alert, button, inputs etc.
|           ...
|       +-- views - Contains the view Lit elements of the application
|           +-- wl-view-details - First view of the application where you need to provide details about the session and payment
|           +-- wl-view-products - Second view where you'll need to select a payment method from a list of payment methods
|           +-- wl-view-group - Detail page of the payment product group
|           +-- wl-view-product - Detail page of the payment product (no group)
|           +-- wl-view-encrypted-payload - Page where the user can copy the encrypted payload
|           +-- wl-view.ts - This is the base view element which is responsible for rendering the different route views based on current route path
|   +-- mixins - Contains the mixins of the application (see https://lit.dev/docs/composition/mixins)
|       - tailwind-mixin.ts - Mixin to use Tailwind CSS classes in Lit elements (copied styles in shadow root)
|       - wl-field-mixin.ts - Mixin to glue the payment product field element with payment product field data (such as apply mask, render tooltip, validate field, etc.)
|       - wl-view-mixin.ts - Mixin to redirect to first view when Session instance is not set
|   +-- routes - Contains the page routes linked to the view web components
|   +-- utils - Handy utilities, such as `loadScript` etc.
```



## Apple Pay on the web

This full example LIT app also contains the ability to test Apple Pay on the web. 
The app needs to be up and running within a secure environment with a valid certificate to run Apple Pay on the web. 
The Apple Pay requirements can be found at the [Apple Developer documentation](https://developer.apple.com/documentation/apple_pay_on_the_web/#2110131). 
Read the documentation at [Worldline Solutions documentation page](https://docs.connect.worldline-solutions.com/documentation/apple-pay/our-certificate) how to add your secure domain to the Configuration Center for a merchant where Apple Pay is enabled. 
Make sure to download the file *"apple-developer-merchantid-domain-association"* and place this file inside the `./public/.well-known` 
directory of this codebase to expose the path `.well-know/apple-developer-merchantid-domain-association`.

The logic of Apple Pay on the web can be found at `./src/elements/views/wl-view-products/components/wl-apple-pay.ts`.



## Google Pay on the web

Google pay can be tested within your localhost and does not need to run within a secure domain. 
This full-example app implemented Google Pay according the [Worldline Solutions documentation page](https://docs.connect.worldline-solutions.com/documentation/google-pay-integration/google-pay-web-we-decrypt). 

The logic of Google Pay can be found at `./src/elements/views/wl-view-products/components/wl-google-pay.ts`
