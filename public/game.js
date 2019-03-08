var io = io.connect('http://localhost:3000')
var canvas = document.getElementById('canvas'),
ctx = canvas.getContext('2d'),
drawing = false
var clickX = [],
    clickY = [],
    clickDrag = [],
    otherDrawData = {}

io.on('drawData', (data) => {
    if(data.id != io.id){
        if(!otherDrawData[data.id])
            otherDrawData[data.id] = []
        otherDrawData[data.id].push({x: data.x, y: data.y})
    }
    redraw()
})

canvas.onmousedown = function(e) {
    e.preventDefault()
    drawing = true
    addClick(e.pageX-canvas.offsetLeft,e.pageY-canvas.offsetTop)
    redraw()
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
    if(drawing){
        addClick(e.pageX-canvas.offsetLeft,e.pageY-canvas.offsetTop, true)
        redraw()
    }
}

function addClick (x, y, dragging) {
    clickX.push(x)
    clickY.push(y)
    io.emit('drawData', {x: x, y: y})
    clickDrag.push(dragging)
}

function redraw() {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clears the canvas
  
    ctx.strokeStyle = "#df4b26";
    ctx.lineJoin = "round";
    ctx.lineWidth = 5;
			
    for(var i=0; i < clickX.length; i++) {		
        ctx.beginPath();
        if(clickDrag[i] && i){
            ctx.moveTo(clickX[i-1], clickY[i-1]);
        }else{
            ctx.moveTo(clickX[i]-1, clickY[i]);
        }
        ctx.lineTo(clickX[i], clickY[i]);
        ctx.closePath();
        ctx.stroke();
    }

    ctx.strokeStyle = "#00ff00";

    for(let id in otherDrawData){
        let posData = otherDrawData[id]
        for(let i=1; i<posData.length; i++){
            ctx.beginPath();
            ctx.moveTo(posData[i-1].x, posData[i-1].y);
            ctx.lineTo(posData[i].x, posData[i].y);
            ctx.closePath();
            ctx.stroke();
        }
    }
}