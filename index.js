var fillColor = 'white',
    strokeColor = 'blue';

/* Geometry */
function Point(x, y) {
  this.x = x;
  this.y = y;
}

function Vector2D(x, y) {
  this.x = x;
  this.y = y;
}

Vector2D.prototype.add = function(v) {
  this.x += v.x;
  this.y += v.y;

  return this;
};

Vector2D.prototype.sub = function(v) {
  this.x -= v.x;
  this.y -= v.y;

  return this;
};

Vector2D.prototype.scale = function(scale) {
  this.x *= scale;
  this.y *= scale;

  return this;
};

function Polygon(points, color) {
  this.points = points;
  this.color = color || 'rgb(0, 0, 0)';
}

Polygon.prototype.setColor = function(color) {
  this.color = color;
};

Polygon.prototype.drawStroked = function(ctx, scale, color) {

  ctx.strokeStyle = this.color;

  ctx.beginPath();
  ctx.moveTo(this.points[0].x, this.points[0].y);

  for(var i = 1; i < this.points.length; i++) {
    ctx.lineTo(this.points[i].x, this.points[i].y);
  }

  ctx.lineTo(this.points[0].x, this.points[0].y);

  ctx.stroke();
};

Polygon.prototype.drawFilled = function(ctx, color) {

  ctx.fillStyle = this.color;

  ctx.beginPath();
  ctx.moveTo(this.points[0].x, this.points[0].y);

  for(var i = 1; i < this.points.length; i++) {
    ctx.lineTo(this.points[i].x, this.points[i].y);
  }

  ctx.lineTo(this.points[0].x, this.points[0].y);

  ctx.fill();
};

Polygon.prototype.drawLines = function(ctx, color) {
  ctx.strokeStyle = this.color;

  ctx.beginPath();
  ctx.moveTo(this.points[0].x, this.points[0].y);

  for(var i = 1; i < this.points.length; i++) {
    ctx.lineTo(this.points[i].x, this.points[i].y);
  }

  ctx.stroke();
}

Polygon.prototype.drawPoints = function(ctx, color) {
  ctx.fillStyle = this.color;

  for(var i = 1; i < this.points.length; i++) {
    ctx.beginPath();
    ctx.arc(this.points[i].x, this.points[i].y, 0.5, 0, 2 * Math.PI);
    ctx.fill();
  }
}

/* Helpers */
var helpers = {

  distance: function(x1, y1, x2, y2) {
    var a = x1 - x2
    var b = y1 - y2

    var c = Math.sqrt(a * a + b * b);

    return c;
  },

  scalePoints: function(points, scale, center) {

    if (!center) {
      center = new Point(0, 0);
    }

    var scaledPoints = [];

    for (var i = 0; i < points.length; i++) {
      var vector = new Vector2D(points[i].x, points[i].y);

      vector
        .sub(new Vector2D(center.x, center.y))
        .scale(scale)
        .add(new Vector2D(center.x, center.y));

      scaledPoints.push(new Point(vector.x, vector.y));
    }

    return scaledPoints;
  },

  addPadding: function(array, other) {

    if (array.length == other.length) {
      return array;
    }

    var clone = [];

    if (array.length < other.length) {
      clone = array.slice(0);

      for (var i = 0; i < (other.length - array.length); i++) {
        clone.push(clone[clone.length - 1]);
      }

      return clone;
    }

    return array;
  },

  bubbleSort: function(array, value) {
    var clone = array.slice(0);

    var swapped;

    do {
      swapped = false;

      for (var i = 0; i < array.length-1; i++) {

        if (clone[i][value] > clone[i+1][value]) {
          var temp = clone[i];
          clone[i] = clone[i+1];
          clone[i+1] = temp;
          swapped = true;
        }
      }
    } while (swapped);

    return clone;
  }

}

/* Tweening */
var Tweening = {
  linear: function(currentTime, startValue, endValue, duration) {

    if (startValue === endValue || duration === 0) {
      return startValue;
    }

    var changeValue = endValue - startValue;

    return changeValue * currentTime / duration + startValue;
  },

  ease: function(currentTime, startValue, endValue, duration) {

    if (startValue === endValue || duration === 0) {
      return startValue;
    }

  	var changeValue = endValue - startValue;

      currentTime /= duration / 2;

  	if (currentTime < 1) {
        return changeValue / 2 * currentTime * currentTime + startValue;
      }

  	currentTime--;

    var value = -changeValue / 2 * (currentTime * (currentTime - 2) - 1) + startValue;

  	return value;
  }
}

/* Animation */
function Animation(keyframes, isLooping, type) {
  this.keyframes = keyframes || [];
  this.keyframes = helpers.bubbleSort(this.keyframes, 'time');

  this.isLooping = isLooping || false;

  this.type = type || 'line'; // lines, points, stroked, filled
}

Animation.prototype.addKeyframe = function(keyframe) {
  this.keyframes.push(keyframe);

  this.keyframes = helpers.bubbleSort(this.keyframes, 'time');
};

Animation.prototype.getData = function(time, tweening) {
  var duration = this.keyframes[this.keyframes.length - 1].time;

  if (time > duration) {

    if (this.isLooping) {
      time = time - (Math.floor(time / duration) * duration);
    } else {
      time = duration;
    }
  }

  var startKeyframe = 0;

  for (var i = 1; i < this.keyframes.length; i++) {
    if (this.keyframes[i].time < time) {
      startKeyframe++;
    }
  }

  var endKeyframe = 0;

  if (startKeyframe + 1 < this.keyframes.length) {
    endKeyframe = startKeyframe + 1;
  }

  var data = [];
  var startData = helpers.addPadding(this.keyframes[startKeyframe].data, this.keyframes[endKeyframe].data);
  var endData = helpers.addPadding(this.keyframes[endKeyframe].data, this.keyframes[startKeyframe].data);

  for (var i = 0; i < startData.length; i++) {
    var startPoint = startData[i],
        endPoint = endData[i];

    var sectionTime = time - this.keyframes[startKeyframe].time,
        sectionDuration = this.keyframes[endKeyframe].time - this.keyframes[startKeyframe].time;

    data.push(new Point(
      Tweening[tweening](sectionTime, startPoint.x, endPoint.x, sectionDuration),
      Tweening[tweening](sectionTime, startPoint.y, endPoint.y, sectionDuration)
    ));
  }

  return data;
};

/* App */
function App(config) {
  var that = this;

  if (!config) {
    throw new Error('no configuration found');
  }

  if (!config.canvas) {
    throw new Error('no canvas element found');
  }

  this.canvas = config.canvas;

  this.width = this.canvas.width;
  this.height = this.canvas.height;

  this.resizeCanvas();

  window.addEventListener('resize', function() {
    that.resizeCanvas();
  });

  this.time = 0;
  this.tempo = 1;
  this.isRunning = false;

  this.autoInvertColors = true;
  this.autoChangeAnimations = true;
  this.animationChangeInterval = 100;
  this.tweening = 'ease';
  this.autoMoveCenter = true;
  this.depthEnabled = true;
  this.depthCount = 10;
  this.zooming = true;
  this.clearOpacity = 1.0;
  this.invertColors = false;

  this.center = new Point(this.canvas.width / 2, this.canvas.height / 2);
  this.initialCenter = this.center;

  this.noise = new SimplexNoise();

  this.polygon = new Polygon([]);

  this.animations = [];

  if (!config.animations) {
    throw new Error('no animations found');
  }

  this.animations = config.animations;

  this.currentAnimationStartTime = 0;
  this.currentAnimation = this.animations[0];

  this.centerAnimationTime = 50;
  this.centerAnimationStartTime = 0;
  this.centerAnimation = new Animation([{
    time: 0,
    data: [ new Point(this.width / 2, this.height / 2) ]
  }]);

  var context = this.canvas.getContext('2d');

  context.lineWidth = 10;

  this.datGui = undefined;

  if (config.variables) {
    this.datGui = new dat.GUI();

    this.updateGui(config.variables);
  }

  window.addEventListener('keydown', function(e) {

    if (e.key === 'i') {
      that.invertColors = !that.invertColors;
    }

    if (e.key === 'a') {
      that.changeAnimation();
    }
  });

  this.canvas.addEventListener('mousedown', function(e) {
    var x = event.clientX;
    var y = event.clientY;

    that.autoMoveCenter = false;

    that.centerAnimation = new Animation([
      {
        time: 0,
        data: [ new Point(that.center.x, that.center.y) ]
      },
      {
        time: that.centerAnimationTime,
        data: [ new Point(x, y) ]
      }
    ]);

    that.centerAnimationStartTime = that.time;
  });
}

App.prototype.changeAnimation = function() {
  var animation = Math.floor(Math.random() * this.animations.length);

  this.currentAnimationStartTime = this.time;

  this.currentAnimation = this.animations[animation];
}

App.prototype.updateGui = function(variables) {
  this.datGui.destroy();
  this.datGui = new dat.GUI();

  var that = this;

  if (variables) {
    variables.forEach(function(variable) {

      var controller;

      switch (variable.type) {
        case 'boolean':
          controller = that.datGui.add(that, variable.variable).listen();
          break;
        case 'number':
          controller = that.datGui.add(that, variable.variable, variable.min, variable.max).listen();
          break;
        case 'dropdown':
          controller = that.datGui.add(that, variable.variable, variable.options).listen();
          break;
      }

      if (variable.name) {
        controller.name(variable.name);
      }
    });
  }
};

App.prototype.resizeCanvas = function() {
  this.canvas.width = document.documentElement.clientWidth;
  this.canvas.height = document.documentElement.clientHeight;

  this.height = this.canvas.height;
  this.width = this.canvas.width;
}

App.prototype.run = function() {
  var that = this;

  this.isRunning = true;

  if (this.datGui) {
    for (var i in this.datGui.__controllers) {
      this.datGui.__controllers[i].updateDisplay();
    }
  }

  function innerRun() {

    if (that.isRunning) {
      that.clear();
      that.update();

      that.time = that.time + that.tempo;
    }

    requestAnimationFrame(innerRun);
  }

  innerRun();
}

App.prototype.stop = function() {
  this.isRunning = false;
}

App.prototype.clear = function() {
  var context = this.canvas.getContext('2d');

  if (this.invertColors) {
    context.fillStyle = 'rgba(255, 255, 255, ' + this.clearOpacity + ')';
  } else {
    context.fillStyle = 'rgba(0, 0, 255, ' + this.clearOpacity + ')';
  }

  context.fillRect(0, 0, this.width, this.height);
}

App.prototype.update = function() {

  var that = this;

  var context = this.canvas.getContext('2d');

  if (Math.random() < 0.01 * this.tempo && this.autoInvertColors) {
    this.invertColors = !this.invertColors;
  }

  if (this.autoMoveCenter) {
    var offsetX = this.noise.noise2D(this.time / 500, 0) * 250;
    var offsetY = this.noise.noise2D(1000 + this.time / 500, 0) * 250;

    this.center = new Point(this.initialCenter.x + offsetX, this.initialCenter.y + offsetY);
  } else {
    this.center = this.centerAnimation.getData(
      this.time - this.centerAnimationStartTime, this.tweening)[0];
  }

  var offsetScale = this.noise.noise2D(1000 + this.time / 500, 0) + 1;

  if (this.time % this.animationChangeInterval === 0 && this.autoChangeAnimations) {
    this.changeAnimation();
  }

  this.polygon.points = this.currentAnimation.getData(
    this.time - this.currentAnimationStartTime, this.tweening);

  if (this.depthEnabled) {

    for (var i = 1; i <= this.depthCount; i++) {

      var points = helpers.scalePoints(this.polygon.points, 1 / (i * offsetScale), this.center);

      var polygon = new Polygon(points);

      if (this.currentAnimation.type === 'filled') {
        this.invertColors ? polygon.setColor(strokeColor)
          : polygon.setColor(fillColor);

        polygon.drawFilled(context);
      } else if (this.currentAnimation.type === 'stroked') {
        this.invertColors ? polygon.setColor(strokeColor)
          : polygon.setColor(fillColor);

        polygon.drawStroked(context);
      } else if (this.currentAnimation.type === 'lines') {
        this.invertColors ? polygon.setColor(strokeColor)
          : polygon.setColor(fillColor);

        polygon.drawLines(context);
      } else {
        this.invertColors ? this.polygon.setColor(strokeColor)
          : this.polygon.setColor(fillColor);

        this.polygon.drawPoints(context);
      }

    }

  } else {

    if (this.currentAnimation.type === 'filled') {
      this.invertColors ? this.polygon.setColor(strokeColor)
        : this.polygon.setColor(fillColor);

      this.polygon.drawFilled(context);
    } else if (this.currentAnimation.type === 'stroked') {
      this.invertColors ? this.polygon.setColor(strokeColor)
        : this.polygon.setColor(fillColor);

      this.polygon.drawStroked(context);
    } else if (this.currentAnimation.type === 'lines') {
      this.invertColors ? this.polygon.setColor(strokeColor)
        : this.polygon.setColor(fillColor);

      this.polygon.drawLines(context);
    } else {
      this.invertColors ? this.polygon.setColor(strokeColor)
        : this.polygon.setColor(fillColor);

      this.polygon.drawPoints(context);
    }

  }
}

/* Run */
var noise = new SimplexNoise();

function createRandomFilledParallelogram(width, height) {

  function createRandomParallelogramPoints(width, height) {
    var x1 = Math.random() * (width - 100) + 50;
    var x2 = x1 + Math.random() * 500 + 50;
    var y1 = Math.random() * 500 + 50;
    var x3 = width - Math.random() * 500 - 50;
    var x4 = x3 - Math.random() * (width - 500) - 50;
    var y2 = height - Math.random() * 500 - 50;

    points = [
      new Point(x1, y1),
      new Point(x2, y1),
      new Point(x3, y2),
      new Point(x4, y2)
    ];

    return points;
  }

  var firstAndLast = createRandomParallelogramPoints(width, height);

  return new Animation([
    { time: 0, data: firstAndLast },
    { time: 200, data: createRandomParallelogramPoints(width, height) },
    { time: 350, data: createRandomParallelogramPoints(width, height) },
    { time: 400, data: firstAndLast }
  ], true, 'filled');
}

function createRandomStrokedOval(width, height) {

  function createRandomOvalPoints(width, height) {

    var noiseOffset = Math.random() * 10000;

    var radiusOffset = Math.random() * (width > height ? height / 3 : width / 3);

    var radiusX = width > height ? height - radiusOffset : width - radiusOffset;
    var radiusY = width > height ? height - radiusOffset : width - radiusOffset;
    var center = { x: width / 2, y: height / 2 };

    var points = [];

    var n = Math.random() * 95 + 5;

    for (var i = 0; i < Math.PI * 2; i += Math.PI * 2 / n) {
      var x = radiusX * Math.cos(i) + center.x + noise.noise2D(i + noiseOffset, 0) * 200;
      var y = radiusY * Math.sin(i) + center.y + noise.noise2D(0, i + noiseOffset) * 200;

      points.push(new Point(x, y));
    }

    return points;
  }

  var firstAndLast = createRandomOvalPoints(width, height);

  return new Animation([
    { time: 0, data: firstAndLast },
    { time: 200, data: createRandomOvalPoints(width, height) },
    { time: 250, data: createRandomOvalPoints(width, height) },
    { time: 400, data: firstAndLast }
  ], true, 'stroked');
}

function createRandomPointsField(width, height) {

  function createRandomPointsFieldPoints(width, height) {

    var randomN = Math.random() * 10 + 40;

    var nX = width / randomN;
    var nY = height / randomN;

    var stepX = width / nX;
    var stepY = height / nY;

    var offsetNoise = Math.random() * 10000;

    var points = [];

    for (var i = 0; i < nX; i++) {

      for (var j = 0; j < nY; j++) {
        var offsetX = noise.noise2D(i * j / 10 + offsetNoise, 0) * 10;
        var offsetY = noise.noise2D(i * j / 10 + offsetNoise + 1000, 0) * 10;

        points.push(new Point(i * stepX + offsetX, j * stepY + offsetY));
      }
    }

    return points;

  }

  var firstAndLast = createRandomPointsFieldPoints(width, height);

  return new Animation([
    { time: 0, data: firstAndLast },
    { time: 200, data: createRandomPointsFieldPoints(width, height) },
    { time: 250, data: createRandomPointsFieldPoints(width, height) },
    { time: 500, data: firstAndLast }
  ], true, 'lines');
}

var createRandomFunctions = [
  createRandomFilledParallelogram,
  createRandomStrokedOval,
  createRandomPointsField
  ];

function createRandomAnimations(count) {
  var animations = [];

  var canvas = document.querySelector('canvas');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  for (var i = 0; i < count; i++) {
    var index = Math.floor(Math.random() * createRandomFunctions.length);

    animations.push(createRandomFunctions[index](canvas.width, canvas.height));
  }

  return animations;
}

var app = new App({
  canvas: document.querySelector('canvas'),
  variables: [
    { type: 'boolean', variable: 'isRunning', name: 'Play/Pause' },
    { type: 'number', variable: 'tempo', min: 0.1, max: 10, name: 'Tempo' },
    { type: 'boolean', variable: 'autoInvertColors', name: 'Invert colors automatically' },
    { type: 'boolean', variable: 'autoChangeAnimations', name: 'Change animations automatically' },
    { type: 'dropdown', variable: 'tweening', options: [ 'ease', 'linear' ], name: 'Tweening'},
    { type: 'boolean', variable: 'autoMoveCenter', name: 'Move center automatically' },
    { type: 'boolean', variable: 'depthEnabled', name: 'Depth enabled' },
    { type: 'number', variable: 'depthCount', min: 1, max: 20, name: 'Depth' },
    { type: 'boolean', variable: 'zooming', name: 'Zoom' },
    { type: 'number', variable: 'clearOpacity', min: 0.1, max: 1, name: 'Clear opacity' },
    { type: 'boolean', variable: 'invertColors', name: 'Invert colors' },
  ],
  animations: createRandomAnimations(10)
});

// kick off app
app.run();