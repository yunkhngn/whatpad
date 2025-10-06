const { ready } = require('./src/database')
ready.then(() => {
  console.log('DB connected')
  process.exit(0)
}).catch(err => {
  console.error('DB connection failed', err)
  process.exit(1)
})