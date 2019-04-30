var socket,
    canvas = document.getElementById('canvas'),
    ctx = canvas.getContext('2d'),
    rect = canvas.getBoundingClientRect(),
    canvasLeft = rect.left,
    canvasTop = rect.top,
    drawing = false,
    canDraw = true
var selfDrawData = [],
    clickDrag = [],
    playerData = {},
    self = {},
    players = [],
    color = '#ff0000',
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
        selfDrawData.push({dragging: dragging, x: x, y: y, color: color})
        socket.emit('drawdata', {dragging: dragging, x: x, y: y, color: color})
    }
}

function main() {
    redraw()
    requestAnimationFrame(main)
}

function checkTurn(){
    for(let id in playerData){
        let plr = playerData[id]
        document.querySelector(`#${id} > td`).innerHTML = plr.points
        if(plr.turn) {
            document.getElementById(plr.id).style.backgroundColor = "#23d160"
        } if(plr.choosingWord && id != socket.id){
            choosingOn(plr.name)
        }
    }
}

function clearCanvas() {
    socket.emit('clearcanvas')
}

function changeStroke(stroke) {
    var change = document.getElementById("colorSelect").value
    switch(change) {
        case 'red':
            color = "#ff0000"
            break;
        case 'green':
            color = "#00ff00"
            break;
        case 'blue':
            color = "#0000ff"
            break;
        case 'brown':
            color = "#654321"
            break;
        case 'yellow':
            color = "#ffff00"
            break;
        case 'black':
            color = "#000000"
            break;
    }
    if(stroke == 'eraser')
        color = '#ffffff'
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
        var num = Math.floor(Math.random() * (5)),
            link
        switch(num) {
            case 0:
                link = "https://i.pinimg.com/originals/fe/78/bb/fe78bbb25f35d56b502327fb6d43b309.png"
                break;
            case 1:
                link = "https://cdnb.artstation.com/p/assets/images/images/011/513/619/original/james-doyle-2-1.gif?1529970112"
                break;
            case 2:
                link = "https://wallpapercave.com/wp/wp2873698.png"
                break;
            case 3:
                link = "https://i.pinimg.com/originals/7f/37/66/7f37663404c54de8415aac99a1d1bb1b.jpg"
                break;
            case 4:
                link = "http://paperlief.com/images/cute-pixel-art-wallpaper-3.jpg"
                break;
            case 5:
                link = "https://i.pinimg.com/originals/29/55/e2/2955e2567f366d2890da3caaf9fde13b.gif"
                break;
        }

        document.getElementById("html").style.backgroundImage = `url('${link}')`

        var name = document.getElementById("userNameInput").value
        document.getElementById("userNameInput").value = ""

        socket = io.connect('http://T308022:3000')
        socket.emit('login', {name: name})

        socket.on('drawdata', (data) => {
            playerData[data.id].drawData.push(data)
        })

        socket.on('message', (data) => {
            addMessage(data)
        })
        
        socket.on('clearcanvas', ()=>{
            selfDrawData = []
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

    ctx.lineJoin = "round"
    ctx.lineWidth = 5
			
    for(var i=0; i < selfDrawData.length; i++) {		
        ctx.beginPath()
        ctx.strokeStyle = selfDrawData[i].color
        if(selfDrawData[i].dragging && i)
            ctx.moveTo(selfDrawData[i-1].x, selfDrawData[i-1].y)
        else
            ctx.moveTo(selfDrawData[i].x-1, selfDrawData[i].y)       
        ctx.lineTo(selfDrawData[i].x, selfDrawData[i].y)
        ctx.closePath()
        ctx.stroke()
    }

    for(let id in playerData){
        let player = playerData[id]
        if(id != self.id){
            let drawData = player.drawData
            for(let i=0; i<drawData.length; i++){
                ctx.beginPath()
                ctx.strokeStyle = drawData[i].color
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