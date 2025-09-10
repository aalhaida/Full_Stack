const express = require('express');
const { promises: fsp } = require('fs');
const path = require('path');

const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../data/items.json');

// ---------- Helpers ----------
async function readData() {
  const raw = await fsp.readFile(DATA_PATH, 'utf8');
  return JSON.parse(raw);
}

async function writeData(data) {
  await fsp.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// ---------- Routes ----------

// GET /api/items
router.get('/', async (req, res, next) => {
  try {
    const { limit, q } = req.query;
    let results = await readData();

    if (q) {
      results = results.filter(item =>
        item.name.toLowerCase().includes(q.toLowerCase())
      );
    }

    if (limit) {
      results = results.slice(0, parseInt(limit, 10));
    }

    res.json(results);
  } catch (err) {
    next(err);
  }
});

// GET /api/items/:id
router.get('/:id', async (req, res, next) => {
  try {
    const data = await readData();
    const id = parseInt(req.params.id, 10);
    const item = data.find(i => i.id === id);

    if (!item) {
      const err = new Error('Item not found');
      err.status = 404;
      throw err;
    }

    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/items
router.post('/', async (req, res, next) => {
  try {
    // TODO: Validate payload
    const item = { ...req.body, id: Date.now() };

    const data = await readData();
    data.push(item);
    await writeData(data);

    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
