const { connect, col, close } = require('../src/db');

async function run() {
  await connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27018', 'ridenest');
  const res = await col('vehicles').updateOne({ model: 'Virtus' }, { $set: { imageUrl: '/img/vehicles/virtus.webp' } });
  console.log('Virtus updated in DB:', res.modifiedCount);
  await close();
}

run().catch(console.error);
