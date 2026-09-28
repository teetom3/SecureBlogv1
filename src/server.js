const app = require('./app');
const { port, env } = require('./config');
const connectDB = require('./config/database');


connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port} (${env})`);
  });

}).catch((error) => {
  console.error('Error connecting to the database:', error);
  process.exit(1);
});