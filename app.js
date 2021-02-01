const express = require('express')
const app = express()
let http = require('http').Server(app)

const port = process.env.PORT || 3000

let io = require('socket.io')(http)

app.use(express.static('public'))

http.listen(port, () => {
    console.debug('listening to', port)
})

io.on('connection',socket => {
    console.log('a user connected')

    socket.on('create or join', room => {
        console.log('create or join', room)
        let myRoom = io.sockets.adapter.rooms[room] || {length: 0}
        let numClients = myRoom.length
        console.log(room, 'has', numClients, 'clients')

        if(numClients == 0){
            socket.join(room)
            socket.emit('created', room)
        } else if(numClients == 1){
            socket.join(room)
            socket.emit('joined', room)
        }else{
            socket.emit('full', room)
        }
    })

    socket.on('ready', room => {
        console.log('ready',room)
        socket.broadcast.to(room).emit('ready')
    })

    socket.on('candidate', event => {
        socket.broadcast.to(event.room).emit('candidate',event)
    })

    socket.on('offer', event => {
        console.log('offer sending...')
        socket.broadcast.to(event.room).emit('offer',event.sdp)
    })

    socket.on('answer', event => {
        console.log('Answer sent')
        socket.broadcast.to(event.room).emit('answer',event.sdp)
    })
})