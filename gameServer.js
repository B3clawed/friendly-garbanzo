module.exports = class gameServer{
    constructor(io){
        this.io = io
        io.on('connection', (socket) => {
            console.log(`Client ${socket.id} connected`)
        })
    }
}