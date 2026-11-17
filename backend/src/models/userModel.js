const { pool } = require('../config/db');

const userModel = {
  async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT id, name, email, password_hash, role, department, phone, bio, created_at, updated_at FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, department, phone, bio, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async create({ name, email, passwordHash, role = 'user', department = 'General IT', phone = null }) {
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, role, department, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, passwordHash, role, department, phone]
    );
    return {
      id: result.insertId,
      name,
      email,
      role,
      department,
      phone
    };
  },

  async findAll({ role, search } = {}) {
    let query = 'SELECT id, name, email, role, department, phone, bio, created_at, updated_at FROM users WHERE 1=1';
    const params = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR department LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.execute(query, params);
    return rows;
  },

  async updateRole(id, role) {
    const [result] = await pool.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, id]
    );
    return result.affectedRows > 0;
  },

  async updateProfile(id, { name, department, phone, bio, passwordHash }) {
    let query = 'UPDATE users SET updated_at = UTC_TIMESTAMP()';
    const params = [];

    if (name) {
      query += ', name = ?';
      params.push(name.trim());
    }
    if (department !== undefined) {
      query += ', department = ?';
      params.push(department ? department.trim() : null);
    }
    if (phone !== undefined) {
      query += ', phone = ?';
      params.push(phone ? phone.trim() : null);
    }
    if (bio !== undefined) {
      query += ', bio = ?';
      params.push(bio ? bio.trim() : null);
    }
    if (passwordHash) {
      query += ', password_hash = ?';
      params.push(passwordHash);
    }

    query += ' WHERE id = ?';
    params.push(id);

    const [result] = await pool.execute(query, params);
    return result.affectedRows > 0;
  },

  async countByRole() {
    const [rows] = await pool.execute(
      'SELECT role, COUNT(*) as count FROM users GROUP BY role'
    );
    return rows;
  },

  async delete(id, reassignTicketsToId = null) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Unassign from assigned tickets
      await connection.execute('UPDATE tickets SET assigned_to = NULL WHERE assigned_to = ?', [id]);

      // 2. Reassign created tickets to admin or delete
      if (reassignTicketsToId) {
        await connection.execute('UPDATE tickets SET created_by = ? WHERE created_by = ?', [reassignTicketsToId, id]);
      } else {
        await connection.execute('DELETE FROM tickets WHERE created_by = ?', [id]);
      }

      // 3. Delete notifications
      await connection.execute('DELETE FROM notifications WHERE user_id = ?', [id]);

      // 4. Delete user (comments and history CASCADE)
      const [result] = await connection.execute('DELETE FROM users WHERE id = ?', [id]);

      await connection.commit();
      return result.affectedRows > 0;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
};

module.exports = userModel;
