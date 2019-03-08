module.exports = class gameServer{
    constructor(io){
        this.io = io
        io.on('connection', (socket) => {
            console.log(`Client ${socket.id} connected`)
            socket.on('drawData', (pos) => {
                io.emit('drawData', {id: socket.id, x: pos.x, y: pos.y})
            })
        })
    }
}