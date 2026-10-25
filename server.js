require('dotenv').config({ quiet: true });
const { connect, close } = require('./src/db');
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
  const dbName = process.env.DB_NAME || 'ridenest';
  await connect(uri, dbName);
  console.log(`Connected to MongoDB (${dbName})`);
  const server = app.listen(PORT, () => console.log(`RideNest running at http://localhost:${PORT}`));

  const shutdown = async () => {
    server.close();
    await close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Failed to start:', err.message);
  console.error('Is MongoDB running? Set MONGODB_URI in .env, or use "npm run dev:memory".');
  process.exit(1);
});
