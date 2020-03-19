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

    // including first and second vertices at back of array
    this.push(vertices[0]);
    this.push(vertices[1]);

    this.setRandomColor();

    // Only calling these three getters once; using getters for cleanliness.
    this.mass = this.area;
    this.cm = this.centerOfMass;
    this.inertia = this.momentOfInertia;

    const LIN_MAX = 1;
    const ANG_MAX = 0.01;
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
    for (let i = 0; i <= this.n + 1; i++) {
      this[i] = this[i].minus(oldCM).rotate(this.angularVelocity).plus(this.cm);
    }

    // Gravity!
    this.linearVelocity.y += 0.005;
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

const polygons = [];
for (let i = 0; i < 12; i++) {
  polygons.push(new Polygon());
}

// const poly1 = new Polygon([new Vector(100, 100), new Vector(300, 500), new Vector(400, 300)]);
// poly1.linearVelocity = new Vector(0, 0);

// const poly2 = new Polygon([new Vector(800, 300), new Vector(700, 200), new Vector(500, 300)]);
// poly2.linearVelocity = new Vector(-5, .1);

// const polygons = [poly1, poly2];

function update() {
  // clearing the canvas
  context.clearRect(0, 0, canvas.width, canvas.height);

  // updating polygons
  for (let p of polygons) {
    p.updatePosition();
    p.draw();
  }

  // polygon-polygon interactions
  for (let i = 0; i < polygons.length; i++) {
    for (let j = 0; j < polygons.length; j++) {
      if (j !== i) {
        const p = polygons[i];
        const q = polygons[j];
        for (let k = 0; k < p.n; k++) {
          for (let l = 0; l < q.n; l++) {
            const a = p[k];
            const b = p[k + 1];
            const c = q[l];
            const d = q[l + 1];
            const e = q[l + 2];
            // Check if vertex d of polygon q is intersecting edge a -> b of
            // polygon p.
            if (intersects(a, b, c, d) && intersects(a, b, d, e)) {
              // Show the collision with a red dot
              context.beginPath();
              context.arc(...d.asArray, 10, 0, 2 * Math.PI);
              context.fillStyle = 'yellow';
              context.fill();

              // Get unit vector normal to edge
              let n = b.minus(a).perp;
              n = n.times(1 / n.norm);
              // n might point in the opposite direction; test by taking dot product
              if (n.dot(d.minus(q.cm)) > 0) {
                n = n.times(-1);
              }
              
              
              // Relative velocity at point of impact
              const v = q.velocityAt(d).minus(p.velocityAt(d));
              console.log('velocity edge', p.velocityAt(d));
              console.log('velocity spike', q.velocityAt(d));
              console.log('n', n.asArray);
              console.log('v', v.asArray);
              console.log('dot', v.dot(n));

              if (v.dot(n) < 0) {
                // Perform the collision
                const rq = d.minus(q.cm).perp;
                const rp = d.minus(p.cm).perp;

                
                
                console.log('rq', rp.asArray);
                console.log('rp', rq.asArray);

                // j is scalar impulse
                const j = -2 * v.dot(n) /
                  (1 / p.mass + 1 / q.mass + 
                    rq.dot(n) * rq.dot(n) / q.inertia +
                    rp.dot(n) * rp.dot(n) / p.inertia
                  );
                console.log(j);
                
                // updating velocities with impulse
                q.linearVelocity = q.linearVelocity.plus(n.times(j / q.mass));
                p.linearVelocity = p.linearVelocity.minus(n.times(j / p.mass));
                q.angularVelocity += rq.dot(n) * j / q.inertia;
                p.angularVelocity -= rp.dot(n) * j / p.inertia;

              }
            }
          }
        }
      }
    }
  }
}

// Useful for debugging
canvas.addEventListener('keydown', update, false);

// Updating the html canvas
setInterval(update, 10);
