var canvas = document.getElementById('myCanvas');
canvas.width = window.innerWidth - 10;
canvas.height = window.innerHeight - 10;
var c = canvas.getContext('2d');

var step_size = 10;
var radius = 3;

var positions = [150, 150, 250, 250, 350, 350, 500, 500];
var colors = ['red', 'gold', 'teal', 'purple'];

function updatePositions() {
  for (var i = 0; i < positions.length; i++) {
    positions[i] += step_size * (Math.random() - 0.5);
  }
}

function draw() {
  for (var i = 0; i < colors.length; i++) {
    c.beginPath();
    c.arc(positions[2 * i], positions[2 * i + 1], radius, 0, 6.28);
    c.fillStyle = colors[i];
    c.fill();
  }
}

function update() {
  updatePositions();
  draw();
}

setInterval(update, 10);
