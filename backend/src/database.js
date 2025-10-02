const sql = require('mssql')

const cfg = {
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DB,
  options: { encrypt: process.env.SQL_ENCRYPT === 'true', trustServerCertificate: true }
}

const pool = new sql.ConnectionPool(cfg)
const ready = pool.connect()

module.exports = { sql, pool, ready }