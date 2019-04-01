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

            socket.on('message', (data) => {
                socket.broadcast.emit('message', {name: this.players[socket.id].name, message: data.message})
            })

            socket.once('disconnect', () => {
                delete this.players[socket.id]
                io.emit('playerdata', this.players)
            })

            socket.on('chooseword', (data) => {
                console.log(data)
                this.startTurn(socket, data.level)
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
                color: '#df4b26',
                drawData: []
            }
        )
    }

    startTurn(socket, level){
        socket.broadcast.emit('startturn', {id: socket.id})
        this.io.emit('message', {name: 'GAME', message: `The word has a length of ${this.currentWords[level].split("").length}`})
        setTimeout(() => {
            this.players[socket.id].turn = false
            this.io.emit('endturn', {id: socket.id})
        }, this.gameSettings.timer * 1000)
    }

    randomTurn(){
        let rnd = random(0,Object.keys(this.players).length-1),
            i = 0
        for(let id in this.players){
            if(rnd==i){
                this.players[id].turn = true
                this.startWordChoices(id)
            }
            i++
        }
    }

    startWordChoices(id){
        this.currentWords = ['Football','Elephant','Tired']
        this.io.sockets.connected[id].emit('wordChoices', {level1: 'Football', level2: 'Elephant', level3: 'Tired'})
    }
}

function random(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}