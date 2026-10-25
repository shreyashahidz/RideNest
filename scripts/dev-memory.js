const path = require('path');
const fs = require('fs');

(async () => {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const dbPath = path.join(__dirname, '..', 'data', '.mongo');
  fs.mkdirSync(dbPath, { recursive: true });
  const mongod = await MongoMemoryServer.create({
    instance: { dbPath, storageEngine: 'wiredTiger', port: 27018 },
  });
  process.env.MONGODB_URI = mongod.getUri();
  console.log('Embedded MongoDB started at', process.env.MONGODB_URI);

  if (!process.env.SKIP_SEED) {
    const { seed } = require('./seed');
    await seed({ onlyIfEmpty: true });
  }
  process.on('SIGINT', async () => { await mongod.stop(); process.exit(0); });
  require('../server');
})();
