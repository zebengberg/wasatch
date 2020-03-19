// Getting html elements.
const WIDTH = window.innerWidth - 20;
const HEIGHT = window.innerHeight - 40;
const canvas = document.getElementById('myCanvas');
canvas.width = WIDTH;
canvas.height = HEIGHT;
const context = canvas.getContext('2d');


class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  get asArray() { return [this.x, this.y]; }
  get norm() { return Math.sqrt(this.x * this.x + this.y * this.y); }
  // Because coordinate system on html canvas has origin at the upper left, both
  // perp() and rotate() rotate polygon in the CW direction.
  get perp() { return new Vector(-this.y, this.x); }
  plus(v2) { return new Vector(this.x + v2.x, this.y + v2.y); }
  minus(v2) { return new Vector(this.x - v2.x, this.y - v2.y); }
  dot(v2) { return this.x * v2.x + this.y * v2.y; }
  rotate(theta) {
    const x = this.x * Math.cos(theta) - this.y * Math.sin(theta);
    const y = this.x * Math.sin(theta) + this.y * Math.cos(theta);
    return new Vector(x, y);
  }
  times(kappa) { return new Vector(kappa * this.x, kappa * this.y); }
}


class Polygon extends Array {
  constructor(vertices = Polygon.buildVertices()) {
    super(...vertices);
    this.n = this.length;

    // pushing first vertex at back of array
    this.push(vertices[0]);

    this.setRandomColor();

    // Only calling these three getters once; using getters for cleanliness.
    this.mass = this.area;
    this.cm = this.centerOfMass;
    this.inertia = this.momentOfInertia;

    const LIN_MAX = 1;
    const ANG_MAX = 0.05;
    this.linearVelocity = new Vector(LIN_MAX * (2 * Math.random() - 1),
      LIN_MAX * (2 * Math.random() - 1));
    this.angularVelocity = ANG_MAX * (2 * Math.random() - 1);
  }


  // Returns random array of vertices defining a polygon.
  static buildVertices() {
    const n = 3 + Math.floor(4 * Math.random());
    const vertices = [];
    const RADIUS = 100;
    const NOISE = 120;
    const x = (WIDTH - 2 * RADIUS) * Math.random() + RADIUS;
    const y = (HEIGHT - 2 * RADIUS) * Math.random() + RADIUS;
    for (let i = 0; i < n; i++) {
      const u = x + RADIUS * Math.cos(2 * Math.PI * i / n) + Math.random() * NOISE;
      const v = y + RADIUS * Math.sin(2 * Math.PI * i / n) + Math.random() * NOISE;
      vertices.push(new Vector(u, v));
    }
    return vertices;
  }

  // Sets color attribute with random rgb color.
  setRandomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    this.color = 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  // Shoelace formula for area.
  get area() {
    let area = 0;
    for (let i = 0; i < this.n; i++) {
      area += this[i].x * this[i + 1].y - this[i + 1].x * this[i].y;
    }
    return area / 2;
  }

  // Formula for center of mass.
  get centerOfMass() {
    let x = 0;
    let y = 0;
    for (let i = 0; i < this.n; i++) {
      const term = this[i].x * this[i + 1].y - this[i + 1].x * this[i].y;
      x += (this[i].x + this[i + 1].x) * term;
      y += (this[i].y + this[i + 1].y) * term;
    }
    return new Vector(x / (6 * this.area), y / (6 * this.area));
  }

  // Formula for moment of inertia.
  get momentOfInertia() {
    // translating all vertices to origin
    for (let i = 0; i <= this.n; i++) {
      this[i] = this[i].minus(this.cm);
    }
    // calculating moment of inertia
    let inertia = 0;
    for (let i = 0; i < this.n; i++) {
      const term = this[i].x * this[i + 1].y - this[i + 1].x * this[i].y;
      inertia += (this[i].y * this[i].y + this[i].y * this[i + 1].y + this[i + 1].y * this[i + 1].y) * term;
      inertia += (this[i].x * this[i].x + this[i].x * this[i + 1].x + this[i + 1].x * this[i + 1].x) * term;
    }
    // translating away from origin
    for (let i = 0; i <= this.n; i++) {
      this[i] = this[i].plus(this.cm);
    }
    return inertia / 12;
  }

  // Get velocity vector of an individual vertex.
  velocityAt(v) {
    // r is perpendicular to the vector pointing from cm to vertex
    const r = v.minus(this.cm).perp;
    return this.linearVelocity.plus(r.times(this.angularVelocity));
  }

  // Get the normal vector away from the wall and index of penetrating vertex.
  get normalToWall() {
    for (let i = 0; i < this.n; i++) {
      if (this.velocityAt(this[i]).x > 0 && this[i].x > WIDTH) {  // moving right
        return [new Vector(-1, 0), i];
      } else if (this.velocityAt(this[i]).x < 0 && this[i].x < 0) {  // moving left
        return [new Vector(1, 0), i];
      } else if (this.velocityAt(this[i]).y > 0 && this[i].y > HEIGHT) {  // moving down
        return [new Vector(0, -1), i];
      } else if (this.velocityAt(this[i]).y < 0 && this[i].y < 0) {  // moving up
        return [new Vector(0, 1), i];
      }
    }
    // Might end up here if vertex is penetrating but polygon moving away from
    // the wall. In this case, return false.
    return [false, null];
  }


  // n is the normal vector to the wall
  // i is the index of the vertex that penetrates the wall
  // http://www.chrishecker.com/images/e/e7/Gdmphys3.pdf
  collideWithWall(n, i) {
    // r is perpendicular to the vector pointing from cm to vertex
    const r = this[i].minus(this.cm).perp;
    const e = 1;  // restitution constant
    // j is impulse scalar
    const j = -(1 + e) * this.velocityAt(this[i]).dot(n) /
      (1 / this.mass + r.dot(n) * r.dot(n) / this.inertia);
    
    // updating velocities with impulse
    this.linearVelocity = this.linearVelocity.plus(n.times(j / this.mass));
    this.angularVelocity += r.dot(n) * j / this.inertia;
  }

  // Updates the bounding box parallel to coordinate axes around polygon
  updateBoundingBox() {
    this.xMin = this.reduce((acc, ver) => acc < ver.x ? acc : ver.x, 1000000);
    this.xMax = this.reduce((acc, ver) => acc > ver.x ? acc : ver.x, 0);
    this.yMin = this.reduce((acc, ver) => acc < ver.y ? acc : ver.y, 1000000);
    this.yMax = this.reduce((acc, ver) => acc > ver.y ? acc : ver.y, 0);
  }

  // Checking if point is within bounding box; course but fast initial check
  boxContainsPoint(v) {
    if (v.x > this.xMin && v.x < this.xMax && v.y > this.yMin && v.y < this.yMax) {
      return true;
    }
    return false;
  }

  // The ray casting algorithm; slower but thorough final check
  // https://stackoverflow.com/questions/11716268/point-in-polygon-algorithm
  containsPoint(v) {
    let isIn = false;
    for (let i = 0; i < this.n; i++) {
      const cond1 = (this[i].y > v.y ) !== (this[i + 1].y > v.y);
      const cond2 = (v.x <= (this[i + 1].x - this[i].x) * (v.y - this[i].y) / (this[i + 1].y - this[i].y) + this[i].x);
      if (cond1 && cond2) {
        isIn = !isIn;
      }
    }
    return isIn;
  }

  updatePosition() {
    // First update bounding box
    this.updateBoundingBox();

    // Dealing with wall collision
    // Start with initial fast check.
    if (this.xMin < 0 || this.xMax > WIDTH || this.yMin < 0 || this.yMax > HEIGHT) {
      // Now a more thorough check
      const [n, i] = this.normalToWall;
      if (n) {  // n could still be false
        this.collideWithWall(n, i);
      }
    }

    // Updating positions by integrating velocity functions
    const oldCM = this.cm;
    this.cm = oldCM.plus(this.linearVelocity);
    // Perform rotation about center of mass
    for (let i = 0; i <= this.n; i++) {
      this[i] = this[i].minus(oldCM).rotate(this.angularVelocity).plus(this.cm);
    }

    // Gravity!
    //this.linearVelocity.y += 0.005;
  }

  draw() {
    // drawing polygon
    context.beginPath();
    context.moveTo(...this[0].asArray);
    for (let i = 1; i < this.n; i++) {
      context.lineTo(...this[i].asArray);
    }
    context.closePath();
    context.fillStyle = this.color;
    context.fill();

    // drawing center of mass
    context.beginPath();
    context.arc(...this.cm.asArray, 5, 0, 2 * Math.PI);
    context.fillStyle = 'black';
    context.fill();
  }
}


// a, b, c, d are all vectors
// https://stackoverflow.com/questions/9043805
// returns true iff the line from a to b intersects with c to d
function intersects(a, b, c, d) {
  let det = (b.x - a.x) * (c.y - d.y) - (c.x - d.x) * (b.y - a.y);
  let lambda = ((c.y - d.y) * (c.x - a.x) + (d.x - c.x) * (c.y - a.y)) / det;
  let gamma = ((a.y - b.y) * (c.x - a.x) + (b.x - a.x) * (c.y - a.y)) / det;
  return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
}

// Determines if poly1 and poly2 are colliding, and updates velocities with
// impulse to enact collision.
function polygonCollide(poly1, poly2) {
  for (let l = 0; l < poly2.n; l++) {
    const d = poly2[l];  // the vertex to check for penetration

    // First checking quickly if bounding box around poly1 contains d
    if (poly1.boxContainsPoint(d)) {
      // Now checking more slowly if polygon actually contains d
      if (poly1.containsPoint(d)) {
        // Now determining which edge of poly1 is penetrated by d
        for (let k = 0; k < poly1.n; k++) {
          const a = poly1[k];
          const b = poly1[k + 1];

          // Checking if edge poly2.cm -> d of poly2 is intersecting edge a -> b of poly1
          // Assuming that centroid of poly2 is contained within poly2
          if (intersects(a, b, poly2.cm, d)) {
            // Show the collision with a red dot
            context.beginPath();
            context.arc(...d.asArray, 10, 0, 2 * Math.PI);
            context.fillStyle = 'red';
            context.fill();

            // Get unit vector normal to edge
            let n = b.minus(a).perp;
            n = n.times(1 / n.norm);
            // n might point in the opposite direction; test by taking dot product
            if (n.dot(d.minus(poly2.cm)) > 0) {
              n = n.times(-1);
            }
            
            // Relative velocity at point of impact
            let v = poly2.velocityAt(d).minus(poly1.velocityAt(d));

            if (v.dot(n) < 0) {  // penetration point moving deeper into poly1
              // Perform the collision
              const r2 = d.minus(poly2.cm).perp;
              const r1 = d.minus(poly1.cm).perp;

              // j is scalar impulse
              const j = -2 * v.dot(n) /
                (1 / poly1.mass + 1 / poly2.mass +
                  r1.dot(n) * r1.dot(n) / poly1.inertia + 
                  r2.dot(n) * r2.dot(n) / poly2.inertia
                );
              
              // Updating velocities with impulse
              poly2.linearVelocity = poly2.linearVelocity.plus(n.times(j / poly2.mass));
              poly1.linearVelocity = poly1.linearVelocity.minus(n.times(j / poly1.mass));
              poly2.angularVelocity += r2.dot(n) * j / poly2.inertia;
              poly1.angularVelocity -= r1.dot(n) * j / poly1.inertia;
            }
            break;  // break out of inner for-loop
          }
        }
      }
    }
  }
}

const polygons = [];
for (let i = 0; i < 8; i++) {
  polygons.push(new Polygon());
}


function update() {
  // clearing the canvas
  context.clearRect(0, 0, canvas.width, canvas.height);

  // updating polygon positions and drawing
  for (let p of polygons) {
    p.updatePosition();
    p.draw();
  }

  // polygon-polygon interactions
  for (let i = 0; i < polygons.length; i++) {
    for (let j = 0; j < polygons.length; j++) {
      if (j !== i) {
        const poly1 = polygons[i];
        const poly2 = polygons[j];
        polygonCollide(poly1, poly2);
      }
    }
  }
}

// Useful for debugging
canvas.onkeydown = update;

// Add new polygons on the fly
canvas.onmousedown = event => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const v = new Vector(x, y);
  let removed = false;
  for (let i = 0; i < polygons.length; i++) {
    if (polygons[i].containsPoint(v)) {
      // remove the clicked polygon
      polygons.splice(i, 1);
      removed = true;
      break;
    }
  }
  // If nothing removed, add a new random polygon
  if (!removed) {
    polygons.push(new Polygon());
  }
};

// Updating the html canvas
setInterval(update, 10);
