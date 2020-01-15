// import EventEmitter from 'events';
import Matter from 'matter-js';
import decomp from 'poly-decomp';
window.decomp = decomp;

import {Client, createClientStore} from 'jaxcore';

const virtualSpinStore = createClientStore('VSpin');

const Engine = Matter.Engine,
	Render = Matter.Render,
	Runner = Matter.Runner,
	World = Matter.World,
	Bodies = Matter.Bodies,
	Body = Matter.Body,
	Constraint = Matter.Constraint,
	Composite = Matter.Composite,
	Vertices = Matter.Vertices;

function startInterval(f) {
	f();
	return setInterval(f);
}

let _instances = 1;

class VirtualSpin extends Client {
	constructor(config) {
		super();
		
		this.Body = Body;
		this.config = config;
		
		this.engine = config.engine;
		
		this.defaultSize = config.bodySize;
		this.defaultBodySize = config.bodySize || 50;
		this.worldWidth = config.width || 200;
		this.worldHeight = config.height || 200;
		this.worldSize = Math.min(this.worldWidth, this.worldHeight);
		this.scale = this.worldSize / this.defaultSize;
		this.x = this.scale * (config.x || 100);
		this.y = this.scale * (config.y || 100);
		this.size = this.scale * (this.defaultBodySize);
		
		this.color = config.color || 'white';
		
		this.ledRefs = [];
		this.ledColors = [];
		for (let i = 0; i < 24; i++) {
			this.ledColors[i] = [0, 0, 0];
		}
		
		this.setStore(virtualSpinStore);
		
		this.setState({
			id: 'VirtualSpin' + (_instances++),
			rotationIndex: 0,
			spinPosition: 0,
			buttonPushed: false,
			knobPushed: false,
			knobHoldToggle: false,
			buttonHoldToggle: false,
			isSpinning: false,
			isSpinningLeft: false,
			isSpinningRight: false,
			// isResting: false,
			angularVelocity: 0,
			torqueStart: config.torqueStart || 0,
			leftTorqueAccel: config.torqueStart || 0,
			rightTorqueAccel: config.torqueStart || 0,
			torqueAccel: (config.torqueAccel || Math.PI / 8000),
			torqueMax: (config.torqueMax || 100),
			torqueInterval: (config.torqueMax || 20),
			friction: (config.friction || 0.05),
			updateInterval: (config.updateInterval || 10),
			idleTimeout: 1000
		});
		
		this.spinLeftTimer = null;
		this.spinRightTimer = null;
		this.rotateDelay = null;
		this.rotateInterval = null;
		
		if (config.shape) this.setShape(config.shape);
		else this.createShape();
	}
	
	setLeds(ledRefs) {
		this.ledRefs = ledRefs;
		this.updateLeds();
	};
	
	setStrokeColor(color) {
		this.knob.render.strokeStyle = color.toString();
	};
	
	setFillColor(color) {
		this.knob.render.fillStyle = color.toString();
	};
	
	createShape() {
		
		// ARROW:
		let centerX = 100;
		let centerY = 100;
		let width = 40;
		let height = 50;
		let a = 2 * Math.PI / 3;
		var arrowVertices = [{
			x: centerX,
			y: 0, //centerY - size*Math.cos(0),
		}, {
			x: centerX + width * Math.sin(a),
			y: centerY + height * Math.cos(a) + 30
		}, {
			x: centerX + width * Math.sin(2 * a),
			y: centerY + height * Math.cos(2 * a) + 30
		}];
		var arrow = Matter.Vertices.create(arrowVertices);
		
		let shape = Bodies.fromVertices(this.x, this.y, arrow, {
			// isStatic: true,
			frictionAir: this.state.friction,
			render: {
				fillStyle: 'transparent',
				strokeStyle: this.color,
				lineWidth: 4
			}
		}, true);
		
		this.setShape(shape);
		
	};
	
	setShape(shape) {
		this.knob = shape;
		World.add(this.engine.world, [
			this.knob
		]);
	}
	
	updateLeds() {
		let color;
		if (this.ledRefs) {
			this.ledRefs.forEach(function (ref, i) {
				const r = this.ledColors[i][0];
				const g = this.ledColors[i][1];
				const b = this.ledColors[i][2];
				color = 'rgb(' + r + ',' + g + ',' + b + ')';
				if (ref.current) ref.current.style.backgroundColor = color;
			}, this);
		}
		this.emit('leds-changed', this.ledColors);
	}
	
	ledsOn(color) {
		for (let i = 0; i < 24; i++) {
			this.ledColors[i] = color;
		}
		this.ledsActive = true;
		this.updateLeds();
	};
	
	ledsOff() {
		let color = [0, 0, 0];
		for (let i = 0; i < 24; i++) {
			this.ledColors[i] = color;
		}
		this.ledsActive = false;
		this.updateLeds();
	};
	
	flashColor(color) {
		clearTimeout(this.ledTimeout);
		this.ledsOn(color);
		this.startLedTimer();
	};
	
	startLedTimer() {
		let me = this;
		this.ledTimeout = setTimeout(function () {
			me.ledsOff();
			me.ledsActive = false;
		}, 2000);
	};
	
	rotateLeds(direction, color1, color2) {
		clearTimeout(this.ledTimeout);
		this.state.rotationIndex += direction;
		if (this.state.rotationIndex > 23) this.state.rotationIndex = 0;
		else if (this.state.rotationIndex < 0) this.state.rotationIndex = 23;
		
		for (let i = 0; i < 24; i++) {
			this.ledColors[i] = i === this.state.rotationIndex ? color1 : [0, 0, 0];
		}
		this.updateLeds();
		this.startLedTimer();
	};
	
	setAngularVelocity(avelocity) {
		Body.setAngularVelocity(this.knob, avelocity);
	};
	
	rotate(angle) {
		this.startEngine();
		Body.rotate(this.knob, angle);
	};
	
	applyTorque(torque) {
		this.startEngine();
		this.setTorque(this.knob.torque + torque * this.scale);
	};
	
	setTorque(torque) {
		if (torque > this.state.torqueMax) {
			torque = this.state.torqueMax;
		}
		if (torque < -this.state.torqueMax) {
			torque = -this.state.torqueMax;
		}
		this.knob.torque = torque;
	};
	
	stop() {
		this.state.leftTorqueAccel = this.state.torqueStart;
		this.state.rightTorqueAccel = this.state.torqueStart;
		this.knob.torque = 0;
		Body.setAngularVelocity(this.knob, 0);
	};
	
	spinLeftMax() {
		this.applyTorque(-this.state.torqueMax);
	};
	
	spinRightMax() {
		this.applyTorque(this.state.torqueMax);
	};
	
	startSpinLeft() {
		this.stop();
		this.state.leftTorqueAccel = this.state.torqueStart;
		clearTimeout(this.spinLeftTimer);
		let me = this;
		this.spinLeftTimer = startInterval(function () {
			me.state.leftTorqueAccel += me.state.torqueAccel;
			me.applyTorque(-me.state.leftTorqueAccel);
		}, this.state.torqueInterval);
	};
	
	stopSpinLeft() {
		clearTimeout(this.spinLeftTimer);
	};
	
	startSpinRight() {
		this.stop();
		this.state.rightTorqueAccel = this.state.torqueStart;
		clearTimeout(this.spinRightTimer);
		let me = this;
		this.spinRightTimer = startInterval(function () {
			me.state.rightTorqueAccel += me.state.torqueAccel;
			me.applyTorque(me.state.rightTorqueAccel);
		}, this.state.torqueInterval);
	};
	
	stopSpinRight() {
		clearTimeout(this.spinRightTimer);
	};
	
	getPosition() {
		return Math.round((this.knob.angle * 32) / (Math.PI * 2));
	};
	
	setPosition(position) {
		console.log('setPosition', position);
		let angle = (position / 32) * (Math.PI * 2);
		Body.rotate(this.knob, angle - this.knob.angle);
	};
	
	rotateLeft() {
		this.startEngine();
		Body.rotate(this.knob, -Math.PI / 16);
	};
	
	startRotateLeft() {
		this.stopRotate();
		this.rotateLeft();
		let me = this;
		this.rotateDelay = setTimeout(function () {
			me.rotateInterval = setInterval(me.rotateLeft.bind(me), 120);
		}, 500);
	};
	
	stopRotate() {
		clearTimeout(this.rotateDelay);
		clearInterval(this.rotateInterval);
	}
	
	rotateRight() {
		this.startEngine();
		Body.rotate(this.knob, Math.PI / 16);
	};
	
	startRotateRight() {
		this.stopRotate();
		this.rotateRight();
		let me = this;
		this.rotateDelay = setTimeout(function () {
			me.rotateInterval = setInterval(me.rotateRight.bind(me), 120);
		}, 500);
	};
	
	startSimulation() {
		clearTimeout(this.idleTimer);
		if (!this._simulationActive) {
			console.log('startSimulation');
			this._simulationActive = true;
			this.updateInterval = setInterval(this.update.bind(this), this.state.updateInterval);
		}
	}
	
	update() {
		let position = this.getPosition();
		
		// round angle down to 4 decimal places because in matterjs it never actually reaches 0.0
		let roundedAngle = Math.round(this.knob.angle * 100) / 100;
		
		let roundedAngularVelocity = Math.round(this.knob.angularVelocity * 1000) / 1000;
		if (this.state.angle !== roundedAngle) {
			clearTimeout(this.idleTimer);
			
			let changes = {
				angularVelocity: roundedAngularVelocity,
				isSpinning: true,
				isSpinningLeft: this.state.angularVelocity < 0,
				isSpinningRight: this.state.angularVelocity > 0,
				// isResting: !this.state.isSpinning,
				angle: roundedAngle
			};
			
			if (this.state.spinPosition !== position) {
				let direction = position - this.state.spinPosition > 0 ? 1 : -1;
				changes.spinPosition = position;
				changes.spinDirection = direction;
				this.emit('spin', direction, position);
			}
			
			this.setState(changes);
			
			//this.emit('rotate', this.state.angle, this);
			
			this.idleTimer = setTimeout(() => {
				this.setState({
					angularVelocity: 0,
					isSpinning: false,
					isSpinningLeft: false,
					isSpinningRight: false,
					angle: roundedAngle
				});
				this.stopSimulation();
			}, 1000);
		}
		
	};
	
	stopSimulation() {
		if (this._simulationActive) {
			this._simulationActive = false;
			clearInterval(this.updateInterval);
			this.emit('idle');
			this.engine._stop();
		}
	};
	
	pushKnob() {
		if (this.state.knobHoldToggle) return;
		if (this.state.knobPushed) return;
		this.stop();
		this.setState({
			knobPushed: true
		});
		this.emit('knob', true);
		
	};
	
	releaseKnob() {
		this.stop();
		this.setState({
			knobPushed: false,
			knobHoldToggle: false
		});
		this.emit('knob', false);
	};
	
	pushButton() {
		if (this.state.buttonHoldToggle) return;
		if (this.state.buttonPushed) return;
		this.setState({
			buttonPushed: true
		});
		this.emit('button', true);
	};
	
	releaseButton() {
		this.setState({
			buttonPushed: false,
			buttonHoldToggle: false
		});
		this.emit('button', false);
	}
	
	toggleHoldKnob() {
		console.log('toggleHoldKnob');
		this.setState({knobHoldToggle: !this.state.knobHoldToggle});
		if (this.state.knobHoldToggle) {
			this.pushKnob();
		} else {
			this.releaseKnob();
		}
	}
	
	toggleHoldButton() {
		console.log('toggleHoldButton');
		this.setState({buttonHoldToggle: !this.state.buttonHoldToggle});
		if (this.state.buttonHoldToggle) {
			this.pushButton();
		} else {
			this.releaseButton();
		}
	}
	
	setEngine(engine) {
		this.engine = engine;
	}
	startEngine() {
		this.startSimulation();
		
		if (this.engine) this.engine._start();
	}
}

VirtualSpin.engine = null;

VirtualSpin.createWorldLogos = function (canvas, worldWidth, worldHeight, logoSize, logos) {
	const ctx = canvas.getContext('2d');
	let engine = Engine.create();
	
	engine.world.gravity.y = 0;
	
	engine.Vertices = Vertices;
	engine.Bodies = Bodies;
	
	engine.logoSize = logoSize;
	
	engine._active = true;
	
	function render() {
		console.log('render');
		Engine.update(engine, 16);
		
		var bodies = Composite.allBodies(engine.world);
		
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		
		let logoSize = engine.logoSize; //150;  //? ??????
		
		let body, img;
		for (var i = 0; i < bodies.length; i += 1) {
			body = bodies[i];
			
			ctx.save();
			
			// ctx.translate(body.position.x, body.position.y);
			ctx.translate(worldWidth/2, worldHeight/2);
			
			// ctx.scale(2, 1);
			
			ctx.rotate(body.angle);
			
			img = logos[i];
			
			ctx.drawImage(img, -logoSize/2, -logoSize/2, logoSize, logoSize);
			
			ctx.translate(0, 0);
			
			ctx.restore();
			// ctx.fillStyle = '#FFFFFF';
			// ctx.fillRect(body.position.x, body.position.y, 10, 10);
		}
		
		if (engine._active) {
			window.requestAnimationFrame(render);
		}
	}
	
	engine._start = function() {
		if (!engine._active) {
			engine._active = true;
			render();
		}
	};
	engine._stop = function() {
		engine._active = false;
	};
	engine._render = render;
	render();
	
	return engine;
};

// VirtualSpin.createWorld = function (canvasRef, worldWidth, worldHeight) {
	// let engine = Engine.create();
	//
	// engine.world.gravity.y = 0;
	//
	// engine.Vertices = Vertices;
	// engine.Bodies = Bodies;
	//
	// let render = Render.create({
	// 	element: canvasRef.getContext? canvasRef : canvasRef.current,
	// 	engine: engine,
	// 	options: {
	// 		width: worldWidth,
	// 		height: worldHeight,
	// 		showVelocity: true,
	// 		wireframes: false, // Draw the shapes as solid colors
	// 		background: "#000"
	// 	}
	// });
	//
	// Render.run(render);
	
	// let runner = Runner.create();
	// Runner.run(runner, engine);
	// setInterval(function() {
		// Runner.tick(this.runner, this.engine, this.interval);
	// },20);
	//
	// Render.lookAt(render, {
	// 	min: {x: 0, y: 0},
	// 	max: {x: worldWidth, y: worldHeight}
	// });
	//
	// return engine;
// };

global.VirtualSpin = VirtualSpin;

export default VirtualSpin;