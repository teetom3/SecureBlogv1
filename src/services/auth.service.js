const bcrypt = require('bcrypt');
const User = require('../models/user.model');
const httpError = require('../utils/httpError');

// Hash factice : on fait un bcrypt.compare même si l'email n'existe pas,
// pour que la réponse prenne le même temps (évite de deviner les emails inscrits)
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 12);

const assertCredentials = (email, password) => {
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw httpError(400, 'Email et mot de passe requis');
  }
};

exports.register = async (email, password) => {
  assertCredentials(email, password);

  try {
    return await User.create({ email, password }); // hash fait par le pre('save')
  } catch (err) {
    if (err.code === 11000) throw httpError(409, 'Cet email est déjà utilisé');
    if (err.name === 'ValidationError') {
      throw httpError(400, Object.values(err.errors).map((e) => e.message).join(', '));
    }
    throw err;
  }
};

exports.login = async (email, password) => {
  assertCredentials(email, password);

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');

  const valid = user
    ? await user.comparePassword(password)
    : await bcrypt.compare(password, DUMMY_HASH);

  if (!valid) throw httpError(401, 'Identifiants invalides');

  return user;
};

exports.getUserById = (id) => User.findById(id);
