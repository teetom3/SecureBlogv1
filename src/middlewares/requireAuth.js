const { verify } = require('../utils/jwt');
const { tokenCookieName } = require('../config/cookie');

module.exports = (req, res, next) => {
  try {
    req.user = verify(req.cookies?.[tokenCookieName]);
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
};
