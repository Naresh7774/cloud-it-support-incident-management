const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { JWT_SECRET, authenticateToken } = require('../src/middleware/authMiddleware');
const { authorizeRoles } = require('../src/middleware/roleMiddleware');

describe('Authentication & Security Unit Tests', () => {
  test('should correctly hash and verify passwords using bcrypt', async () => {
    const rawPassword = 'SecurePassword@123';
    const hash = await bcrypt.hash(rawPassword, 10);
    expect(hash).not.toBe(rawPassword);

    const matches = await bcrypt.compare(rawPassword, hash);
    expect(matches).toBe(true);

    const mismatch = await bcrypt.compare('WrongPassword', hash);
    expect(mismatch).toBe(false);
  });

  test('should generate and verify JWT token with valid payload', () => {
    const payload = { id: 42, email: 'engineer@cloudsupport.local', role: 'engineer' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    const decoded = jwt.verify(token, JWT_SECRET);
    expect(decoded.id).toBe(payload.id);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  test('authenticateToken middleware should reject requests without token', () => {
    const req = { headers: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    expect(next).not.toHaveBeenCalled();
  });

  test('authenticateToken middleware should accept valid token and attach user to req', () => {
    const payload = { id: 1, email: 'admin@cloudsupport.local', role: 'admin' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    const req = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    authenticateToken(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.email).toBe(payload.email);
  });

  test('authorizeRoles middleware should allow authorized roles', () => {
    const req = { user: { id: 1, role: 'admin' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    const middleware = authorizeRoles('admin', 'engineer');
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('authorizeRoles middleware should deny unauthorized roles with 403', () => {
    const req = { user: { id: 3, role: 'user' }, originalUrl: '/api/users', method: 'GET' };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    const middleware = authorizeRoles('admin');
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
