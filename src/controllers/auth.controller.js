const authService = require('../services/auth.service');
const googleService = require('../services/google.service');
const { sign } = require('../utils/jwt');
const {
  tokenCookieName, tokenCookieOptions, googleCookieName, googleCookieOptions,
} = require('../config/cookie');

exports.register = async (req, res) => {
  const { email, password } = req.body ?? {};
  const user = await authService.register(email, password);
  res.status(201).json({ user });
};

exports.login = async (req, res) => {
  const { email, password } = req.body ?? {};
  const user = await authService.login(email, password);

  res.cookie(tokenCookieName, sign(user.id), tokenCookieOptions);
  res.json({ user });
};

exports.me = async (req, res) => {
  const user = await authService.getUserById(req.user.sub);

  if (!user) {
    // l'utilisateur a été supprimé mais le token est encore valide
    res.clearCookie(tokenCookieName, tokenCookieOptions);
    return res.status(401).json({ error: 'Non authentifié' });
  }

  res.json({ user });
};

exports.logout = (req, res) => {
  res.clearCookie(tokenCookieName, tokenCookieOptions);
  res.status(204).end();
};

// Aller : on garde state/nonce/codeVerifier dans un cookie temporaire, puis direction Google
exports.googleStart = (req, res) => {
  const { url, saved } = googleService.start();
  res.cookie(googleCookieName, JSON.stringify(saved), googleCookieOptions);
  res.redirect(url);
};

// Retour de Google : navigation du navigateur, donc on répond par des redirections (pas du JSON)
exports.googleCallback = async (req, res) => {
  // le cookie ne sert qu'une fois, que la connexion réussisse ou échoue
  const { maxAge, ...clearOptions } = googleCookieOptions;
  res.clearCookie(googleCookieName, clearOptions);

  try {
    const saved = JSON.parse(req.cookies?.[googleCookieName] ?? 'null');
    const identity = await googleService.callback({ query: req.query, saved });
    const user = await authService.findOrCreateGoogleUser(identity);

    res.cookie(tokenCookieName, sign(user.id), tokenCookieOptions);
    res.redirect('/');
  } catch (err) {
    console.error('Connexion Google refusée :', err.message);
    res.redirect('/login?error=google');
  }
};
