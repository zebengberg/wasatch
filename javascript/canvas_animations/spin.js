// Getting html elements.
const WIDTH = window.innerWidth - 20;
const HEIGHT = window.innerHeight - 40;
const canvas = document.getElementById('myCanvas');
canvas.width = WIDTH;
canvas.height = HEIGHT;
const c = canvas.getContext('2d');


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
    this.push(vertices[0]);  // including first vertex at back of array

    this.setRandomColor();

    // Only calling these three getters once; using getters for cleanliness.
    this.mass = this.area;
    this.cm = this.centerOfMass;
    this.inertia = this.momentOfInertia;

    const LIN_MAX = 4;
    const ANG_MAX = 0.05;
    this.linearVelocity = new Vector(LIN_MAX * (2 * Math.random() - 1),
      LIN_MAX * (2 * Math.random() - 1));
    this.angularVelocity = ANG_MAX * (2 * Math.random() - 1);
  }


  // Returns random array of vertices defining a polygon.
  static buildVertices() {
    const n = 3 + Math.floor(3 * Math.random());
    const vertices = [];
    const RADIUS = 100;
    const NOISE = 100;
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
  velocityAt(i) {
    // r is perpendicular to the vector pointing from cm to vertex
    const r = this[i].minus(this.cm).perp;
    return this.linearVelocity.plus(r.times(this.angularVelocity));
  }


  updatePosition() {
    // Dealing with wall collision
    const [n, i] = this.normalToWall;
    if (n) {
      this.collideWithWall(n, i);
    }

    // Updating positions by integrating velocity functions
    const oldCM = this.cm;
    this.cm = oldCM.plus(this.linearVelocity);
    // Perform rotation about center of mass
    for (let i = 0; i <= this.n; i++) {
      this[i] = this[i].minus(oldCM).rotate(this.angularVelocity).plus(this.cm);
    }
  }

  draw() {
    // drawing polygon
    c.beginPath();
    c.moveTo(...this[0].asArray);
    for (let i = 1; i < this.n; i++) {
      c.lineTo(...this[i].asArray);
    }
    c.closePath();
    c.fillStyle = this.color;
    c.fill();

    // drawing center of mass
    c.beginPath();
    c.arc(...this.cm.asArray, 10, 0, 2 * Math.PI);
    c.fillStyle = 'black';
    c.fill();
  }

  // Get the normal vector away from the wall and index of penetrating vertex.
  get normalToWall() {
    for (let i = 0; i < this.n; i++) {
      if (this.velocityAt(i).x > 0 && this[i].x > WIDTH) {  // moving right
        return [new Vector(-1, 0), i];
      } else if (this.velocityAt(i).x < 0 && this[i].x < 0) {  // moving left
        return [new Vector(1, 0), i];
      } else if (this.velocityAt(i).y > 0 && this[i].y > HEIGHT) {  // moving down
        return [new Vector(0, -1), i];
      } else if (this.velocityAt(i).y < 0 && this[i].y < 0) {  // moving up
        return [new Vector(0, 1), i];
      }
    }
    return [false, null];  // indicating no penetration
  }


  // n is the normal vector to the wall
  // i is the index of the vertex that penetrates the wall
  // http://www.chrishecker.com/images/e/e7/Gdmphys3.pdf
  collideWithWall(n, i) {
    // r is perpendicular to the vector pointing from cm to vertex
    const r = this[i].minus(this.cm).perp;
    const e = 1;  // restitution constant
    // j is scalar impulse
    const j = -(1 + e) * this.velocityAt(i).dot(n) /
      (1 / this.mass + r.dot(n) * r.dot(n) / this.inertia);
    
    // updating velocities with impulse
    this.linearVelocity = this.linearVelocity.plus(n.times(j / this.mass));
    this.angularVelocity = this.angularVelocity + r.dot(n) * j / this.inertia;
  }

  // The ray casting algorithm
  // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
  // containsPoint(v) {
  //   let isIn = false;
  //   let j = this.n - 1;
  //   for (let i = 0; i < this.n; i++) {
  //     if (this.x[i])
  //   }
  //       for ( int i = 0, j = polygon.Length - 1 ; i < polygon.Length ; j = i++ )
  //       {
  //           if ( ( polygon[ i ].Y > p.Y ) != ( polygon[ j ].Y > p.Y ) &&
  //                p.X < ( polygon[ j ].X - polygon[ i ].X ) * ( p.Y - polygon[ i ].Y ) / ( polygon[ j ].Y - polygon[ i ].Y ) + polygon[ i ].X )
  //           {
  //               inside = !inside;
  //           }
  //       }
  //   let intersections = 0;
  //   for (let i = 0; i < this.n; i++) {
  //     let s = this.vertices[i + 1].minus(this.vertices[i]);  // an edge of poly
  //   }
  // }
  
}

const polygons = [];
for (let i = 0; i < 2; i++) {
  polygons.push(new Polygon());
}

function update() {
  // clearing the canvas
  c.clearRect(0, 0, canvas.width, canvas.height);

  // updating polygons
  for (let polygon of polygons) {
    polygon.draw();
    polygon.updatePosition();
  }
}

// Useful for debugging
canvas.addEventListener('keydown', update, false);

// Updating the html canvas
setInterval(update, 10);
