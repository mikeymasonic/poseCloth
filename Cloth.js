let video;
let poseNet;
let poses = [];
let pose;
let right;
let left;
let scoreLeft;
let scoreRight;
// let nose;
// let leftEye;
// let rightEye;

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(width, height);

  // Create a new poseNet method with a single detection
  poseNet = ml5.poseNet(video, modelReady);
  // This sets up an event that fills the global variable "poses"
  // with an array every time new poses are detected
  poseNet.on("pose", function(results) {
    poses = results;
  });
  // Hide the video element, and just show the canvas
  video.hide();
}

function modelReady() {
  select("#status").html("Model Loaded");
}

function draw() {
  image(video, 0, 0, width, height);

  // We can call both functions to draw all keypoints and the skeletons
  drawKeypoints();
  // drawSkeleton();
  
  // pose = poses[0].pose;
  // left = pose['leftWrist'];
  // right = pose['rightWrist'];
  // scoreRight = poses[0].pose.keypoints[10].score;
  // scoreLeft = poses[0].pose.keypoints[9].score;

  // if(poses.length > 0) {
  //   console.log('leftWrist: ', poses[0].pose.keypoints[9].position.x);
  // }
  
  // console.log('left wrist: ', left);
  // console.log('right wrist: ', right);
  // console.log('score left: ', scoreLeft);
  // console.log('score right: ', scoreRight);
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints() {
  // Loop through all the poses detected
  for (let i = 0; i < poses.length; i += 1) {
    // For each pose detected, loop through all the keypoints
    const pose = poses[i].pose;
    // const pose = poses[i].pose['leftWrist'];
    // const leftWrist = poses[i].pose['leftWrist'];
    for (let j = 0; j < pose.keypoints.length; j += 1) {
      // A keypoint is an object describing a body part (like rightArm or leftShoulder)
      const keypoint = pose.keypoints[j];
      // Only draw an ellipse is the pose probability is bigger than 0.2
      if (keypoint.score > 0.2) {
        fill(255, 0, 0);
        noStroke();
        ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
        // console.log(keypoint.position.x, keypoint.position.y)
      }
    }
  }
}

// A function to draw the skeletons
// function drawSkeleton() {
//   // Loop through all the skeletons detected
//   for (let i = 0; i < poses.length; i += 1) {
//     const skeleton = poses[i].skeleton;
//     // For every skeleton, loop through all body connections
//     for (let j = 0; j < skeleton.length; j += 1) {
//       const partA = skeleton[j][0];
//       const partB = skeleton[j][1];
//       stroke(255, 0, 0);
//       line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
//     }
//   }
// }

/////////////////

function dragTracker(options) {
  "use strict";
  
  //Element.closest polyfill:
  //https://developer.mozilla.org/en-US/docs/Web/API/Element/closest
  const ep = Element.prototype;
  if (!ep.matches)
       ep.matches = ep.msMatchesSelector || ep.webkitMatchesSelector;
  if (!ep.closest)
       ep.closest = function(s) {
          var node = this;
          do {
              if(node.matches(s)) return node;
              //https://github.com/Financial-Times/polyfill-service/issues/1279
              node = (node.tagName === 'svg') ? node.parentNode : node.parentElement;
          } while(node); 

          return null;
      };


  options = options || {};
  const container = options.container || document.documentElement,
        callback = options.callback || console.log,
        callbackStart = options.callbackDragStart,
        callbackEnd = options.callbackDragEnd,
        selector = options.selector,
        //handleOffset: "center", true (default), false
        handleOffset = options.handleOffset || (options.handleOffset !== false),
        roundCoords = (options.roundCoords !== false),
        dragOutside = (options.dragOutside !== false)
  ;
  //Whether callback coordinates should be the dragged element's center instead of the top-left corner
  let offsetToCenter = null;
  switch(handleOffset) {
      case 'center':
          offsetToCenter = true; break;
      case 'topleft':
      case 'top-left':
          offsetToCenter = false; break;
  }


  let dragged, mouseOffset, dragStart;
  
  function getMousePos(e, elm, offset, stayWithin) {
      // let x = e.clientX,
      //     y = e.clientY;

      let x = e.poses[0].pose.keypoints[9].position.x,
          y = e.poses[0].pose.keypoints[9].position.y;

      function respectBounds(value, min, max) {
          return Math.max(min, Math.min(value, max));
      }

      if(elm) {
          const bounds = elm.getBoundingClientRect();
          x -= bounds.left;
          y -= bounds.top;

          if(offset) {
              x -= offset[0];
              y -= offset[1];
          }
          if(stayWithin) {
              x = respectBounds(x, 0, bounds.width);
              y = respectBounds(y, 0, bounds.height);
          }

          //Adjust the mouseOffset on the dragged element
          //if the element is positioned by its center:
          if(elm !== container) {
              const center = (offsetToCenter !== null)
                  ? offsetToCenter
                  //SVG circles and ellipses are positioned by their center (cx/cy), not the top-left corner:
                  : (elm.nodeName === 'circle') || (elm.nodeName === 'ellipse');

              if(center) {
                  x -= bounds.width/2;
                  y -= bounds.height/2;
              }
          }
      }
      return (roundCoords ? [Math.round(x), Math.round(y)] : [x, y]);
  }

  function onDown(e) {
      dragged = selector ? e.target.closest(selector) : {};
      if(dragged) {
          e.preventDefault();

          mouseOffset = (selector && handleOffset) ? getMousePos(e, dragged) : [0, 0];
          dragStart = getMousePos(e, container, mouseOffset);
          if(roundCoords) { dragStart = dragStart.map(Math.round); }
          
          if(callbackStart) {
              callbackStart(dragged, dragStart);
          }
      }
  }

  function onMove(e) {
      if(!dragged) { return; }
      e.preventDefault();

      const pos = getMousePos(e, container, mouseOffset, !dragOutside);
      callback(dragged, pos, dragStart);
  }

  function onEnd(e) {
      if(!dragged) { return; }

      if(callbackEnd) {
          const pos = getMousePos(e, container, mouseOffset, !dragOutside);
          callbackEnd(dragged, pos, dragStart);
      }
      dragged = null;
  }

  /* Mouse/touch input */

  container.addEventListener('mousedown', function(e) {
      if(isLeftButton(e)) { onDown(e); }
  });
  container.addEventListener('touchstart', function(e) {
      onDown(tweakTouch(e));
  });

  window.addEventListener('mousemove', function(e) {
      if(!dragged) { return; }

      if(isLeftButton(e)) { onMove(e); }
      //"mouseup" outside of window
      else { onEnd(e); }
  });
  window.addEventListener('touchmove', function(e) {
      onMove(tweakTouch(e));
  });

  container.addEventListener('mouseup', function(e) {
      //Here we check that the left button is *no longer* pressed:
      if(!isLeftButton(e)) { onEnd(e); }
  });
  function onTouchEnd(e) { onEnd(tweakTouch(e)); }
  container.addEventListener('touchend', onTouchEnd);
  container.addEventListener('touchcancel', onTouchEnd);


  function isLeftButton(e) {
      return (e.buttons !== undefined)
          ? (e.buttons === 1)
          //Safari (not tested):
          //https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent#Browser_compatibility
          : (e.which === 1);
  }
  function tweakTouch(e) {
      let touch = e.targetTouches[0];
      //touchend:
      if(!touch) { touch = e.changedTouches[0]; }
      
      touch.preventDefault = e.preventDefault.bind(e);
      return touch;
  }
}

/////////////////

let accuracy = 5,
    clothX = 60,
    clothY = 25,
    spacing = 8,
    tearDist = spacing * 4,
    friction = 0.99,
    bounce = 0.5,
    gravity = 400,
    modePull = true;


const canvas = document.getElementById("canvas"),
      ctx = canvas.getContext("2d");

ctx.strokeStyle = "#555";

const w = canvas.width = Math.min(700, window.innerWidth),
      h = canvas.height = 400;

const mouse = {
  cut: spacing,
  influence: spacing * 2,
  down: false,
  //button: 1,
  x: 0,
  y: 0,
  px: 0,
  py: 0,
};

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;

    // if(poses[0] > 0) {
    //   this.x = poses[0].pose.keypoints[9].position.x;
    //   this.y = poses[0].pose.keypoints[9].position.y;
    // }
    
    this.px = x;
    this.py = y;
    this.vx = 0;
    this.vy = 0;
    this.pinX = null;
    this.pinY = null;

    this.constraints = [];
  }

  update(delta) {
    if (this.pinX && this.pinY) { return this; }

    if (mouse.down) {
      let dx = this.x - mouse.x;
      let dy = this.y - mouse.y;
      let dist = Math.sqrt(dx * dx + dy * dy);

      if (modePull && dist < mouse.influence) {
        this.px = this.x - (mouse.x - mouse.px);
        this.py = this.y - (mouse.y - mouse.py);
      } else if (dist < mouse.cut) {
        this.constraints = [];
      }
    }

    this.addForce(0, gravity);

    let nx = this.x + (this.x - this.px) * friction + this.vx * delta;
    let ny = this.y + (this.y - this.py) * friction + this.vy * delta;

    this.px = this.x;
    this.py = this.y;

    this.x = nx;
    this.y = ny;

    this.vy = this.vx = 0;

    if (this.x >= w) {
      this.px = w + (w - this.px) * bounce;
      this.x = w;
    } else if (this.x <= 0) {
      this.px *= -1 * bounce;
      this.x = 0;
    }

    if (this.y >= h) {
      this.py = h + (h - this.py) * bounce;
      this.y = h;
    } else if (this.y <= 0) {
      this.py *= -1 * bounce;
      this.y = 0;
    }

    return this;
  }

  draw() {
    let i = this.constraints.length;
    while (i--) this.constraints[i].draw();
  }

  resolve() {
    if (this.pinX && this.pinY) {
      this.x = this.pinX;
      this.y = this.pinY;
      return;
    }

    this.constraints.forEach(constraint => constraint.resolve());
  }

  attach(point) {
    this.constraints.push(new Constraint(this, point));
  }

  free(constraint) {
    this.constraints.splice(this.constraints.indexOf(constraint), 1);
  }

  addForce(x, y) {
    this.vx += x;
    this.vy += y;
  }

  pin(pinx, piny) {
    this.pinX = pinx;
    this.pinY = piny;
  }
}

class Constraint {
  constructor(p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
    this.length = spacing;
  }

  resolve() {
    let dx = this.p1.x - this.p2.x;
    let dy = this.p1.y - this.p2.y;
    let dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.length) return;

    let diff = (this.length - dist) / dist;

    if (dist > tearDist) this.p1.free(this);

    let mul = diff * 0.5 * (1 - this.length / dist);

    let px = dx * mul;
    let py = dy * mul;

    !this.p1.pinX && (this.p1.x += px);
    !this.p1.pinY && (this.p1.y += py);
    !this.p2.pinX && (this.p2.x -= px);
    !this.p2.pinY && (this.p2.y -= py);

    return this;
  }

  draw() {
    ctx.moveTo(this.p1.x, this.p1.y);
    ctx.lineTo(this.p2.x, this.p2.y);
  }
}

class Cloth {
  constructor(free) {
    this.points = [];

    let startX = w / 2 - clothX * spacing / 2;

    for (let y = 0; y <= clothY; y++) {
      for (let x = 0; x <= clothX; x++) {
        let point = new Point(startX + x * spacing, 20 + y * spacing);
        !free && y === 0 && point.pin(point.x, point.y);
        x !== 0 && point.attach(this.points[this.points.length - 1]);
        y !== 0 && point.attach(this.points[x + (y - 1) * (clothX + 1)]);

        this.points.push(point);
      }
    }
  }

  update(delta) {
    let i = accuracy;

    while (i--) {
      this.points.forEach(point => {
        point.resolve();
      });
    }

    ctx.beginPath();
    this.points.forEach(point => {
      point.update(delta * delta).draw();
    });
    ctx.stroke();
  }
}

dragTracker({
  container: canvas,
  callbackDragStart: (_, pos) => {
    mouse.down = true;
    mouse.px = mouse.x = pos[0];
    mouse.py = mouse.y = pos[1];
    // console.log('pose[0]: ', pos[0])
    // console.log('pose[1]: ', pos[1])
  },
  callback: (_, pos) => {
    mouse.px = mouse.x;
    mouse.py = mouse.y;
    mouse.x = pos[0];
    mouse.y = pos[1];
  },
  callbackDragEnd: () => {
    mouse.down = false;
  },
});


let cloth = new Cloth();

//Animation loop
(function update(time) {
  ctx.clearRect(0, 0, w, h);
  cloth.update(0.016);

  requestAnimationFrame(update);
})();


let _g;
function zeroG() {
  if(gravity) {
    _g = gravity;
    gravity = 0;
  }
  else {
    gravity = _g;
  }
}
function setMode(pull) {
  modePull = pull;
}
function reset() {
  cloth = new Cloth(!gravity);
}


////////////////////////////////////////////////////////////////



// window.requestAnimFrame =
//   window.requestAnimationFrame ||
//   window.webkitRequestAnimationFrame ||
//   window.mozRequestAnimationFrame ||
//   window.oRequestAnimationFrame ||
//   window.msRequestAnimationFrame ||
//   function (callback) {
//     window.setTimeout(callback, 1e3 / 60)
//   }

// let accuracy = 5
// let gravity = 400
// let clothY = 24
// let clothX = 50
// let spacing = 8
// let tearDist = 60
// let friction = 0.99
// let bounce = 0.5

// let canvas = document.getElementById('canvas')
// let ctx = canvas.getContext('2d')

// canvas.width = Math.min(700, window.innerWidth)
// canvas.height = 400

// ctx.strokeStyle = '#555'

// let mouse = {
//   cut: 8,
//   influence: 36,
//   down: false,
//   button: 1,
//   x: 0,
//   y: 0,
//   px: 0,
//   py: 0
// }

// class Point {
//   constructor (x, y) {
//     this.x = x
//     this.y = y
//     this.px = x
//     this.py = y
//     this.vx = 0
//     this.vy = 0
//     this.pinX = null
//     this.pinY = null

//     this.constraints = []
//   }

//   update (delta) {
//     if (this.pinX && this.pinY) return this

//     if (mouse.down) {
//       let dx = this.x - mouse.x
//       let dy = this.y - mouse.y
//       let dist = Math.sqrt(dx * dx + dy * dy)

//       if (mouse.button === 1 && dist < mouse.influence) {
//         this.px = this.x - (mouse.x - mouse.px)
//         this.py = this.y - (mouse.y - mouse.py)
//       } else if (dist < mouse.cut) {
//         this.constraints = []
//       }
//     }

//     this.addForce(0, gravity)

//     let nx = this.x + (this.x - this.px) * friction + this.vx * delta
//     let ny = this.y + (this.y - this.py) * friction + this.vy * delta

//     this.px = this.x
//     this.py = this.y

//     this.x = nx
//     this.y = ny

//     this.vy = this.vx = 0

//     if (this.x >= canvas.width) {
//       this.px = canvas.width + (canvas.width - this.px) * bounce
//       this.x = canvas.width
//     } else if (this.x <= 0) {
//       this.px *= -1 * bounce
//       this.x = 0
//     }

//     if (this.y >= canvas.height) {
//       this.py = canvas.height + (canvas.height - this.py) * bounce
//       this.y = canvas.height
//     } else if (this.y <= 0) {
//       this.py *= -1 * bounce
//       this.y = 0
//     }

//     return this
//   }

//   draw () {
//     let i = this.constraints.length
//     while (i--) this.constraints[i].draw()
//   }

//   resolve () {
//     if (this.pinX && this.pinY) {
//       this.x = this.pinX
//       this.y = this.pinY
//       return
//     }

//     this.constraints.forEach((constraint) => constraint.resolve())
//   }

//   attach (point) {
//     this.constraints.push(new Constraint(this, point))
//   }

//   free (constraint) {
//     this.constraints.splice(this.constraints.indexOf(constraint), 1)
//   }

//   addForce (x, y) {
//     this.vx += x
//     this.vy += y
//   }

//   pin (pinx, piny) {
//     this.pinX = pinx
//     this.pinY = piny
//   }
// }

// class Constraint {
//   constructor (p1, p2) {
//     this.p1 = p1
//     this.p2 = p2
//     this.length = spacing
//   }

//   resolve () {
//     let dx = this.p1.x - this.p2.x
//     let dy = this.p1.y - this.p2.y
//     let dist = Math.sqrt(dx * dx + dy * dy)

//     if (dist < this.length) return

//     let diff = (this.length - dist) / dist

//     if (dist > tearDist) this.p1.free(this)

//     let mul = diff * 0.5 * (1 - this.length / dist)

//     let px = dx * mul
//     let py = dy * mul

//     !this.p1.pinX && (this.p1.x += px)
//     !this.p1.pinY && (this.p1.y += py)
//     !this.p2.pinX && (this.p2.x -= px)
//     !this.p2.pinY && (this.p2.y -= py)

//     return this
//   }

//   draw () {
//     ctx.moveTo(this.p1.x, this.p1.y)
//     ctx.lineTo(this.p2.x, this.p2.y)
//   }
// }

// class Cloth {
//   constructor (free) {
//     this.points = []

//     let startX = canvas.width / 2 - clothX * spacing / 2

//     for (let y = 0; y <= clothY; y++) {
//       for (let x = 0; x <= clothX; x++) {
//         let point = new Point(startX + x * spacing, 20 + y * spacing)
//         !free && y === 0 && point.pin(point.x, point.y)
//         x !== 0 && point.attach(this.points[this.points.length - 1])
//         y !== 0 && point.attach(this.points[x + (y - 1) * (clothX + 1)])

//         this.points.push(point)
//       }
//     }
//   }

//   update (delta) {
//     let i = accuracy

//     while (i--) {
//       this.points.forEach((point) => {
//         point.resolve()
//       })
//     }

//     ctx.beginPath()
//     this.points.forEach((point) => {
//       point.update(delta * delta).draw()
//     })
//     ctx.stroke()
//   }
// }

// function setMouse (e) {
//   let rect = canvas.getBoundingClientRect()
//   mouse.px = mouse.x
//   mouse.py = mouse.y
//   mouse.x = e.clientX - rect.left
//   mouse.y = e.clientY - rect.top
// }

// canvas.onmousedown = (e) => {
//   mouse.button = e.which
//   mouse.down = true
//   setMouse(e)
// }

// canvas.onmousemove = setMouse

// canvas.onmouseup = () => (mouse.down = false)

// canvas.oncontextmenu = (e) => e.preventDefault()

// let cloth = new Cloth()

// function zeroG() {
//   gravity = 0
//   cloth = new Cloth(true)
// }

// ;(function update (time) {
//   ctx.clearRect(0, 0, canvas.width, canvas.height)

//   cloth.update(0.016)

//   window.requestAnimFrame(update)
// })(0)
