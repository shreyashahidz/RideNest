// Updates seed.json and currently connected MongoDB with the downloaded vehicle images
require('dotenv').config({ quiet: true });
const path = require('path');
const fs = require('fs');
const { connect, col, close } = require('../src/db');

const IMAGE_MAP = {
  'Swift': '/img/vehicles/swift.webp',
  'Creta': '/img/vehicles/creta.webp',
  'Nexon EV': '/img/vehicles/nexon-ev.webp',
  'Innova Crysta': '/img/vehicles/innova-crysta.webp',
  'City': '/img/vehicles/city.webp',
  'Thar': '/img/vehicles/thar.webp',
  'Seltos': '/img/vehicles/seltos.webp',
  'Fortuner': '/img/vehicles/fortuner.webp',
  'Baleno': '/img/vehicles/baleno.webp',
  'XUV700': '/img/vehicles/xuv700.webp',
  'Model 3': '/img/vehicles/tesla-model-3.webp',
  'Scorpio': '/img/vehicles/scorpio.webp',
  'Ertiga': '/img/vehicles/ertiga.webp',
  'i20': '/img/vehicles/i20.webp',
  'Classic 350': '/img/vehicles/classic-350.webp',
  'Activa': '/img/vehicles/activa.webp',
  'Duke 390': '/img/vehicles/duke-390.webp',
  'S1 Pro': '/img/vehicles/s1-pro.webp',
  'Pulsar NS200': '/img/vehicles/pulsar-ns200.webp',
  'Himalayan': '/img/vehicles/himalayan.webp',
  'YZF-R15': '/img/vehicles/yzf-r15.webp',
  'Apache RTR 200 4V': '/img/vehicles/apache-rtr-200.webp',
  'Splendor+': '/img/vehicles/splendor-plus.webp',
  'Bullet 350': '/img/vehicles/bullet-350.webp',
  'Dominar 400': '/img/vehicles/dominar-400.webp',
  'Access 125': '/img/vehicles/access-125.webp'
};

async function main() {
  // 1. Update data/seed.json
  const seedPath = path.join(__dirname, '..', 'data', 'seed.json');
  const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
  let seedUpdated = 0;
  for (const v of seedData.vehicles) {
    if (IMAGE_MAP[v.model]) {
      v.imageUrl = IMAGE_MAP[v.model];
      seedUpdated++;
    }
  }
  fs.writeFileSync(seedPath, JSON.stringify(seedData, null, 2), 'utf-8');
  console.log(`Updated ${seedUpdated} vehicle records in data/seed.json`);

  // 2. Connect to MongoDB and update vehicles collection
  // The dev memory server runs on 27018, or .env URI
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27018';
  const dbName = process.env.DB_NAME || 'ridenest';
  console.log(`Connecting to ${uri} / ${dbName}...`);
  try {
    await connect(uri, dbName);
    let dbUpdated = 0;
    for (const [model, imgUrl] of Object.entries(IMAGE_MAP)) {
      const res = await col('vehicles').updateMany(
        { model: model },
        { $set: { imageUrl: imgUrl } }
      );
      dbUpdated += res.modifiedCount;
    }
    console.log(`Updated ${dbUpdated} vehicle records in MongoDB collection 'vehicles'`);
  } catch (err) {
    console.error('Failed to update MongoDB (may try alternative port):', err.message);
    try {
      await close();
      // Try 27017
      console.log('Trying mongodb://127.0.0.1:27017...');
      await connect('mongodb://127.0.0.1:27017', dbName);
      let dbUpdated = 0;
      for (const [model, imgUrl] of Object.entries(IMAGE_MAP)) {
        const res = await col('vehicles').updateMany(
          { model: model },
          { $set: { imageUrl: imgUrl } }
        );
        dbUpdated += res.modifiedCount;
      }
      console.log(`Updated ${dbUpdated} vehicle records in MongoDB (27017)`);
    } catch (e2) {
      console.error('Second attempt error:', e2.message);
    }
  } finally {
    await close();
  }
}

main().catch(console.error);
