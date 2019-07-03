# REST_API+GraphQL

An application for a REST API and GraphQL server running on express.js.

this app uses node.js, express, mongoose, socket.io, graphQl and offers REST api and GraphQl routes.

1. run `npm install` to install the dependencies
2. write your `/setup.js` file exposing these variables:
   - MONGODB_URI: mongoDB URI
   - SERVER_PORT: server listem port
3. run `npm start` to start the application.
4. the front-ends are stand alone react apps in `/REST_API_frontend` and `/GraphQL_frontend` folders
5. run `npm install` and `npm start` on the frontend folders to start a react dev server for the applications.
