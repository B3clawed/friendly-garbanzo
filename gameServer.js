module.exports = class gameServer{
    constructor(io){
        this.io = io
        this.words = {
            easy: ["bench","sheep","lizard","bird","airplane","bounce","bathroom","candy","rain","football","pizza","rock","door","backpack","bread","drum","angel","desk","daisy","mouse","zigzag","smile","banana","table","curl","basketball","milk","swing","rocket","comb","feet","socks","crayon","worm","tree","grass","heart","beak","diamond","circle","turtle","cupcake","ears","swimming pool","cookie","plant","night","bus","hat","corn","oval","girl","light","tail","sea turtle","blocks","helicopter","kite","face","book","square","pen","bunk bed","baseball","king","flower","rabbit","Earth","coat","fork","bow","bumblebee","baby","line","person","alligator","seashell","pillow","knee","ball","window","fish","car","pie","key","frog","rainbow","horse","truck","snake","bike","bunny","ant","music","grapes","feather","chicken","kitten","fire","spider","pencil","whale","duck","bone","star","bee","jail","chair","beach","bed","hook","snowman","leg","bowl","jacket","box","chimney","eye","bracelet","cow","clock","branch","sun","owl","motorcycle","jellyfish","eyes","love","camera","ladybug","head","house","flag","finger","triangle","bear","mountains","legs","slide","coin","lemon","cup","roly poly","sea","spider web","glasses","cat","button","Mickey Mouse","cube","boat","apple","dragon","hippo","family","starfish","mountain","cheese","elephant","balloon","woman","man","moon","dinosaur","monkey","robot","octopus","ice cream cone","hair","neck","lollipop","lamp","wheel","snowflake","bark","crack","snail","mouth","carrot","shoe","bug","ants","lips","jar","dog","train","zoo","purse","nail","ring","water","float","bridge","river","mitten","spoon","inchworm","broom","hand","arm","stairs","giraffe","crab","butterfly","blanket","caterpillar","orange","bell","cherry","alive","doll","popsicle","ocean","suitcase","bat","pig","ear","nose","egg","leaf","zebra","computer","monster","candle","shirt","lion","sunglasses","cloud","pants","fly","skateboard","island","boy","ship","dream","hamburger","ghost"]
        }
        this.gameSettings = {
            timer: 30,
            word: '',
            turnIdx: 0,
            guessedCount: 0
        }
        this.players = {}

        io.on('connection', (socket) => {
            console.log(`Client ${socket.id} connected`)
            //console.log(socket.handshake.query)

            socket.on('login', (data) => {
                this.addPlayer({socket: socket, name: data.name}, (player) => {
                    if(Object.keys(this.players).length == 2 && !this.middleOfTurn())
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
                    this.gameSettings.guessedCount += 1
                    if(this.gameSettings.guessedCount == Object.keys(this.players).length-1)
                        this.endTurn(this.gameSettings.currentTurn)
                    io.emit('message', {name: 'GAME', message: `${this.players[socket.id].name} has guessed the word correctly!`})
                    io.emit('playerdata', this.players)
                }
                else if(!player.guessed)
                    socket.broadcast.emit('message', {name: this.players[socket.id].name, message: data.message})
            })

            socket.once('disconnect', () => {
                if(this.players[socket.id]){
                    if(this.players[socket.id].turn)
                        this.endTurn(socket.id)

                    delete this.players[socket.id]
                }
                
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
                turnCount: 0,
                points: 0,
                guessed: false,
                drawData: []
            }
        )
    }

    startTurn(socket, level){
        let plr = this.players[socket.id]
        console.log(`${plr.name}'s turn start.`)
        this.gameSettings.word = this.currentWords[level]
        this.io.emit('startturn', {id: socket.id, word: toUnderscores(this.gameSettings.word)})
        this.gameSettings.currentTurn = socket.id
        plr.choosingWord = false
        let thisCount = ++plr.turnCount
        this.io.emit('playerdata', this.players)
        setTimeout(() => {
            if(plr.turn && thisCount == plr.turnCount)
                this.endTurn(socket.id)
        }, this.gameSettings.timer * 1000)
    }

    endTurn(id){
        console.log(`${this.players[id].name}'s turn ended.`)
        for(let id in this.players){
            let plr = this.players[id]
            plr.guessed = false
        }
        this.gameSettings.guessedCount = 0
        if(this.players[id]){
            this.players[id].turn = false
            this.players[id].drawData = []
            this.io.emit('playerdata', this.players)
        }
        this.nextTurn()
    }

    reset(){
        this.gameSettings = {
            timer: 30,
            word: '',
            turnIdx: 0,
            guessedCount: 0
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

    middleOfTurn(){
        for(let id in this.players){
            let plr = this.players[id]
            if(plr.turn)
                return true
        }
        return false
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
        this.currentWords = getRandomWords()
        this.io.emit('clearcanvas')
        socket.emit('wordChoices', {level1: this.currentWords[0], level2: this.currentWords[1], level3: this.currentWords[2]})
    }
}

function getRandomWords(){
    let easy = ["bench","sheep","lizard","bird","airplane","bounce","bathroom","candy","rain","football","pizza","rock","door","backpack","bread","drum","angel","desk","daisy","mouse","zigzag","smile","banana","table","curl","basketball","milk","swing","rocket","comb","feet","socks","crayon","worm","tree","grass","heart","beak","diamond","circle","turtle","cupcake","ears","swimming pool","cookie","plant","night","bus","hat","corn","oval","girl","light","tail","sea turtle","blocks","helicopter","kite","face","book","square","pen","bunk bed","baseball","king","flower","rabbit","Earth","coat","fork","bow","bumblebee","baby","line","person","alligator","seashell","pillow","knee","ball","window","fish","car","pie","key","frog","rainbow","horse","truck","snake","bike","bunny","ant","music","grapes","feather","chicken","kitten","fire","spider","pencil","whale","duck","bone","star","bee","jail","chair","beach","bed","hook","snowman","leg","bowl","jacket","box","chimney","eye","bracelet","cow","clock","branch","sun","owl","motorcycle","jellyfish","eyes","love","camera","ladybug","head","house","flag","finger","triangle","bear","mountains","legs","slide","coin","lemon","cup","roly poly","sea","spider web","glasses","cat","button","Mickey Mouse","cube","boat","apple","dragon","hippo","family","starfish","mountain","cheese","elephant","balloon","woman","man","moon","dinosaur","monkey","robot","octopus","ice cream cone","hair","neck","lollipop","lamp","wheel","snowflake","bark","crack","snail","mouth","carrot","shoe","bug","ants","lips","jar","dog","train","zoo","purse","nail","ring","water","float","bridge","river","mitten","spoon","inchworm","broom","hand","arm","stairs","giraffe","crab","butterfly","blanket","caterpillar","orange","bell","cherry","alive","doll","popsicle","ocean","suitcase","bat","pig","ear","nose","egg","leaf","zebra","computer","monster","candle","shirt","lion","sunglasses","cloud","pants","fly","skateboard","island","boy","ship","dream","hamburger","ghost"],
        rnd1 = random(0, easy.length),
        rnd2 = random(0, easy.length),
        rnd3 = random(0, easy.length)

    while(rnd2 == rnd3 || rnd2 == rnd1){
        rnd2 = random(0, easy.length)
    }

    while(rnd3 == rnd1){
        rnd3 = random(0, easy.length)
    }

    return [easy[rnd1], easy[rnd2], easy[rnd3]]
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