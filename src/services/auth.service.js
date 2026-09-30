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

  if(!password) throw httpError(400, 'Identifiants invalides');

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');

  // un compte créé via Google n'a pas de mot de passe : traité comme "introuvable"
  const valid = user?.password
    ? await user.comparePassword(password)
    : await bcrypt.compare(password, DUMMY_HASH);

  if (!valid) throw httpError(401, 'Identifiants invalides');

  return user;
};

// Connexion Google : retrouve l'utilisateur, relie un compte existant, ou en crée un
// (appelé uniquement avec un email vérifié par Google, sinon la liaison serait une faille)
exports.findOrCreateGoogleUser = async ({ googleId, email }) => {
  const byGoogleId = await User.findOne({ googleId });
  if (byGoogleId) return byGoogleId;

  const byEmail = await User.findOne({ email: email.toLowerCase() });
  if (byEmail) {
    byEmail.googleId = googleId;
    return byEmail.save();
  }

  return User.create({ email, googleId });
};

exports.getUserById = (id) => User.findById(id);


// Connexion GitHub : retrouve l'utilisateur, relie un compte existant, ou en crée un
// (appelé uniquement avec l'email principal ET vérifié de GitHub, sinon la liaison serait une faille)
exports.findOrCreateGithubUser = async ({ githubId, email }) => {
  const byGithubId = await User.findOne({ githubId });
  if (byGithubId) return byGithubId;

  const normalizedEmail = email.trim().toLowerCase();
  const byEmail = await User.findOne({ email: normalizedEmail });

  if (byEmail) {
    // Le compte est déjà relié à un AUTRE compte GitHub : on refuse plutôt que d'écraser
    if (byEmail.githubId && byEmail.githubId !== githubId) {
      throw httpError(409, 'Ce compte est déjà relié à un autre compte GitHub');
    }
    byEmail.githubId = githubId;
    return byEmail.save();
  }

  try {
    return await User.create({ email: normalizedEmail, githubId });
  } catch (err) {
    // Deux callbacks simultanés (double clic) : le second tombe sur l'index unique
    if (err.code === 11000) return User.findOne({ githubId });
    throw err;
  }
};