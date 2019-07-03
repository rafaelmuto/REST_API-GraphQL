console.log('==> starting app.js');

// importing modules:
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const graphqlHttp = require('express-graphql');

// importing resources:
const SETUP = require('./SETUP');
const feedRouter = require('./routes/feedRouter');
const authRouter = require('./routes/authRouter');
const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');

// initilzing express.js:
const app = express();

// multer setup:
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toString() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// ==> middlewares:

// initializing body-parser for json parse:
// application/json
app.use(bodyParser.json());
// multer:
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));
// serving static folder:
app.use('/images', express.static(path.join(__dirname, 'images')));

// middleware to allow CORS (Cross-Origin Resource Sharing):
app.use((req, res, nxt) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  nxt();
});

// GraphQL Route:
app.use(
  '/graphql',
  graphqlHttp({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    formatError(err) {
      if (!err.originalError) {
        return err;
      }
      const data = err.originalError.data;
      const message = err.message || 'some error occurred.';
      const code = err.originalError.code || 500;
      return { message: message, status: code, data: data };
    }
  })
);

// REST-API Routes:
app.use('/feed', feedRouter);
app.use('/auth', authRouter);

// error route middleware:
app.use((err, req, res, nxt) => {
  console.log(err);
  const status = err.statusCode || 500;
  const message = err.message;
  const data = err.data;
  res.status(status).json({ message: message, data: data });
});

mongoose
  .connect(SETUP.MONGODB_URI, { useNewUrlParser: true })
  .then(res => {
    console.log('-> Mongoose Connection OK!');
    console.log('-> starting server on port ' + SETUP.PORT);
    const server = app.listen(SETUP.PORT);
    const io = require('./socket').init(server);
    io.on('connection', socket => {
      console.log('client connected!');
    });
  })
  .catch(err => console.log(err));
