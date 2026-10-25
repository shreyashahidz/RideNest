require('dotenv').config({ quiet: true });
const bcrypt = require('bcryptjs');
const { connect, col, close } = require('../src/db');
const { readJson } = require('../src/utils/json-store');

async function seed({ onlyIfEmpty = false } = {}) {
  await connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017', process.env.DB_NAME || 'ridenest');
  try {
    if (onlyIfEmpty && (await col('vehicles').countDocuments()) > 0) {
      console.log('Database already has data - skipping seed.');
      return;
    }
    const data = await readJson('seed.json');
    const passwordHash = await bcrypt.hash(data.password, 10);

    const ids = {};
    const names = {};
    for (const u of data.users) {
      const { key, ...rest } = u;
      const res = await col('users').findOneAndUpdate(
        { email: u.email },
        { $set: { ...rest, passwordHash }, $setOnInsert: { createdAt: new Date() } },
        { upsert: true, returnDocument: 'after' }
      );
      ids[key] = res._id;
      names[key] = u.name;
    }

    // remove old demo listings and everything attached to them
    const oldIds = await col('vehicles').distinct('_id', { ownerId: { $in: Object.values(ids) } });
    const oldBookings = await col('bookings').distinct('_id', { vehicleId: { $in: oldIds } });
    await col('reviews').deleteMany({ vehicleId: { $in: oldIds } });
    await col('agreements').deleteMany({ bookingId: { $in: oldBookings } });
    await col('bookings').deleteMany({ vehicleId: { $in: oldIds } });
    await col('vehicles').deleteMany({ _id: { $in: oldIds } });

    const vehicles = data.vehicles.map(({ owner, ...v }, i) => ({
      ...v,
      ownerId: ids[owner],
      ownerName: names[owner],
      available: true,
      createdAt: new Date(Date.now() - i * 3600e3),
    }));
    await col('vehicles').insertMany(vehicles);
    console.log(`Seeded ${data.users.length} demo users and ${vehicles.length} vehicles.`);
    console.log(`Demo logins (password ${data.password}): owner@demo.com, owner2@demo.com, owner3@demo.com, renter@demo.com`);
  } finally {
    await close();
  }
}

module.exports = { seed };

if (require.main === module) seed().catch((e) => { console.error(e); process.exit(1); });
