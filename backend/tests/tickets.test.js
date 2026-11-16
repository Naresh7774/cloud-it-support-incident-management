const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { JWT_SECRET } = require('../src/middleware/authMiddleware');

describe('Ticket Validation & Route Protection Tests', () => {
  const userToken = jwt.sign(
    { id: 3, name: 'Test User', email: 'user@cloudsupport.local', role: 'user' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  test('POST /api/tickets should fail with 401 if unauthenticated', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .send({ title: 'Test Ticket', description: 'Some description', category: 'Network' });
    expect(res.status).toBe(401);
  });

  test('POST /api/tickets should fail with 400 validation error if title or description is missing', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: '', description: '', category: 'Network' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  test('POST /api/tickets should reject invalid priority levels', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Valid Title',
        description: 'Valid Description',
        category: 'Network',
        priority: 'SuperUrgent' // Invalid
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('PUT /api/tickets/1/assign should deny access to regular users (403)', async () => {
    const res = await request(app)
      .put('/api/tickets/1/assign')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ engineerId: 2 });
    expect(res.status).toBe(403);
  });
});
