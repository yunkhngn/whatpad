const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '123',
  database: process.env.DB_NAME || 'wattpad',
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(config);

// Test connection
pool.getConnection()
  .then(conn => {
    console.log('Connected to MySQL');
    conn.release();
  })
  .catch(err => {
    console.error('MySQL connection error:', err.message);
  });

module.exports = pool;