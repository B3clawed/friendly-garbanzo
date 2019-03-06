// var socket = io.connect('http://localhost:8080')
var canvas = document.getElementById('canvas'),
    ctx = canvas.getContext('2d'),
    drawing = false,
    prev = {x: 0, y: 0}

canvas.onmousedown = function(e) {
    e.preventDefault()
    drawing = true
    prev.x = e.pageX
    prev.y = e.pageY
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
        drawLine(prev, {x: e.pageX, y: e.pageY});
        prev.x = e.pageX;
        prev.y = e.pageY;
    }
}

function drawLine(prev, current){
    ctx.beginPath()
    ctx.moveTo(prev.x, prev.y)
    ctx.lineTo(current.x, current.y)
    ctx.stroke()
}