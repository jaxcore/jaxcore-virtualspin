// import EventEmitter from 'events';
import decomp from 'poly-decomp';
global.decomp = decomp;
import Matter from 'matter-js';
// import plugin from 'jaxcore-plugin';

import Jaxcore, { CollectionModel, createStore} from 'jaxcore-client';

// import ES6Client from './ES6Client';

// const ES6Client = plugin.ES6Client;

const virtualSpinStore = createStore('VSpin');

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

class VirtualSpin extends CollectionModel {
	constructor(config) {
		super();
		
		this.Body = Body;
		this.config = config;
		// /this.canvasRef = config.canvasRef;
		
		this.engine = config.engine;
		
		this.defaultSize = 200;
		this.defaultBodySize = 50;
		this.worldWidth = config.width || 200;
		this.worldHeight = config.height || 200;
		this.worldSize = Math.min(this.worldWidth, this.worldHeight);
		this.scale = this.worldSize / this.defaultSize;
		this.x = this.scale * (config.x || 100);
		this.y = this.scale * (config.y || 100);
		this.size = this.scale * (this.defaultBodySize);
		
		this.color = config.color || 'white';
		
		//this.shape = config.shape || 'rectangle'
		
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
			isResting: false,
			angularVelocity: 0,
			torqueStart: config.torqueStart || 0,
			leftTorqueAccel: config.torqueStart || 0,
			rightTorqueAccel: config.torqueStart || 0,
			torqueAccel: (config.torqueAccel || Math.PI / 8000),
			torqueMax: (config.torqueMax || 100),
			torqueInterval: (config.torqueMax || 20),
			friction: (config.friction || 0.05),
			updateInterval: (config.updateInterval || 10),
			idleTimeout: 400
		});
		
		this.spinLeftTimer = null;
		this.spinRightTimer = null;
		this.rotateDelay = null;
		this.rotateInterval = null;
		
		if (config.shape) this.setShape(config.shape);
		else this.createShape();
		
		this.rotateLeftCount = 0;
		this.rotateRightCount = 0;
	}
	
	setLeds(ledRefs) {
		this.ledRefs = ledRefs;
		this.updateLeds();
	};
	
	setStrokeColor(color) {
		// debugger;
		// this.color = color;
		this.knob.render.strokeStyle = color.toString();
	};
	
	setFillColor(color) {
		// this.color = color;
		this.knob.render.fillStyle = color.toString();
	};
	
	createShape() {
		
		// STAR:
		// var starVertices = [{
		//     x : 50,
		//     y : 0
		// },{
		//     x : 63,
		//     y : 38
		// },{
		//     x : 100,
		//     y : 38
		// },{
		//     x : 69,
		//     y : 59
		// },{
		//     x : 82 ,
		//     y : 100
		// },{
		//     x : 50,
		//     y : 75
		// },{
		//     x : 18,
		//     y : 100
		// },{
		//     x : 31,
		//     y : 59
		// },{
		//     x : 0,
		//     y : 38
		// },{
		//     x : 37,
		//     y : 38
		// }];
		// var star = Matter.Vertices.create(starVertices);
		
		
		// SQUARE:
		// var squareVertices = [{
		//     x : 100,
		//     y : 50
		// },{
		//     x : 150,
		//     y : 50
		// },{
		//     x : 150,
		//     y : 150
		// },{
		//     x : 50,
		//     y : 150
		// }];
		
		
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
		
		// let centerX = 100;
		// let centerY = 100;
		// let size = 50;
		// let a = 2*Math.PI / 3;
		// var arrowVertices = [{
		//     x : centerX,
		//     y : 0, //centerY - size*Math.cos(0),
		// },{
		//     x : centerX + size*Math.sin(a),
		//     y : centerY + size*Math.cos(a) + 20
		// },{
		//     x: centerX,
		//     y: centerY - 20,
		// },{
		//     x : centerX + size*Math.sin(2*a),
		//     y : centerY + size*Math.cos(2*a) + 20
		// }];
		// var arrow = Matter.Vertices.create(arrowVertices);
		
		let shape = Bodies.fromVertices(this.x, this.y, arrow, {
			// isStatic: true,
			frictionAir: this.state.friction,
			render: {
				fillStyle: 'transparent',
				strokeStyle: this.color,
				lineWidth: 4
			}
		}, true);
		
		// triangle
		// let shape = 'polygon';
		// this.knob = Bodies[shape](this.x, this.y, 3, this.size, {
		//     frictionAir: this.state.friction,
		//     render: {
		//         fillStyle: 'transparent',
		//         strokeStyle: this.color,
		//         lineWidth: 4
		//     }
		//     // restitution: 0.1,
		//     //background: "#F00"
		// });
		
		// this.knob = Bodies.rectangle(100, 100, 50, 50, {
		//     frictionAir: this.state.friction,
		//     // background: "#F00"
		//     background: "red",
		//     wireframeBackground: 'red'
		// });
		
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
		Body.rotate(this.knob, angle);
	};
	
	applyTorque(torque) {
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
		// if (this.state.isSpinningLeft) return;
		this.stop();
		// this.state.isSpinningLeft = true;
		this.state.leftTorqueAccel = this.state.torqueStart;
		clearTimeout(this.spinLeftTimer);
		let me = this;
		this.spinLeftTimer = startInterval(function () {
			me.state.leftTorqueAccel += me.state.torqueAccel;
			me.applyTorque(-me.state.leftTorqueAccel);
		}, this.state.torqueInterval);
	};
	
	stopSpinLeft() {
		// this.state.isSpinningLeft = false;
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
		this.rotateLeftCount++;
		
		// this.stop();
		// this.setPosition(this.state.spinPosition - 1);
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
		// this.rotateRightCount++;
		// // this.stop();
		// console.log('rotateRight', this.rotateRightCount);;
		// this.setPosition(this.state.spinPosition + 1);
		
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
		this.updateInterval = setInterval(this.update.bind(this), this.state.updateInterval);
	}
	
	update() {
		let position = this.getPosition();
		
		let changes = {};
		
		// round angle down to 4 decimal places because in matterjs it never actually reaches 0.0
		let roundedAngle = Math.round(this.knob.angle * 100) / 100;
		let roundedAngularVelocity = Math.round(this.knob.angularVelocity * 1000) / 1000;
		if (this.state.angle !== roundedAngle) {
			clearTimeout(this.idleTimer);
			
			let changes = {
				angularVelocity: roundedAngularVelocity,
				isSpinning: true, //this.state.angularVelocity !== 0,
				isSpinningLeft: this.state.angularVelocity < 0,
				isSpinningRight: this.state.angularVelocity > 0,
				isResting: !this.state.isSpinning,
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
					isResting: true,
					angle: roundedAngle
				});
			}, this.state.idleTimeout);
		}
		
	};
	
	stopSimulation() {
		clearInterval(this.updateInterval);
	};
	
	pushKnob() {
		if (this.state.knobHoldToggle) return;
		if (this.state.knobPushed) return;
		this.stop();
		this.setState({
			knobPushed: true
		});
		// this.emit('knob-pushed');
		this.emit('knob', true);
		
	};
	
	releaseKnob() {
		this.stop();
		// if (!this.state.knobPushed) return;
		// this.state.knobPushed = false;
		this.setState({
			knobPushed: false,
			knobHoldToggle: false
		});
		// this.emit('knob-released');
		this.emit('knob', false);
	};
	
	pushButton() {
		if (this.state.buttonHoldToggle) return;
		if (this.state.buttonPushed) return;
		// this.state.buttonPushed = true;
		this.setState({
			buttonPushed: true
		});
		// this.emit('button-pushed');
		this.emit('button', true);
	};
	
	releaseButton() {
		// if (this.state.buttonHoldToggle)
		// if (!this.state.buttonPushed) return;
		// this.state.buttonPushed = false;
		
		this.setState({
			buttonPushed: false,
			buttonHoldToggle: false
		});
		// this.emit('button-released');
		this.emit('button', false);
	};
	
	toggleHoldKnob() {
		console.log('toggleHoldKnob');
		this.setState({knobHoldToggle: !this.state.knobHoldToggle});
		if (this.state.knobHoldToggle) {
			this.pushKnob();
			// console.log('knob-release');
			// this.emit('knob-release');
		} else {
			this.releaseKnob();
			// console.log('knob-hold');
			// this.emit('knob-hold');
		}
	};
	
	toggleHoldButton() {
		console.log('toggleHoldButton');
		this.setState({buttonHoldToggle: !this.state.buttonHoldToggle});
		if (this.state.buttonHoldToggle) {
			this.pushButton();
			// console.log('button-hold');
			// this.emit('button-hold');
		} else {
			this.releaseButton();
			// console.log('button-release');
			// this.emit('button-release');
		}
	};
}

VirtualSpin.engine = null;

VirtualSpin.createWorld = function (canvasRef, worldWidth, worldHeight) {
	let engine = Engine.create();
	
	engine.world.gravity.y = 0;
	
	engine.Vertices = Vertices;
	engine.Bodies = Bodies;
	
	let render = Render.create({
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
	
	let runner = Runner.create();
	Runner.run(runner, engine);
	
	Render.lookAt(render, {
		min: {x: 0, y: 0},
		max: {x: worldWidth, y: worldHeight}
	});
	
	return engine;
};

export default VirtualSpin;