const request = require('supertest');
const app = require('../src/index'); // or app.js if you export

describe('Items API', () => {
  it('GET /api/items works', async () => {
    const res = await request(app).get('/api/items?limit=2');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/items?q filters', async () => {
    const res = await request(app).get('/api/items?q=alpha');
    expect(res.status).toBe(200);
    expect(res.body.some(i => i.name.toLowerCase().includes('alpha'))).toBe(true);
  });

  it('GET /api/stats returns totals', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('byCategory');
  });
});
