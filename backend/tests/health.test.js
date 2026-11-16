const request = require('supertest');
const app = require('../src/app');

describe('Health Check API Tests', () => {
  test('GET /health should return 200 or 503 with structured health status and system metrics', async () => {
    const response = await request(app).get('/health');
    
    // Status can be 200 (if DB connected) or 503 (if DB offline locally)
    expect([200, 503]).toContain(response.status);
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('services');
    expect(response.body.services).toHaveProperty('api');
    expect(response.body.services.api.status).toBe('up');
    expect(response.body).toHaveProperty('system');
    expect(response.body.system).toHaveProperty('nodeVersion');
  });

  test('GET /non-existent-route should return 404 with standard error format', async () => {
    const response = await request(app).get('/api/non-existent-endpoint');
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});
