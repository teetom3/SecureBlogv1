const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const { env, mongoUri, sessionSecret } = require('./index');

const sessionCookieName = 'sid'; // nom neutre plutôt que "connect.sid" (ne révèle pas la techno)

const sessionMiddleware = session({
  name: sessionCookieName,
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,       // pas de session créée tant qu'on n'est pas connecté
  store: MongoStore.create({
    mongoUrl: mongoUri,
    collectionName: 'sessions',
    ttl: 60 * 60 * 24,            // 1 jour (en secondes)
  }),
  cookie: {
    httpOnly: true,               // inaccessible en JS → protège contre le vol par XSS
    secure: env === 'production', // HTTPS uniquement en prod
    sameSite: 'lax',              // limite le CSRF
    maxAge: 1000 * 60 * 60 * 24,  // 1 jour (en ms)
  },
});

module.exports = { sessionMiddleware, sessionCookieName };
