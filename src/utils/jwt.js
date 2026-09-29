const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config');

// Crée un token signé contenant l'id de l'utilisateur ("sub" = subject)
exports.sign = (userId) =>
  jwt.sign({ sub: userId }, jwtSecret, { algorithm: 'HS256', expiresIn: jwtExpiresIn });

// Renvoie le payload si le token est valide, lève une erreur sinon (falsifié, expiré, absent)
// algorithms imposé → refuse "none" et la confusion d'algorithme
exports.verify = (token) => jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
