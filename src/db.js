const { MongoClient } = require('mongodb');

let client;
let db;

async function connect(uri, dbName) {
  client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  db = client.db(dbName);
  await ensureIndexes();
  return db;
}

function getDb() {
  if (!db) throw new Error('Database not connected');
  return db;
}

const col = (name) => getDb().collection(name);

async function ensureIndexes() {
  await col('users').createIndex({ email: 1 }, { unique: true });

  await col('vehicles').createIndex(
    { make: 'text', model: 'text', city: 'text', description: 'text' },
    { name: 'vehicle_text' }
  );
  await col('vehicles').createIndex({ city: 1, type: 1, pricePerDay: 1 });
  await col('vehicles').createIndex({ ownerId: 1 });

  await col('bookings').createIndex({ vehicleId: 1, pickupAt: 1, dropAt: 1 });
  await col('bookings').createIndex({ renterId: 1, createdAt: -1 });
  await col('bookings').createIndex({ ownerId: 1, createdAt: -1 });

  await col('agreements').createIndex({ bookingId: 1 }, { unique: true });
  await col('agreements').createIndex({ agreementNo: 1 }, { unique: true });

  await col('reviews').createIndex({ vehicleId: 1, createdAt: -1 });
  await col('reviews').createIndex({ bookingId: 1 }, { unique: true });
}

async function close() {
  if (client) await client.close();
}

module.exports = { connect, getDb, col, close };
