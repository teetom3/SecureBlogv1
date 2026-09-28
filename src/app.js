const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const { corsOrigin } = require('./config');
const { sessionMiddleware } = require('./config/session');
const routes = require('./routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({ origin: corsOrigin, credentials: true })); // credentials → le navigateur envoie le cookie
app.use(express.json({ limit: '10kb' }));
app.use(morgan('dev'));
app.use(sessionMiddleware);

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
