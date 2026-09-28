// Crée une erreur avec un code HTTP, lu par le middleware errorHandler
module.exports = (status, message) => Object.assign(new Error(message), { status });
