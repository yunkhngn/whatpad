require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { ready } = require('./database')

const app = express()
app.use(cors())
app.use(express.json())

app.use('/auth', require('./routes/auth'))
app.use('/stories', require('./routes/stories'))
app.use('/chapters', require('./routes/chapters'))
app.use('/social', require('./routes/social'))

const port = Number(process.env.PORT || 4000)
ready.then(() => app.listen(port, () => console.log('API http://localhost:' + port)))