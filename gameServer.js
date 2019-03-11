module.exports = class gameServer{
    constructor(io){
        this.io = io
        this.players = {}

        io.on('connection', (socket) => {
            console.log(`Client ${socket.id} connected`)

            this.addPlayer({socket: socket, name: 'Banana'}, (player) => {
                io.emit('playerdata', this.players)
                socket.emit('hello', player)
            })


            socket.once('disconnect', () => {
                delete this.players[socket.id]
                io.emit('playerdata', this.players)
            })

            socket.on('drawdata', (data) => {
                if(this.players[socket.id].turn){
                    this.players[socket.id].drawData.push(data)
                    socket.broadcast.emit('drawdata', {id: socket.id, dragging: data.dragging ? data.dragging : false, x: data.x, y: data.y})
                }
            })
        })
    }

    addPlayer(data, callback){
        callback(      
            this.players[data.socket.id] = {
                id: data.socket.id,
                name: data.name,
                turn: Object.keys(this.players).length == 0 ? true : false,
                color: '#00ff00',
                drawData: []
            }
        )
    }
}