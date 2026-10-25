const fs = require('fs/promises');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

async function readJson(relPath) {
  const raw = await fs.readFile(path.join(DATA_DIR, relPath), 'utf8');
  return JSON.parse(raw);
}

async function writeJson(relPath, obj) {
  const full = path.join(DATA_DIR, relPath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, JSON.stringify(obj, null, 2), 'utf8');
  return full;
}

module.exports = { readJson, writeJson, DATA_DIR };
