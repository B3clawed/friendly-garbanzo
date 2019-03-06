// var socket = io.connect('http://localhost:8080')
var canvas = document.getElementById('canvas'),
ctx = canvas.getContext('2d'),
drawing = false
var clickX = [],
clickY = [],
clickDrag = []

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
}