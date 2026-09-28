require('dotenv').config({ quiet: true });

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET manquant : copie .env.example en .env');
}

module.exports = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI,
  sessionSecret: process.env.SESSION_SECRET,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
