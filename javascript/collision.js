// jshint esversion: 6

// Getting html elements.
let canvas = document.getElementById('myCanvas');
canvas.width = window.innerWidth - 10;
canvas.height = window.innerHeight - 10;
var c = canvas.getContext('2d');

const radius = 50;
const squish = 1;  // constant that governs how squishy each ball is
const speed = 5;  // parameter used in initalizing ball velocity vector
const nBalls = 8;

class Ball {
  constructor(x = Math.random() * (canvas.width - 2 * radius) + radius,
              y = Math.random() * (canvas.height - 2 * radius) + radius,
              dx = speed * Math.random(),
              dy = speed * Math.random()) {
    this.setRandomColor();
    this.r = radius;
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.hasBeenDrawn = false;
  }

  setRandomColor() {
    let r = Math.floor(Math.random() * 256);
    let g = Math.floor(Math.random() * 256);
    let b = Math.floor(Math.random() * 256);
    this.color = 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  // Update x and y according to dx and dy and bounce off walls.
  updatePosition() {
    if ((this.x - this.r <= 0) || (this.x + this.r >= canvas.width)) { this.dx *= -1; }
    if ((this.y - this.r <= 0) || (this.y + this.r >= canvas.height)) { this.dy *= -1; }
    this.x += this.dx;
    this.y += this.dy;
  }

  // Draw arc of circle centered at x, y.
  draw(alpha = 0, beta = 2 * Math.PI) {
    c.beginPath();
    c.arc(this.x, this.y, this.r, alpha, beta, true);
    c.closePath();
    c.fillStyle = this.color;
    c.fill();
  }

  // Get kinetic energy and get speed.
  getEnergy() { return this.dx * this.dx + this.dy * this.dy; }
  getSpeed() { return Math.sqrt(this.getEnergy()); }

  // Get distance between two balls
  static getDistance(ball1, ball2) {
    return Math.sqrt(Math.pow(ball1.x - ball2.x, 2) + Math.pow(ball1.y - ball2.y, 2));
  }

  // Model and draw collision between two balls.
  static collision(ball1, ball2) {
    // Getting both intersection points between overlapping circles.
    let dist = Ball.getDistance(ball1, ball2);
    let disc = Math.sqrt(2 * (ball1.r * ball1.r + ball2.r * ball2.r) / (dist * dist) - 1) / 2;
    let x1 = (ball1.x + ball2.x) / 2 + disc * (ball2.y - ball1.y);
    let y1 = (ball1.y + ball2.y) / 2 + disc * (ball1.x - ball2.x);
    let x2 = (ball1.x + ball2.x) / 2 - disc * (ball2.y - ball1.y);
    let y2 = (ball1.y + ball2.y) / 2 - disc * (ball1.x - ball2.x);

    // Now drawing the circles.
    // Drawing all of ball2 first, then a sector of ball1 so that it doesn't overlap ball2.
    if (!ball2.hasBeenDrawn) {
      ball2.draw();
      ball2.hasBeenDrawn = true;
    }

    let alpha1 = Math.atan2(y1 - ball1.y, x1 - ball1.x);
    let beta1 = Math.atan2(y2 - ball1.y, x2 - ball1.x);
    if (!ball1.hasBeenDrawn) {
      ball1.draw(alpha1, beta1);
      ball1.hasBeenDrawn = true;
    }

    // Now drawing the line segment to the intersection.
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.lineWidth = 10;
    c.strokeStyle = 'yellow';
    c.stroke();
  }
}


balls = [];
for (var i = 0; i < nBalls; i++) {
  balls.push(new Ball());
}


function update() {
  c.clearRect(0, 0, canvas.width, canvas.height);
  for (let ball of balls) {
    ball.updatePosition();
    ball.hasBeenDrawn = false;
    // Drawing all balls once now.
    ball.draw();
  }
  for (var i = 0; i < balls.length; i++) {
    for (var j = i + 1; j < balls.length; j++) {
      ball1 = balls[i];
      ball2 = balls[j];
      let dist = Ball.getDistance(ball1, ball2);
      if (dist <= ball1.r + ball2.r) {
        // This does the drawing.
        Ball.collision(ball1, ball2);

        // Now applying normal forces.
        let oldEnergy = ball1.getEnergy() + ball2.getEnergy();
        let dx = ball1.x - ball2.x;
        let dy = ball1.y - ball2.y;
        // This is where all the physics happens; change dx inversely proportionally
        // to the distance between center of the balls.
        ball1.dx += squish * dx / dist;
        ball2.dx -= squish * dx / dist;
        ball1.dy += squish * dy / dist;
        ball2.dy -= squish * dy / dist;

        // Total kinetic energy should be preserved.
        let newEnergy = ball1.getEnergy() + ball2.getEnergy();
        let scale = Math.sqrt(oldEnergy / newEnergy);
        ball1.dx *= scale;
        ball1.dy *= scale;
        ball2.dx *= scale;
        ball2.dy *= scale;
      }
    }
  }
}

// Useful for debugging
canvas.addEventListener('keydown', update, false);

// Updating the html canvas
setInterval(update, 10);
