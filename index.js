const express = require('express')
const path = require('path')
const app = express()
const port = 3000
var server = require('http').Server(app)
var io = require('socket.io')(server)
const gameServer = require('./gameServer')

app.use("/", express.static(path.join(__dirname, 'public')))

server.listen(port, 'T308022', () => console.log(`Friendly garbanzo is listening on port ${port}`))

new gameServer(io)