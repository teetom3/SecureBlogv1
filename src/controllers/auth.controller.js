const authService = require('../services/auth.service');
const { sign } = require('../utils/jwt');
const { tokenCookieName, tokenCookieOptions } = require('../config/cookie');

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
