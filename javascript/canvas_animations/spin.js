// Getting html elements.
const canvas = document.getElementById('myCanvas');
canvas.width = window.innerWidth - 10;
canvas.height = window.innerHeight - 40;
const c = canvas.getContext('2d');


class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  get asArray() { return [this.x, this.y]; }
  get norm() { return Math.sqrt(this.x * this.x + this.y * this.y); }
  plus(v2) { return new Vector(this.x + v2.x, this.y + v2.y); }
  minus(v2) { return new Vector(this.x - v2.x, this.y - v2.y); }
  dot(v2) { return this.x * v2.x + this.y * v2.y; }
  rotate(theta) {
    const x = this.x * Math.cos(theta) - this.y * Math.sin(theta);
    const y = this.x * Math.sin(theta) + this.y + Math.cos(theta);
    return new Vector(x, y);
  }
}


class Polygon {
  constructor(vertices) {
    this.setRandomColor();

    // vertices is an array of vectors
    this.vertices = vertices;
    this.n = vertices.length;
    this.vertices.push(vertices[0]);  // including first vertex at back of array

    // Shoelace formula for area.
    this.area = 0;
    for (let i = 0; i < this.n; i++) {
      this.area += (this.x[i] * this.y[i + 1] - this.x[i + 1] * this.y[i]) / 2;
    }

    this.linearVelocity = new Vector(8 * Math.random() - 4, 8 * Math.random() - 4);
    this.angularVelocity = 0.04 * Math.random() - 0.02;
  }

  setRandomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    this.color = 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  // Getting the x and y coordinates of the vertices for easy access
  get x() { return this.vertices.map(v => v.x); }
  get y() { return this.vertices.map(v => v.y); }

  // Formula for center of mass.
  get cm() {
    const a = 6 * this.area;
    let x = 0;
    let y = 0;
    for (let i = 0; i < this.n; i++) {
      const term = this.x[i] * this.y[i + 1] - this.x[i + 1] * this.y[i];
      x += (this.x[i] + this.x[i + 1]) * term;
      y += (this.y[i] + this.y[i + 1]) * term;
    }
    return new Vector(x / a, y / a);
  }

  updatePosition() {
    const oldCM = this.cm;
    const newCM = oldCM.plus(this.linearVelocity);
    // perform rotation about center of mass
    for (let i = 0; i <= this.n; i++) {
      this.vertices[i] = this.vertices[i].minus(oldCM).rotate(this.angularVelocity).plus(newCM);
    }
  }

  draw() {
    c.beginPath();
    c.moveTo(...this.vertices[0].asArray);
    for (let i = 1; i < this.n; i++) {
      console.log(...this.vertices[i].asArray);
      c.lineTo(...this.vertices[i].asArray);
    }
    c.closePath();
    c.fillStyle = this.color;
    c.fill();
  }
}





//   // Coordinates of one of the vertices
//   getx() { return this.x + this.r * Math.cos(this.theta); }
//   gety() { return this.y + this.r * Math.sin(this.theta); }

//   // Various energies
//   getKineticEnergy() {
//     return this.mass * (this.dx * this.dx + this.dy * this.dy);
//   }
//   getRotationalEnergy() {
//     // Using a formula from: https://math.stackexchange.com/questions/2004798/
//     let momentOfInertia = this.mass * this.r * this.r / 6 *
//                           (1 + 2 * Math.pow(Math.cos(Math.PI / this.n), 2));
//     return momentOfInertia * this.dtheta * this.dtheta;
//   }

//   // Update position and angular position.
//   updatePositionOld() {
//     let [a, b] = this.getLeftIntersections();
//     if (a) {
//       // Normal force proportional to length of intersection
//       this.dx += 0.01 * Math.abs(a - b);
//       drawLine(0, a, 0, b);
//     }

//     [a, b] = this.getRightIntersections();
//     if (a) {
//       // Normal force proportional to length of intersection
//       this.dx -= 0.01 * Math.abs(a - b);
//       drawLine(canvas.width, a, canvas.width, b);
//     }

//     [a, b] = this.getTopIntersections();
//     if (a) {
//       // Normal force proportional to length of intersection
//       this.dy += 0.01 * Math.abs(a - b);
//       drawLine(a, 0, b, 0);
//     }

//     [a, b] = this.getBottomIntersections();
//     if (a) {
//       // Normal force proportional to length of intersection
//       this.dy -= 0.01 * Math.abs(a - b);
//       drawLine(a, canvas.height, b, canvas.height);
//     }

//     this.x += this.dx;
//     this.y += this.dy;
//     this.theta += this.dtheta;
//   }

//   // Get intersection points with left wall
//   getLeftIntersections() {
//     let intersection1 = null;
//     let intersection2 = null;
//     let x0 = this.getx();
//     let y0 = this.gety();
//     for (let i = 0; i < this.n; i++) {
//       this.theta += 2 * Math.PI / this.n;
//       let x1 = this.getx();
//       let y1 = this.gety();
//       if (Math.sign(x0) != Math.sign(x1)) {
//         // Found intersection with vertical wall at x = 0
//         let intersection = y0 - x0 * (y0 - y1) / (x0 - x1);
//         if (intersection1 === null) {
//           intersection1 = intersection;
//         } else {
//           intersection2 = intersection;
//         }
//       }
//       x0 = x1;
//       y0 = y1;
//     }
//     return [intersection1, intersection2];
//   }

//   // Get intersection points with right wall
//   getRightIntersections() {
//     let intersection1 = null;
//     let intersection2 = null;
//     let x0 = this.getx();
//     let y0 = this.gety();
//     for (let i = 0; i < this.n; i++) {
//       this.theta += 2 * Math.PI / this.n;
//       let x1 = this.getx();
//       let y1 = this.gety();
//       if (Math.sign(x0 - canvas.width) != Math.sign(x1 - canvas.width)) {
//         // Found intersection with vertical wall at x = width
//         let intersection = y0 + (canvas.width - x0) * (y0 - y1) / (x0 - x1);
//         if (intersection1 === null) {
//           intersection1 = intersection;
//         } else {
//           intersection2 = intersection;
//         }
//       }
//       x0 = x1;
//       y0 = y1;
//     }
//     return [intersection1, intersection2];
//   }

//   // Get intersection points with top wall
//   getTopIntersections() {
//     let intersection1 = null;
//     let intersection2 = null;
//     let x0 = this.getx();
//     let y0 = this.gety();
//     for (let i = 0; i < this.n; i++) {
//       this.theta += 2 * Math.PI / this.n;
//       let x1 = this.getx();
//       let y1 = this.gety();
//       if (Math.sign(y0) != Math.sign(y1)) {
//         // Found intersection with horizontal wall at y = 0
//         let intersection = x0 - y0 * (x0 - x1) / (y0 - y1);
//         if (intersection1 === null) {
//           intersection1 = intersection;
//         } else {
//           intersection2 = intersection;
//         }
//       }
//       x0 = x1;
//       y0 = y1;
//     }
//     return [intersection1, intersection2];
//   }

//   // Get intersection points with bottom wall
//   getBottomIntersections() {
//     let intersection1 = null;
//     let intersection2 = null;
//     let x0 = this.getx();
//     let y0 = this.gety();
//     for (let i = 0; i < this.n; i++) {
//       this.theta += 2 * Math.PI / this.n;
//       let x1 = this.getx();
//       let y1 = this.gety();
//       if (Math.sign(y0 - canvas.height) != Math.sign(y1 - canvas.height)) {
//         // Found intersection with horizontal wall at x = height
//         let intersection = x0 + (canvas.height - y0) * (x0 - x1) / (y0 - y1);
//         if (intersection1 === null) {
//           intersection1 = intersection;
//         } else {
//           intersection2 = intersection;
//         }
//       }
//       x0 = x1;
//       y0 = y1;
//     }
//     return [intersection1, intersection2];
//   }

//   // Draw polygon centered at x, y.
//   drawOld() {
//     c.beginPath();
//     for (let i = 0; i < this.n; i++) {
//       if (i) {
//         c.lineTo(this.getx(), this.gety());
//       } else {
//         c.moveTo(this.getx(), this.gety());
//       }
//       this.theta += 2 * Math.PI / this.n;
//     }
//     c.closePath();
//     c.fillStyle = this.color;
//     c.fill();
//   }
// }

const vertices = [];
for (let i = 0; i < 5; i++) {
  vertices.push(new Vector(1000 * Math.random(), 1000 * Math.random()));
}

//const polygon = new Polygon([new Vector(100, 100), new Vector(300, 500), new Vector(500, 300)]);
const polygon = new Polygon(vertices);

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
//setInterval(update, 10);
