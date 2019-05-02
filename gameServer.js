module.exports = class gameServer{
    constructor(io){
        this.io = io
        this.gameSettings = {
            timer: 30,
            word: '',
            turnIdx: 0
        }
        this.players = {}

        io.on('connection', (socket) => {
            console.log(`Client ${socket.id} connected`)
            //console.log(socket.handshake.query)

            socket.on('login', (data) => {
                this.addPlayer({socket: socket, name: data.name}, (player) => {
                    if(Object.keys(this.players).length == 2)
                        this.nextTurn()
                    socket.emit('hello', player)
                    io.emit('playerdata', this.players)
                })
            })

            socket.on('clearcanvas', () => {
                if(this.players[socket.id].turn){
                    this.players[socket.id].drawData = []
                    io.emit('playerdata', this.players)
                    io.emit('clearcanvas')
                }
            })

            socket.on('message', (data) => {
                let player = this.players[socket.id]
                if(data.message.toLowerCase() == this.gameSettings.word.toLowerCase() && player.turn == false && !player.guessed){
                    this.players[socket.id].points += 1
                    this.players[socket.id].guessed = true
                    io.emit('message', {name: 'GAME', message: `${this.players[socket.id].name} has guessed the word correctly!`})
                    io.emit('playerdata', this.players)
                }
                else if(!player.guessed && player.turn == false)
                    socket.broadcast.emit('message', {name: this.players[socket.id].name, message: data.message})
            })

            socket.once('disconnect', () => {
                delete this.players[socket.id]
                if(Object.keys(this.players).length == 0)
                    this.reset()
                io.emit('playerdata', this.players)
            })

            socket.on('chooseword', (data) => {
                console.log(data)
                this.startTurn(socket, data.level)
            })

            socket.on('drawdata', (data) => {
                if(this.players[socket.id].turn){
                    this.players[socket.id].drawData.push(data)
                    socket.broadcast.emit('drawdata', {id: socket.id, dragging: data.dragging ? data.dragging : false, x: data.x, y: data.y, color: data.color})
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
                points: 0,
                guessed: false,
                drawData: []
            }
        )
    }

    startTurn(socket, level){
        this.gameSettings.word = this.currentWords[level]
        this.io.emit('startturn', {id: socket.id, word: toUnderscores(this.gameSettings.word)})
        this.players[socket.id].choosingWord = false
        this.io.emit('playerdata', this.players)
        setTimeout(() => {
            for(let id in this.players){
                let plr = this.players[id]
                plr.guessed = false
            }
            if(this.players[socket.id]){
                this.players[socket.id].turn = false
                this.players[socket.id].drawData = []
                this.io.emit('playerdata', this.players)
            }
            this.nextTurn()
        }, this.gameSettings.timer * 1000)
    }

    reset(){
        this.gameSettings = {
            timer: 30,
            word: '',
            turnIdx: 0
        }
    }

    nextTurn(){
        console.log(this.gameSettings.turnIdx)
        if(this.gameSettings.turnIdx+1 > Object.keys(this.players).length)
            this.gameSettings.turnIdx = 0
        let i = 0
        for(let id in this.players){
            if(i == this.gameSettings.turnIdx){
                this.players[id].turn = true
                this.startWordChoices(id)
                break
            }
            i++
        }
        this.gameSettings.turnIdx++
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
        this.io.emit('clearcanvas')
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