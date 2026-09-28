const bcrypt = require('bcrypt');
const User = require('../models/User');


exports.register = async (email, password) => {

    if (typeof email !== 'string' || typeof password !== 'string') {
        throw httpError(400, 'Email et/ou mot de passe invalide');
    }

};

try {
    const user = await User.create({
      email: email.trim().toLowerCase(),
      passwordHash,
    });
}