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

    if (!config) config = {};
    this.config = config;

    this.ledColors = [];
    for (var i = 0; i < 24; i++) {
        this.ledColors[i] = [0, 0, 0];
    }
    if (config.ledElms) {
        this.ledElms = config.ledElms;
        this.updateLeds();
    }
    this.rotationIndex = 0;

    this.spinPosition = 0;
    this.buttonPushed = false;
    this.knobPushed = false;

    this.spinLeftTimer = null;
    this.spinRightTimer = null;
    this.torqueStart = config.torqueStart || 0;
    this.leftTorqueAccel = this.torqueStart;
    this.rightTorqueAccel = this.torqueStart;
    this.torqueAccel = config.torqueAccel || Math.PI / 8000;
    this.isSpinningLeft = false;
    this.isSpinningRight = false;
    this.isSlowSpinningLeft = false;
    this.isSlowSpinningRight = false;
    this.torqueMax = config.torqueMax || 100;
    this.torqueInterval = 20;
    this.friction = config.friction || 0.05;

    this.createWorld();
}
VirtualSpin.prototype = {}; //new EventEmitter;
//VirtualSpin.prototype.constructor = EventEmitter;

VirtualSpin.prototype.createWorld = function () {
    if (this.engine) return;

    var engine = this.engine = Engine.create();
    var world = engine.world;

    engine.world.gravity.y = 0;

    this.worldWidth = 200;
    this.worldHeight = 200;

    var render = this.render = Render.create({
        element: this.config.elm,
        engine: engine,
        options: {
            width: this.worldWidth,
            height: this.worldHeight,
            showVelocity: false
        }
    });

    Render.run(render);

    var runner = Runner.create();
    Runner.run(runner, engine);

    this.knob = Bodies.rectangle(100, 100, 50, 50, {
        frictionAir: this.friction
    });

    World.add(world, [
        this.knob
    ]);

    Render.lookAt(render, {
        min: { x: 0, y: 0 },
        max: { x: this.worldWidth, y: this.worldHeight }
    });

    
};

VirtualSpin.prototype.updateLeds = function () {
    var color;
    this.ledElms.forEach(function (elm, i) {
        r = this.ledColors[i][0];
        g = this.ledColors[i][1];
        b = this.ledColors[i][2];
        color = 'rgb(' + r + ',' + g + ',' + b + ')';
        elm.style.backgroundColor = color;
    }, this);
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
    this.setTorque(this.knob.torque + torque);
}
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
    this.stop();
    if (this.knobPushed) return;
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

module.exports = VirtualSpin;