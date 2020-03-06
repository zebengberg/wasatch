// jshint esversion: 6

// Getting html elements.
let canvas = document.getElementById('myCanvas');
canvas.width = window.innerWidth - 10;
canvas.height = window.innerHeight - 40;
var c = canvas.getContext('2d');




class Polygon {
  constructor() {
    this.setRandomColor();
    this.n = 3;
    this.r = 100;
    this.mass = this.r * this.r;
    this.x = this.x = Math.random() * (canvas.width - 2 * this.r) + this.r;
    this.y = this.y = Math.random() * (canvas.height - 2 * this.r) + this.r;
    this.dx = 8 * Math.random() - 4;
    this.dy = 8 * Math.random() - 4;
    this.theta = 2 * Math.PI * Math.random();
    this.dtheta = 0.04 * Math.random() - 0.02;
  }

  setRandomColor() {
    let r = Math.floor(Math.random() * 256);
    let g = Math.floor(Math.random() * 256);
    let b = Math.floor(Math.random() * 256);
    this.color = 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  // Coordinates of one of the vertices
  getx() { return this.x + this.r * Math.cos(this.theta); }
  gety() { return this.y + this.r * Math.sin(this.theta); }

  // Various energies
  getKineticEnergy() {
    return this.mass * (this.dx * this.dx + this.dy * this.dy);
  }
  getRotationalEnergy() {
    // Using a formula from: https://math.stackexchange.com/questions/2004798/
    let momentOfInertia = this.mass * this.r * this.r / 6 *
                          (1 + 2 * Math.pow(Math.cos(Math.PI / this.n), 2));
    return momentOfInertia * this.dtheta * this.dtheta;
  }

  // Update position and angular position.
  updatePosition() {
    let [a, b] = this.getLeftIntersections();
    if (a) {
      // Normal force proportional to length of intersection
      this.dx += 0.01 * Math.abs(a - b);
      drawLine(0, a, 0, b);
    }

    [a, b] = this.getRightIntersections();
    if (a) {
      // Normal force proportional to length of intersection
      this.dx -= 0.01 * Math.abs(a - b);
      drawLine(canvas.width, a, canvas.width, b);
    }

    [a, b] = this.getTopIntersections();
    if (a) {
      // Normal force proportional to length of intersection
      this.dy += 0.01 * Math.abs(a - b);
      drawLine(a, 0, b, 0);
    }

    [a, b] = this.getBottomIntersections();
    if (a) {
      // Normal force proportional to length of intersection
      this.dy -= 0.01 * Math.abs(a - b);
      drawLine(a, canvas.height, b, canvas.height);
    }

    this.x += this.dx;
    this.y += this.dy;
    this.theta += this.dtheta;
  }

  // Get intersection points with left wall
  getLeftIntersections() {
    let intersection1 = null;
    let intersection2 = null;
    let x0 = this.getx();
    let y0 = this.gety();
    for (let i = 0; i < this.n; i++) {
      this.theta += 2 * Math.PI / this.n;
      let x1 = this.getx();
      let y1 = this.gety();
      if (Math.sign(x0) != Math.sign(x1)) {
        // Found intersection with vertical wall at x = 0
        let intersection = y0 - x0 * (y0 - y1) / (x0 - x1);
        if (intersection1 === null) {
          intersection1 = intersection;
        } else {
          intersection2 = intersection;
        }
      }
      x0 = x1;
      y0 = y1;
    }
    return [intersection1, intersection2];
  }

  // Get intersection points with right wall
  getRightIntersections() {
    let intersection1 = null;
    let intersection2 = null;
    let x0 = this.getx();
    let y0 = this.gety();
    for (let i = 0; i < this.n; i++) {
      this.theta += 2 * Math.PI / this.n;
      let x1 = this.getx();
      let y1 = this.gety();
      if (Math.sign(x0 - canvas.width) != Math.sign(x1 - canvas.width)) {
        // Found intersection with vertical wall at x = width
        let intersection = y0 + (canvas.width - x0) * (y0 - y1) / (x0 - x1);
        if (intersection1 === null) {
          intersection1 = intersection;
        } else {
          intersection2 = intersection;
        }
      }
      x0 = x1;
      y0 = y1;
    }
    return [intersection1, intersection2];
  }

  // Get intersection points with top wall
  getTopIntersections() {
    let intersection1 = null;
    let intersection2 = null;
    let x0 = this.getx();
    let y0 = this.gety();
    for (let i = 0; i < this.n; i++) {
      this.theta += 2 * Math.PI / this.n;
      let x1 = this.getx();
      let y1 = this.gety();
      if (Math.sign(y0) != Math.sign(y1)) {
        // Found intersection with horizontal wall at y = 0
        let intersection = x0 - y0 * (x0 - x1) / (y0 - y1);
        if (intersection1 === null) {
          intersection1 = intersection;
        } else {
          intersection2 = intersection;
        }
      }
      x0 = x1;
      y0 = y1;
    }
    return [intersection1, intersection2];
  }

  // Get intersection points with bottom wall
  getBottomIntersections() {
    let intersection1 = null;
    let intersection2 = null;
    let x0 = this.getx();
    let y0 = this.gety();
    for (let i = 0; i < this.n; i++) {
      this.theta += 2 * Math.PI / this.n;
      let x1 = this.getx();
      let y1 = this.gety();
      if (Math.sign(y0 - canvas.height) != Math.sign(y1 - canvas.height)) {
        // Found intersection with horizontal wall at x = height
        let intersection = x0 + (canvas.height - y0) * (x0 - x1) / (y0 - y1);
        if (intersection1 === null) {
          intersection1 = intersection;
        } else {
          intersection2 = intersection;
        }
      }
      x0 = x1;
      y0 = y1;
    }
    return [intersection1, intersection2];
  }

  // Draw polygon centered at x, y.
  draw() {
    c.beginPath();
    for (let i = 0; i < this.n; i++) {
      if (i) {
        c.lineTo(this.getx(), this.gety());
      } else {
        c.moveTo(this.getx(), this.gety());
      }
      this.theta += 2 * Math.PI / this.n;
    }
    c.closePath();
    c.fillStyle = this.color;
    c.fill();
  }
}

polygon = new Polygon();


function update() {
  c.clearRect(0, 0, canvas.width, canvas.height);
  polygon.draw();
  polygon.updatePosition();
}

// Draw a yellow line segment
function drawLine(x1, y1, x2, y2) {
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.lineWidth = 15;
  c.strokeStyle = 'yellow';
  c.stroke();
}

// Useful for debugging
canvas.addEventListener('keydown', update, false);

// Updating the html canvas
setInterval(update, 10);
