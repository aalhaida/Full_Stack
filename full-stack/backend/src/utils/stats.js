const { promises: fsp } = require('fs');
const path = require('path');
const router = require('express').Router();

const DATA_PATH = path.join(__dirname, '../../data/items.json');
let cache = null;
let lastModified = 0;

async function getStats() {
  const { mtimeMs } = await fsp.stat(DATA_PATH);
  if (cache && lastModified === mtimeMs) return cache;

  const raw = await fsp.readFile(DATA_PATH, 'utf8');
  const data = JSON.parse(raw);

  const byCategory = data.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  cache = { total: data.length, byCategory };
  lastModified = mtimeMs;
  return cache;
}

router.get('/', async (req, res, next) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
