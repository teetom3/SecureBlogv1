const { env } = require('./index');

const tokenCookieName = 'token';

const tokenCookieOptions = {
  httpOnly: true,               // inaccessible en JS → protège contre le vol par XSS
  secure: env === 'production', // HTTPS uniquement en prod
  sameSite: 'lax',              // limite le CSRF
  maxAge: 1000 * 60 * 60,       // 1h (en ms), aligné sur JWT_EXPIRES_IN
};

module.exports = { tokenCookieName, tokenCookieOptions };
