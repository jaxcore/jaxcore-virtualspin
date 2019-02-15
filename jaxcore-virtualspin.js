var EventEmitter = require('events').EventEmitter;
var Matter = require('matter-js');

var Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body;


function startInterval(f) {
    f();
    return setInterval(f);
}

function VirtualSpin(config) {
    //this.constructor();

    this.events = new EventEmitter();
    
    this.config = config;
    // /this.canvasRef = config.canvasRef;
    
    this.engine = config.engine;
    
    this.defaultSize = 200;
    this.defaultBodySize = 50;
    this.worldWidth = config.width || 200;
    this.worldHeight = config.height || 200;
    this.scale = this.worldWidth / this.defaultSize;
    this.x = this.scale * (config.x || 100);
    this.y = this.scale * (config.y || 100);
    this.size = this.scale * (this.defaultBodySize);
   
    this.color = config.color || 'white';
    
    this.ledRefs = [];
    this.ledColors = [];
    for (let i = 0; i < 24; i++) {
        this.ledColors[i] = [0, 0, 0];
    }
    
    this.rotationIndex = 0;
    this.spinPosition = 0;
    this.buttonPushed = false;
    this.knobPushed = false;
    this.knobHeld = false;
    this.buttonHeld = false;
    
    this.isSpinningLeft = false;
    this.isSpinningRight = false;
    this.isSlowSpinningLeft = false;
    this.isSlowSpinningRight = false;
    
    this.spinLeftTimer = null;
    this.spinRightTimer = null;
    this.torqueStart = config.torqueStart || 0;
    this.leftTorqueAccel = this.torqueStart;
    this.rightTorqueAccel = this.torqueStart;
    this.torqueAccel = (config.torqueAccel || Math.PI / 8000) * this.scale;
    this.torqueMax = (config.torqueMax || 100 * this.scale);
    this.torqueInterval = (config.torqueMax || 20);
    this.friction = (config.friction || 0.05);
    
    
    //if (!this.createWorld();
    
    this.createShape();
}

VirtualSpin.prototype = {}; //new EventEmitter;
//VirtualSpin.prototype.constructor = EventEmitter;

VirtualSpin.engine = null;

VirtualSpin.createWorld = function (canvasRef, worldWidth, worldHeight) {
    var engine = Engine.create();
    
    engine.world.gravity.y = 0;
    
    var render = Render.create({
        element: canvasRef.current,
        engine: engine,
        options: {
            width: worldWidth,
            height: worldHeight,
            showVelocity: true,
            wireframes: false, // Draw the shapes as solid colors
            background: "#000"
        }
    });

    Render.run(render);

    var runner = Runner.create();
    Runner.run(runner, engine);
    
    Render.lookAt(render, {
        min: { x: 0, y: 0 },
        max: { x: worldWidth, y: worldHeight }
    });
    
    return engine;
};

VirtualSpin.prototype.setLeds = function (ledRefs) {
    this.ledRefs = ledRefs;
    this.updateLeds();
};

VirtualSpin.prototype.setColor = function (color) {
    this.color = color;
    this.knob.render.strokeStyle = this.color.toString();
};
VirtualSpin.prototype.createShape = function () {
    var shape = 'polygon';
    this.knob = Bodies[shape](this.x, this.y, 3, this.size, {
        frictionAir: this.friction,
        render: {
            fillStyle: 'transparent',
            strokeStyle: this.color,
            lineWidth: 4
        }
        // restitution: 0.1,
        //background: "#F00"
    });
    
    // this.knob = Bodies.rectangle(100, 100, 50, 50, {
    //     frictionAir: this.friction,
    //     // background: "#F00"
    //     background: "red",
    //     wireframeBackground: 'red'
    // });
    
    World.add(this.engine.world, [
        this.knob
    ]);

};

VirtualSpin.prototype.updateLeds = function () {
    var color;
    if (this.ledRefs) {
        this.ledRefs.forEach(function (ref, i) {
            r = this.ledColors[i][0];
            g = this.ledColors[i][1];
            b = this.ledColors[i][2];
            color = 'rgb(' + r + ',' + g + ',' + b + ')';
            if (ref.current) ref.current.style.backgroundColor = color;
        }, this);
    }
    this.emit('leds-changed', this.ledColors);
}

VirtualSpin.prototype.ledsOn = function (color) {
    for (var i = 0; i < 24; i++) {
        this.ledColors[i] = color;
    }
    this.ledsActive = true;
    this.updateLeds();
};

VirtualSpin.prototype.ledsOff = function () {
    var color = [0, 0, 0];
    for (var i = 0; i < 24; i++) {
        this.ledColors[i] = color;
    }
    this.ledsActive = false;
    this.updateLeds();
};

VirtualSpin.prototype.flashColor = function (color) {
    clearTimeout(this.ledTimeout);
    this.ledsOn(color);
    this.startLedTimer();
};

VirtualSpin.prototype.startLedTimer = function () {
    var me = this;
    this.ledTimeout = setTimeout(function () {
        me.ledsOff();
        me.ledsActive = false;
    }, 2000);
};

VirtualSpin.prototype.rotateLeds = function (direction, color1, color2) {
    clearTimeout(this.ledTimeout);
    this.rotationIndex += direction;
    if (this.rotationIndex > 23) this.rotationIndex = 0;
    else if (this.rotationIndex < 0) this.rotationIndex = 23;

    for (var i = 0; i < 24; i++) {
        this.ledColors[i] = i === this.rotationIndex ? color1 : [0, 0, 0];
    }
    this.updateLeds();
    this.startLedTimer();
};

VirtualSpin.prototype.setAngularVelocity = function (avelocity) {
    Body.setAngularVelocity(this.knob, avelocity);
};

VirtualSpin.prototype.rotate = function (angle) {
    Body.rotate(this.knob, angle);
};

VirtualSpin.prototype.applyTorque = function (torque) {
    this.setTorque(this.knob.torque + torque * this.scale);
};
VirtualSpin.prototype.setTorque = function (torque) {
    if (torque > this.torqueMax) {
        torque = this.torqueMax;
    }
    if (torque < -this.torqueMax) {
        torque = -this.torqueMax;
    }
    this.knob.torque = torque;
};

VirtualSpin.prototype.stop = function () {
    this.leftTorqueAccel = this.torqueStart;
    this.rightTorqueAccel = this.torqueStart;
    this.knob.torque = 0;
    Body.setAngularVelocity(this.knob, 0);
};

VirtualSpin.prototype.startSpinLeft = function () {
    if (this.isSpinningLeft) return;
	this.stop();
    this.isSpinningLeft = true;
    this.leftTorqueAccel = this.torqueStart;
    clearTimeout(this.spinLeftTimer);
    var me = this;
    this.spinLeftTimer = startInterval(function() {
        me.leftTorqueAccel += me.torqueAccel;
        me.applyTorque(-me.leftTorqueAccel);
    }, this.torqueInterval);
}

VirtualSpin.prototype.stopSpinLeft = function () {
    this.isSpinningLeft = false;
    clearTimeout(this.spinLeftTimer);
};

VirtualSpin.prototype.startSpinRight = function () {
	if (this.isSpinningRight) return;
	this.stop();
    this.isSpinningRight = true;
    this.rightTorqueAccel = this.torqueStart;
    clearTimeout(this.spinRightTimer);
    this.spinRightTimer = startInterval((function() {
        this.rightTorqueAccel += this.torqueAccel;
        this.applyTorque(this.rightTorqueAccel);
    }).bind(this), this.torqueInterval);
};

VirtualSpin.prototype.stopSpinRight = function () {
    this.isSpinningRight = false;
    clearTimeout(this.spinRightTimer);
};

VirtualSpin.prototype.getPosition = function () {
    var position = Math.round((this.knob.angle * 32) / (Math.PI * 2));
    return position;
};

VirtualSpin.prototype.setPosition = function (position) {
    var angle = (position / 32) * (Math.PI * 2);
    Body.rotate(this.knob, angle - this.knob.angle);
};

VirtualSpin.prototype.rotateLeft = function () {
    this.stop();
    this.setPosition(this.spinPosition - 1);
};
VirtualSpin.prototype.startRotateLeft = function () {
	this.stopRotateLeft();
    this.rotateLeft();
    var me = this;
    this.rotateDelay = setTimeout(function() {
        me.rotateInterval = setInterval(me.rotateLeft.bind(me),120);
    },500);
};
VirtualSpin.prototype.stopRotateRight = VirtualSpin.prototype.stopRotateLeft = function () {
	clearTimeout(this.rotateDelay);
	clearInterval(this.rotateInterval);
};

VirtualSpin.prototype.rotateRight = function () {
    this.stop();
    this.setPosition(this.spinPosition + 1);
};
VirtualSpin.prototype.startRotateRight = function () {
    this.stopRotateRight();
    this.rotateRight();
    var me = this;
    this.rotateDelay = setTimeout(function() {
        me.rotateInterval = setInterval(me.rotateRight.bind(me),120);
    },500);
};

VirtualSpin.prototype.startSimulation = function () {
    console.log('startSimulation!');

    var me = this;
    this.updateInterval = setInterval(function () {
        me.update();
    }, 10);
}

VirtualSpin.prototype.emit = function () {
    this.events.emit.apply(this, Array.prototype.slice.call(arguments));
}
VirtualSpin.prototype.on = function () {
    this.events.on.apply(this, Array.prototype.slice.call(arguments));
}

VirtualSpin.prototype.update = function () {
    var position = this.getPosition();
    if (this.spinPosition != position) {
        var direction = position - this.spinPosition > 0 ? 1 : -1;
        this.spinPosition = position;
        this.emit('spin', direction, position);
        console.log('emit spin', position);
    }

    var roundedAngle = Math.round(this.knob.angle * 10000) / 10000;

    if (this.angle != roundedAngle) {

        this.angle = roundedAngle;
        this.emit('rotate', this.knob.angle, this);
    }
};

VirtualSpin.prototype.stopSimulation = function () {
    clearInterval(this.updateInterval);
};

VirtualSpin.prototype.pushKnob = function () {
    if (this.knobHeld) return;
    if (this.knobPushed) return;
    this.stop();
    this.knobPushed = true;
    this.emit('knob-pushed');
    this.emit('knob', true);
};
VirtualSpin.prototype.releaseKnob = function () {
    this.stop();
    if (!this.knobPushed) return;
    this.knobPushed = false;
    this.emit('knob-released');
    this.emit('knob', false);
};
VirtualSpin.prototype.pushButton = function () {
    if (this.buttonHeld) return;
    if (this.buttonPushed) return;
    this.buttonPushed = true;
    this.emit('button-pushed');
    this.emit('button', true);
};
VirtualSpin.prototype.releaseButton = function () {
    if (!this.buttonPushed) return;
    this.buttonPushed = false;
    this.emit('button-released');
    this.emit('button', false);
};

VirtualSpin.prototype.toggleHoldKnob = function () {
    this.knobHeld = !this.knobHeld;
    if (this.knobHeld) {
        this.pushKnob();
        console.log('knob-release');
        this.emit('knob-release');
    }
    else {
        this.releaseKnob();
        console.log('knob-hold');
        this.emit('knob-hold');
    }
};

VirtualSpin.prototype.toggleHoldButton = function () {
    this.buttonHeld = !this.buttonHeld;
    if (this.buttonHeld) {
        this.pushButton();
        console.log('button-release');
        this.emit('button-release');
    }
    else {
        this.releaseButton();
        console.log('button-hold');
        this.emit('button-hold');
    }
};

VirtualSpin.World = World;

module.exports = VirtualSpin;