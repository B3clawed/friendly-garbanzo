module.exports = class gameServer{
    constructor(io){
        this.io = io
        this.gameSettings = {
            timer: 60,
            word: ''
        }
        this.players = {}

        io.on('connection', (socket) => {
            console.log(`Client ${socket.id} connected`)
            //console.log(socket.handshake.query)

            socket.on('login', (data) => {
                this.addPlayer({socket: socket, name: data.name}, (player) => {
                    if(Object.keys(this.players).length == 2)
                        this.randomTurn()
                    socket.emit('hello', player)
                    io.emit('playerdata', this.players)
                })
            })

            socket.on('message', (data) => {
                if(data.message.toLowerCase() == this.gameSettings.word.toLowerCase() && this.players[socket.id].turn == false){
                    io.emit('message', {name: 'GAME', message: `${this.players[socket.id].name} has guessed the word correctly!`})
                }
                else
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
                choosingWord: false,
                turn: false,
                color: '#df4b26',
                drawData: []
            }
        )
    }

    startTurn(socket, level){
        this.gameSettings.word = this.currentWords[level]
        socket.broadcast.emit('startturn', {id: socket.id, word: toUnderscores(this.gameSettings.word)})
        this.players[socket.id].choosingWord = false
        this.io.emit('playerdata', this.players)
        setTimeout(() => {
            if(this.players[socket.id]){
                this.players[socket.id].turn = false
                this.io.emit('playerdata', this.players)
            }
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
        let socket = this.io.sockets.connected[id]
        this.players[id].choosingWord = true
        this.io.emit('playerdata', this.players)
        this.currentWords = ['Football','Elephant','Moldy Cheese']
        socket.emit('wordChoices', {level1: 'Football', level2: 'Elephant', level3: 'Moldy Cheese'})
    }
}

function toUnderscores(word){
    let final = ''
    for (let i = 0; i < word.length; i++) {
        if(word.charAt(i) != ' ')
            final += '_'
        else
            final += ' '
    }
    return final
}

function random(min,max){
    return Math.floor(Math.random()*(max-min+1)+min);
}