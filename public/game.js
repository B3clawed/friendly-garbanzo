var socket,
    canvas = document.getElementById('canvas'),
    ctx = canvas.getContext('2d'),
    rect = canvas.getBoundingClientRect(),
    canvasLeft = rect.left,
    canvasTop = rect.top,
    drawing = false,
    canDraw = true
var clickX = [],
    clickY = [],
    clickDrag = [],
    playerData = {},
    self = {},
    players = [],
    playerCount = 0,
    i = 1

canvas.onmousedown = function(e) {
    e.preventDefault()
    drawing = true
    addClick(e.pageX-canvasLeft,e.pageY-canvasTop)
}

document.onmouseup = function(e) {
    e.preventDefault()
    drawing = false
}

document.onmouseleave = function(e) {
    e.preventDefault()
    drawing = false
}

canvas.onblur = function(e) {
    e.preventDefault()
    drawing = false
}

document.onmousemove = function (e) {
    if(drawing) {
        addClick(e.pageX-canvasLeft,e.pageY-canvasTop, true)
    }
}

function addClick (x, y, dragging) {
    if(self.turn & canDraw){
        clickX.push(x)
        clickY.push(y)
        clickDrag.push(dragging)
        socket.emit('drawdata', {dragging: dragging, x: x, y: y})
    }
}

function main() {
    redraw()
    requestAnimationFrame(main)
}

function checkTurn(){
    for(let id in playerData){
        let plr = playerData[id]
        if(plr.turn) {
            document.getElementById(plr.id).style.backgroundColor = "#23d160"
        } if(plr.choosingWord && id != socket.id){
            choosingOn(plr.name)
        }
    }
}

function changeStroke() {
    var change = document.getElementById("colorSelect").value
    switch(change) {
        case 'red':
            ctx.strokeStyle = "#df4b26"
            break;
        case 'green':
            ctx.strokeStyle = "#00ff00"
            break;
        case 'blue':
            ctx.strokeStyle = "#df4b26"
            break;
        case 'brown':
            ctx.strokeStyle = "#df4b26"
            break;
        case 'yellow':
            ctx.strokeStyle = "#df4b26"
            break;
        case 'black':
            ctx.strokeStyle = "#df4b26"
            break;
        case 'eraser':
            // ctx.strokeStyle = "#df4b26"
            break;
        case 'clear':
            socket.emit('clearcanvas')
            break;    
    }
}

function choosingOn(name) {
    document.getElementById("choosingWordsMessage").style.display = "block"
    document.getElementById("choosingWordsP").innerText = name + " is choosing a word!"
}

function sendMessage(e) {
    var msg = document.getElementById('chatArea').value
    if((e.keyCode == 13 || e == 69) && !isBlank(msg)) {
        socket.emit('message', {message: msg})
        addMessage({name: self.name, message: msg})
    }
}

function isBlank(s) {
    return (!s || /^\s*$/.test(s))
}


function addMessage(data){
    var ogArea = document.getElementById("ogBody")
    var box = document.createElement("div")
    box.setAttribute("class", "message-body")
    box.innerText = "" + data.name + ": " + data.message
    ogArea.append(box)
    document.getElementById('chatArea').value = ''
}

function setPlayers() {
    document.getElementById('hotBody').innerHTML = ''

    let count = 1
    for(let id in playerData){
        let plr = playerData[id]
        //document.getElementById(count).innerHTML = plr.name
        var row = document.createElement("tr")
        var head = document.createElement("th")
        row.setAttribute("id", plr.id)
        var data = document.createElement("td")
        var node = document.createTextNode(plr.name);
        var points = document.createTextNode("0")
        data.appendChild(points)
        head.appendChild(node)
        row.appendChild(head)
        row.appendChild(data)
        document.getElementById('hotBody').appendChild(row)
        count++
    }
    if(document.getElementById('hotBody').childElementCount >= 2) {
        document.getElementById('moreUsersMessage').style.display = "none"
    }
}

function connect(e) {
    if(e == 69 || e.keyCode == 13) {
        var name = document.getElementById("userNameInput").value
        document.getElementById("userNameInput").value = ""

        socket = io.connect('http://127.0.0.1:3000')
        socket.emit('login', {name: name})

        socket.on('drawdata', (data) => {
            playerData[data.id].drawData.push(data)
        })

        socket.on('message', (data) => {
            addMessage(data)
        })
        
        socket.on('clearcanvas', ()=>{
            clickX = []
            clickY = []
            clickDrag = []
        })
        
        socket.on('playerdata', (players) => {
            playerData = players
            self = players[socket.id] ? players[socket.id] : self
            setPlayers()
            checkTurn()
        })
        
        socket.on('hello', (data) => {
            self = data
        })
        
        socket.on('connect', () => {
            document.getElementById("loginMenu").classList.remove('is-active')
            playerCount++
        })

        socket.on('startturn', (data) => {
            console.log(data)
            document.getElementById("choosingWordsMessage").style.display = "none"
            startTimer(30)
            document.getElementById("underscore").innerText = data.word
        })

        socket.on('wordChoices', (data) => {
            wordChoicesOn()
            document.getElementById("level1").innerHTML = data.level1
            document.getElementById("level2").innerHTML = data.level2
            document.getElementById("level3").innerHTML = data.level3
        })

    // document.getElementsByName("userName")[0].remove()
    // document.getElementById('login').remove()
    }
}

function startTimer(time) {
    document.getElementById("countdowntimer").style.visibility = "visible"
    document.getElementById("underscore").style.visibility = "visible"
    var timeleft = time
    var downloadTimer = setInterval(function(){
    timeleft--
    document.getElementById("countdowntimer").textContent = timeleft
    if(timeleft <= 0)
        clearInterval(downloadTimer)
    },1000)
}

function level1Click(){
    socket.emit('chooseword', {level: 0})
    wordChoicesOff()
    startTimer(30)
}

function level2Click(){
    socket.emit('chooseword', {level: 1})
    wordChoicesOff()
    startTimer(30)
}

function level3Click(){
    socket.emit('chooseword', {level: 2})
    wordChoicesOff()
    startTimer(30)
}


function wordChoicesOn() {
    document.getElementById("canvasButtons").style.display = "block"
    document.getElementById("canvas").style.backgroundColor = 'rgba(0,0,0,.5)'
    canDraw = false
  }
  
function wordChoicesOff() {
    document.getElementById("canvasButtons").style.display = "none"
    document.getElementById("canvas").style.backgroundColor = 'rgba(255,255,255)'
    canDraw = true              
}
 
requestAnimationFrame(main)

function redraw() {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height) // Clears the canvas
  
    ctx.strokeStyle = "#df4b26"
    ctx.lineJoin = "round"
    ctx.lineWidth = 5
			
    for(var i=0; i < clickX.length; i++) {		
        ctx.beginPath()
        if(clickDrag[i] && i)
            ctx.moveTo(clickX[i-1], clickY[i-1])
        else
            ctx.moveTo(clickX[i]-1, clickY[i])       
        ctx.lineTo(clickX[i], clickY[i])
        ctx.closePath()
        ctx.stroke()
    }

    for(let id in playerData){
        let player = playerData[id]
        if(id != self.id){
            let drawData = player.drawData
            ctx.strokeStyle = player.color
            for(let i=0; i<drawData.length; i++){
                ctx.beginPath()
                if(drawData[i].dragging && i)
                    ctx.moveTo(drawData[i-1].x, drawData[i-1].y)   
                else
                    ctx.moveTo(drawData[i].x-1, drawData[i].y)
                ctx.lineTo(drawData[i].x, drawData[i].y)
                ctx.closePath()
                ctx.stroke()
            }
        }
    }
}