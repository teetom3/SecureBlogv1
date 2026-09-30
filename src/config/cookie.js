const { env } = require('./index');

const tokenCookieName = 'token';

const tokenCookieOptions = {
  httpOnly: true,               // inaccessible en JS → protège contre le vol par XSS
  secure: env === 'production', // HTTPS uniquement en prod
  sameSite: 'lax',              // limite le CSRF
  maxAge: 1000 * 60 * 60,       // 1h (en ms), aligné sur JWT_EXPIRES_IN
};

// Cookie temporaire de la connexion Google (state, nonce, codeVerifier)
const googleCookieName = 'google';
const googleCookieOptions = {
  httpOnly: true,
  secure: env === 'production',
  sameSite: 'lax',              // lax (pas strict) : doit revenir lors de la redirection depuis Google
  maxAge: 1000 * 60 * 10,       // 10 min pour se connecter chez Google
  path: '/api/google',          // envoyé uniquement aux routes Google
};

module.exports = { tokenCookieName, tokenCookieOptions, googleCookieName, googleCookieOptions };
