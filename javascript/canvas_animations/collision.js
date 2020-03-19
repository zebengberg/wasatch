// A simulation of deformation-based collisions with balls.

// To see simulation in action, visit:
// https://zebengberg.github.io/school-projects/javascript/canvas_animations/collision.html
// Licensed under the MIT license.


class Ball {
  constructor(r = null, x = null, y = null, dx = null, dy = null) {
    this.setRandomColor();

    if (r === null) {
      this.r = Ball.radius();
    } else {
      this.r = r;
    }
    this.mass = this.r * this.r;  // mass proportional to r^2

    if (x === null) {
      this.x = Math.random() * (canvas.width - 2 * this.r) + this.r;
    } else {
      this.x = x;
    }

    if (y === null) {
      this.y = Math.random() * (canvas.height - 2 * this.r) + this.r;
    } else {
      this.y = y;
    }

    if (dx === null) {
      this.dx = Ball.speed * Math.random();
    } else {
      this.dx = dx;
    }

    if (dy === null) {
      this.dy = Ball.speed * Math.random();
    } else {
      this.dy = dy;
    }

    this.hasBeenDrawn = false;
  }

  setRandomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
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

  // Determines if point (x, y) is contained within this ball.
  contains(x, y) {
    return Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2) <= Math.pow(this.r, 2);
  }

  // Get kinetic energy.
  get energy() { return this.mass * (this.dx * this.dx + this.dy * this.dy); }

  // Get distance between two balls
  static getDistance(ball1, ball2) {
    return Math.sqrt(Math.pow(ball1.x - ball2.x, 2) + Math.pow(ball1.y - ball2.y, 2));
  }

  // Model and draw collision between two balls.
  static collision(ball1, ball2) {
    // Getting both intersection points between overlapping circles.
    const dist = Ball.getDistance(ball1, ball2);
    const disc = Math.sqrt(2 * (ball1.r * ball1.r + ball2.r * ball2.r) / (dist * dist) - 1) / 2;
    const x1 = (ball1.x + ball2.x) / 2 + disc * (ball2.y - ball1.y);
    const y1 = (ball1.y + ball2.y) / 2 + disc * (ball1.x - ball2.x);
    const x2 = (ball1.x + ball2.x) / 2 - disc * (ball2.y - ball1.y);
    const y2 = (ball1.y + ball2.y) / 2 - disc * (ball1.x - ball2.x);

    // Now drawing the circles.
    // Drawing all of ball2 first, then a sector of ball1 so that it doesn't overlap ball2.
    if (!ball2.hasBeenDrawn) {
      ball2.draw();
      ball2.hasBeenDrawn = true;
    }

    const alpha1 = Math.atan2(y1 - ball1.y, x1 - ball1.x);
    const beta1 = Math.atan2(y2 - ball1.y, x2 - ball1.x);
    if (!ball1.hasBeenDrawn) {
      ball1.draw(alpha1, beta1);
      ball1.hasBeenDrawn = true;
    }

    // Now drawing the line segment coincident with the intersection.
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.lineWidth = 10;
    c.strokeStyle = 'yellow';
    c.stroke();
  }
}


// Getting global html elements.
const canvas = document.getElementById('canvas');
const c = canvas.getContext('2d');
resizeCanvas();
function resizeCanvas() {
  canvas.width = window.innerWidth - 10;
  canvas.height = window.innerHeight - 35;
}

// two global variables
let nBalls, balls;

function getUserInput() {
  // static class variables
  Ball.squish = Number(document.getElementById('squish').value);
  Ball.speed = Number(document.getElementById('speed').value);
  // populating array of Ball objects
  nBalls = Number(document.getElementById('nBalls').value);
  if (document.getElementById('radius').checked) {
    Ball.radius = function() { return 50; };
  } else {
    Ball.radius = function() { return 50 * Math.random() + 5; };
  }

  balls = [];
  for (let i = 0; i < nBalls; i++) {
    balls.push(new Ball());
  }
}

getUserInput();


function update() {
  // Updating canvas
  resizeCanvas();
  c.clearRect(0, 0, canvas.width, canvas.height);

  // Updating individual balls
  for (let ball of balls) {
    ball.updatePosition();
    ball.hasBeenDrawn = false;
    // Drawing all balls once now.
    ball.draw();
  }

  // Considering collisions between pairs of balls
  for (var i = 0; i < nBalls; i++) {
    for (var j = i + 1; j < nBalls; j++) {
      const ball1 = balls[i];
      const ball2 = balls[j];
      const dist = Ball.getDistance(ball1, ball2);
      if (dist <= ball1.r + ball2.r) {
        // This does the drawing.
        Ball.collision(ball1, ball2);

        // Don't want additional energy to creep in
        const preEnergy = ball1.energy + ball2.energy;

        // Now applying normal forces.
        const dx = ball1.x - ball2.x;
        const dy = ball1.y - ball2.y;
        // This is where all the physics happens; change ball.dx inversely
        // proportionally to the distance between center of the balls.
        // Mathematically, we just need a function which grows to infinity as
        // dx approaches 0.
        // Scale by mass of the other ball. The constant 1000 is arbitrary.
        ball1.dx += Ball.squish * ball2.mass * dx / (1000 * dist * dist);
        ball2.dx -= Ball.squish * ball1.mass * dx / (1000 * dist * dist);
        ball1.dy += Ball.squish * ball2.mass * dy / (1000 * dist * dist);
        ball2.dy -= Ball.squish * ball1.mass * dy / (1000 * dist * dist);

        // Considering the ratio of energies; scaling to keep energy constant.
        // Ideally this would happen after collision is completely finished.
        // This solution approximates that ideal.
        const postEnergy = ball1.energy + ball2.energy;
        const energyScaler = Math.sqrt(preEnergy / postEnergy);
        ball1.dx *= energyScaler;
        ball1.dy *= energyScaler;
        ball2.dx *= energyScaler;
        ball2.dy *= energyScaler;
      }
    }
  }
}

// Useful for debugging
canvas.onkeydown = update;

// Add new balls on the fly with a mouse click
canvas.onmousedown = event => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  let removed = false;
  for (let i = 0; i < balls.length; i++) {
    if (balls[i].contains(x, y)) {
      // remove the clicked ball
      balls.splice(i, 1);
      nBalls--;
      removed = true;
      break;
    }
  }
  // If nothing removed, add a new random ball
  if (!removed) {
    balls.push(new Ball(null, x, y));
    nBalls++;
  }
};

// Updating the html canvas
setInterval(update, 10);
