require('dotenv').config({ quiet: true });

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET manquant : copie .env.example en .env');
}

module.exports = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
