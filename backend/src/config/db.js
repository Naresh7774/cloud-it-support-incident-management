const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'incident_user',
  password: process.env.DB_PASSWORD || 'incident_pass',
  database: process.env.DB_NAME || 'incident_management',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  timezone: '+00:00',
  dateStrings: true
});

// Test connection helper
const testDbConnection = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.query("SET time_zone = '+00:00'");
    await connection.ping();
    connection.release();
    return { connected: true };
  } catch (err) {
    return { connected: false, error: err.message };
  }
};

module.exports = {
  pool,
  testDbConnection
};
