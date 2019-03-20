module.exports = class gameServer{
    constructor(io){
        this.io = io
        this.gameSettings = {
            timer: 60
        }
        this.players = {}

        io.on('connection', (socket) => {
            console.log(`Client ${socket.id} connected`)
            //console.log(socket.handshake.query)

            socket.on('login', (data) => {
                this.addPlayer({socket: socket, name: data.name}, (player) => {
                    if(Object.keys(this.players).length == 2)
                        this.randomTurn()
                    io.emit('playerdata', this.players)
                    socket.emit('hello', player)
                })
            })

            socket.once('disconnect', () => {
                delete this.players[socket.id]
                io.emit('playerdata', this.players)
            })

            socket.on('chooseword', (data) => {
                this.startTurn(socket, data.id)
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
                turn: false,
                color: '#00ff00',
                drawData: []
            }
        )
    }

    startTurn(socket, wordId){
        socket.broadcast.emit('startturn', {id: socket.id})
        setTimeout(() => {
            this.players[socket.id].turn = false
            this.io.emit('endturn', {id: socket.id})
        }, this.gameSettings.timer * 1000)
    }

    randomTurn(){
        let rnd = random(0,Object.keys(this.players).length-1),
            i = 0
        for(let id in this.players){
            if(rnd==i)
                this.players[id].turn = true
            i++
        }
    }
}

function random(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}