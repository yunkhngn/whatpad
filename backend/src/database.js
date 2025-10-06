const mysql = require('mysql2/promise')
const path = require('path')

// Load connection config (JSON) and allow environment variable overrides
let fileConfig = {}
try {
  // path relative to this file
  fileConfig = require(path.join(__dirname, '..', 'database', 'connection.json'))
} catch (err) {
  fileConfig = {}
}

// Use values directly from JSON for local development (no process.env overrides)
const cfg = {
  host: fileConfig.host || 'localhost',
  user: fileConfig.user || 'root',
  password: fileConfig.password || '',
  database: fileConfig.database || '',
  port: fileConfig.port || 3306,
  waitForConnections: fileConfig.waitForConnections !== undefined ? fileConfig.waitForConnections : true,
  connectionLimit: fileConfig.connectionLimit || 10,
  connectTimeout: fileConfig.connectTimeout || 15000
}

const pool = mysql.createPool(cfg)

// ready resolves after we validate a test connection, or rejects on error
const ready = (async () => {
  try {
    const conn = await pool.getConnection()
    conn.release()
    return true
  } catch (err) {
    // rethrow so callers can catch
    throw err
  }
})()

module.exports = { mysql, pool, ready }