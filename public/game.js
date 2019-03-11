var socket = io.connect('http://576cafa5.ngrok.io'),
    canvas = document.getElementById('canvas'),
    ctx = canvas.getContext('2d'),
    drawing = false
var clickX = [],
    clickY = [],
    clickDrag = [],
    playerData = {},
    self = {}

socket.on('drawdata', (data) => {
    playerData[data.id].drawData.push(data)
})

socket.on('clearCanvas', ()=>{
    ctx.clearRect(0, 0, canvas.width, canvas.height);
})

socket.on('playerdata', (players) => {
    playerData = players
    delete playerData[self.id]
})

socket.on('hello', (data) => {
    self = data
})

socket.on('connect', () => {
})


canvas.onmousedown = function(e) {
    e.preventDefault()
    drawing = true
    addClick(e.pageX-canvas.offsetLeft,e.pageY-canvas.offsetTop)
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
    if(drawing)
        addClick(e.pageX-canvas.offsetLeft,e.pageY-canvas.offsetTop, true)
}

function addClick (x, y, dragging) {
    if(self.turn){
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
        if(player.turn && id != self.id){
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