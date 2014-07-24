var paintingSketch = function( sketch ) {

  sketch.paths = [];
  sketch.buffer = null;
  sketch.alphaBuffer = null;
  
  sketch.osc = null;
  sketch.lfo = null;

  sketch.painting = false;
  sketch.next = 0;
  sketch.lastPosition = null;

  // Range of midi notes to randomly select on path creation.

  sketch.notes = [60,62,64,65,67,69,71,72,74,76];

  sketch.setup = function() {

    // Full-window canvas
    // 
    sketch.createCanvas(window.innerWidth,window.innerHeight);
    sketch.strokeWeight(2);
    sketch.colorMode(sketch.HSB, 100);

    // Off-screen buffer for fading old elements
    // 
    sketch.buffer = sketch.createGraphics(sketch.width, sketch.height);
    sketch.buffer.colorMode(sketch.HSB, 100);
    sketch.buffer.strokeWeight(2);

    sketch.alphaBuffer = sketch.createGraphics(sketch.width, sketch.height);
    sketch.alphaBuffer.noStroke();

    sketch.alphaBuffer.canvas.getContext('2d').globalAlpha =.95;


    // Current and previous mouse position for force calculations
    // 
    sketch.mousePosition = new p5.Vector(0,0);
    sketch.lastPosition = new p5.Vector(0,0);

    // Main oscillator
    // 
    sketch.osc = new sketch.SinOsc(440);
    sketch.osc.amp(.5);

    // LFO to modify main oscillator
    // 
    sketch.lfo = new sketch.LFO(2);
    sketch.lfo.ampMod(sketch.osc);

  };

  sketch.draw = function() {
    sketch.clear();

    // Draw image buffer
    //sketch.alphaBuffer.clear();
    //sketch.alphaBuffer.image(sketch.buffer,0,0);
    //sketch.image(sketch.alphaBuffer, 0, 0);
   
    //sketch.buffer.clear();
    //sketch.buffer.image(sketch.alphaBuffer, 0, 0);

    sketch.image(sketch.buffer, 0, 0);

    // Add a circle to the current path
    if (sketch.millis() > sketch.next && sketch.painting) {

      // Grab mouse position
      sketch.mousePosition.x = sketch.mouseX;
      sketch.mousePosition.y = sketch.mouseY;

      // New particle's force is based on mouse movement
      var force = p5.Vector.sub(sketch.mousePosition, sketch.lastPosition);
      force.mult(.05);

      // Add new particle
      sketch.paths[sketch.paths.length - 1].add(sketch.mousePosition, force);
      
      // Schedule next circle
      sketch.next = sketch.millis() + sketch.random(100);

      // Store mouse values
      sketch.lastPosition.x = sketch.mousePosition.x;
      sketch.lastPosition.y = sketch.mousePosition.y;
    }

    // Modify the oscillators while painting
    if (sketch.painting) {

      // Tone frequency is based on mouseX
      // LFO frequency is based on mouseY
      var note = sketch.midiToFreq(sketch.notes[sketch.floor(sketch.map(sketch.mouseX, 0, sketch.width, 0, sketch.notes.length ))]);;        
      var mod = sketch.map(sketch.mouseY, 0, sketch.height, 4, 16);

      sketch.osc.freq(note);
      sketch.lfo.freq(mod);
    }

    // Draw all paths
    for( var i = 0; i < sketch.paths.length; i++) sketch.paths[i].display();
  }

  // Create a new path and ramp up oscillators
  sketch.mousePressed = function() {
    sketch.next = 0;
    sketch.painting = true;
    sketch.osc.start();
    sketch.lfo.start();

    sketch.osc.fade(.5,.2);
    sketch.lfo.fade(.5,.2);

    sketch.lastPosition.x = sketch.mouseX -10;
    sketch.lastPosition.y = sketch.mouseY - 10;

    sketch.paths.push(new sketch.Paths());

  }

  // Ramp down oscillators
  sketch.mouseReleased = function() {

    sketch.painting = false;
    sketch.osc.fade(0,.4);
    sketch.lfo.fade(0,.4);
    //sketch.osc.stop(.4);
    //sketch.lfo.stop(.4)
    
  }

  // Class to handle paths of circles
  sketch.Paths = function () {
    this.path = [];
    this.hue = sketch.random() * 100;
  }

  // Make the position a little fuzzy and add a circle
  sketch.Paths.prototype.add = function(position, force) {
    position.x += sketch.random(-5,5);
    position.y += sketch.random(-5,5);
    this.path.push(new sketch.Circle(position, force, this.hue++));
  }

  // Draw circles or stamp them to the buffer based on age
  sketch.Paths.prototype.display = function() {

    var i = this.path.length;

    while (i--) {

      var lastCircle = null;
      if (i < this.path.length) lastCircle = this.path[i+1];

      this.path[i].display(lastCircle);

      if (this.path[i].age > 100) {
        this.path[i].stamp(lastCircle);        
        this.path.splice(i, 1);
      }
    }

  }  

  // Class for individual circles on a path
  sketch.Circle = function (position, force, hue) {
    this.position = new p5.Vector(position.x,position.y);
    this.velocity = new p5.Vector(force.x,force.y);
    this.startMagnitude = this.velocity.mag();
    this.currentMagnitude = this.velocity.mag();
    this.drag = .95;
    this.hue = hue;
    this.age = 0;
  }

  // Draw a circle with size based on current magnitude
  // Draw a line to the previous circle
  sketch.Circle.prototype.display = function(lastCircle) {
    this.position.add(this.velocity);
    this.currentMagnitude = this.velocity.mag();

    var size = sketch.map( this.currentMagnitude, 0, this.startMagnitude, 12, 4);
    
    sketch.stroke( this.hue, 100, 100, 100);
    sketch.fill( this.hue, 100, 100, 50);
    sketch.ellipse(this.position.x,this.position.y, size, size);    
    
    if (lastCircle)
      sketch.line(this.position.x, this.position.y,
        lastCircle.position.x, lastCircle.position.y);

    this.velocity.mult(this.drag);

    this.age++;
  }

  // Stamp a circle to the buffer so we don't have to track them forever
  sketch.Circle.prototype.stamp = function(lastCircle) {

    sketch.buffer.stroke( this.hue, 100, 100, 100);
    sketch.buffer.fill( this.hue, 100, 100, 50);
    sketch.buffer.ellipse(this.position.x,this.position.y, 12, 12);

    if (lastCircle) {
      sketch.buffer.line(this.position.x, this.position.y,
        lastCircle.position.x, lastCircle.position.y);    
    }
  } 

  return sketch;
};


