const { env } = require('../config');

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 && env === 'production' ? 'Internal server error' : err.message,
  });
};
