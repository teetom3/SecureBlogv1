const authService = require('../services/auth.service');
const { sessionCookieName } = require('../config/session');

// Transforme les callbacks de express-session en promesses
const regenerate = (req) => new Promise((resolve, reject) =>
  req.session.regenerate((err) => (err ? reject(err) : resolve())));
const save = (req) => new Promise((resolve, reject) =>
  req.session.save((err) => (err ? reject(err) : resolve())));

exports.register = async (req, res) => {
  const { email, password } = req.body ?? {};
  const user = await authService.register(email, password);
  res.status(201).json({ user });
};

exports.login = async (req, res) => {
  const { email, password } = req.body ?? {};
  const user = await authService.login(email, password);

  await regenerate(req); // nouvel ID de session → anti fixation de session
  req.session.userId = user.id;
  await save(req);

  res.json({ user });
};

exports.me = async (req, res) => {
  const user = await authService.getUserById(req.session.userId);

  if (!user) {
    // l'utilisateur a été supprimé mais la session existe encore
    req.session.destroy(() => {});
    return res.status(401).json({ error: 'Non authentifié' });
  }

  res.json({ user });
};

exports.logout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie(sessionCookieName);
    res.status(204).end();
  });
};
