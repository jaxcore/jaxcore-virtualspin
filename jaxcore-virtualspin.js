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
		
		// if (config.engine) this.engine = config.engine;
		this.engine = config.engine;
		
		this.defaultSize = config.bodySize;
		this.defaultBodySize = config.bodySize || 50;
		this.worldWidth = config.width || 200;
		this.worldHeight = config.height || 200;
		this.worldSize = Math.min(this.worldWidth, this.worldHeight);
		this.drawscale = this.worldSize / this.defaultSize;
		this.x = this.drawscale * (config.x || 100);
		this.y = this.drawscale * (config.y || 100);
		this.size = this.drawscale * (this.defaultBodySize);
		
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
			// updateInterval: (config.updateInterval || 10),
			updateInterval: (config.updateInterval || 20),
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
		// if (this.engine) {
			World.add(this.engine.world, [
				this.knob
			]);
		// }
	}
	
	updateLeds() {
		clearTimeout(this.ledTimeout);
		this._updateLeds();
		this.startLedTimer();
	}
	_updateLeds() {
		console.log('_updateLeds');
		if (this.ledRefs) {
			this.ledRefs.forEach(function (ref, i) {
				let color;
				let r, g, b;
				if (!this.ledColors[i]) {
					r = 0;
					g = 0;
					b = 0;
				}
				else {
					r = this.ledColors[i][0];
					g = this.ledColors[i][1];
					b = this.ledColors[i][2];
				}
				
				if (r === 0 && g === 0 && b === 0) color = 'transparent';
				else color = 'rgb(' + r + ',' + g + ',' + b + ')';
				
				if (ref.current) {
					ref.current.style.backgroundColor = color;
				}
				else {
					console.log('no ref', i);
					// debugger;
				}
			}, this);
			this.emit('leds-changed', this.ledColors);
		}
	}
	
	lightsOn(color) {
		for (let i = 0; i < 24; i++) {
			this.ledColors[i] = color;
		}
		// debugger;
		this.ledsActive = true;
		this.updateLeds();
	};
	
	lightsOff() {
		console.log('lightsOff');
		let color = [0, 0, 0];
		for (let i = 0; i < 24; i++) {
			this.ledColors[i] = color;
		}
		this._updateLeds();
		this.ledsActive = false;
	};
	
	
	startLedTimer() {
		console.log('startLedTimer');
		clearTimeout(this.ledTimeout);
		let me = this;
		this.ledTimeout = setTimeout(function () {
			console.log('startLedTimer timeout');
			me.lightsOff();
			me.ledsActive = false;
		}, 1100);
	};
	
	// led methods
	
	flash(color) {
		
		this.lightsOn(color);
		this.startLedTimer();
	};
	
	rotate(diff, color1, color2) {
		if (diff === 0) return;
		
		
		let lit = [];
		let x = 0;
		let d = diff / Math.abs(diff);
		while (x !== diff) {
			x += d;
			
			let r = this.state.rotationIndex + x;
			r = r % 24;
			if (r<0) {
				lit.push(24 + r);
			}
			else {
				lit.push(r);
			}
		}
		this.state.rotationIndex += diff;
		for (let i = 0; i < 24; i++) {
			this.ledColors[i] = [0,0,0];
		}
		for (let i = 0; i < 24; i++) {
			// this.ledColors[i] = lit.indexOf(i) > -1? color1 : [0, 0, 0];
			
			if (lit.indexOf(i) > -1) {
				this.ledColors[i] = color1;
				if (color2) {
					let x = i + 12;
					// if (x < 0) x += 23;
					if (x > 23) x -= 23;
					this.ledColors[x] = color2;
				}
				break;
			}
		}
		// debugger;
		this.updateLeds();
		
	}
	
	scale(index, color1, color2, color3) {
		// if (percent >= 0 && percent <= 1) {
		// 	let index = Math.floor(percent * 24);s
		for (let i = 0; i < 24; i++) {
			if (i === index) {
				this.ledColors[i] = color3;
			}
			else if (i > index) {
				this.ledColors[i] = [0,0,0];
			}
			else {
				let r = color1[0];
				let g = color1[1];
				let b = color1[2];
				let r2 = color2[0];
				let g2 = color2[1];
				let b2 = color2[2];
				r += i * (r2 - r) / 24;
				g += i * (g2 - g) / 24;
				b += i * (b2 - b) / 24;
				this.ledColors[i] = [r,g,b];
			}
		}
		this.updateLeds();
			// this.startLedTimer();
		// }
	}
	balance() {
		
	}
	
	setAngularVelocity(avelocity) {
		Body.setAngularVelocity(this.knob, avelocity);
	};
	
	rotateKnob(angle) {
		this.startEngine();
		Body.rotate(this.knob, angle);
	};
	
	applyTorque(torque) {
		this.startEngine();
		let t = this.knob.torque + torque * this.drawscale;
		this.setTorque(t);
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
	
	toggleSpinLeft() {
		if (this.isSpinningLeft) this.stopSpinLeft();
		else this.startSpinLeft();
	}
	startSpinLeft() {
		console.log('startSpinLeft');
		if (this.isSpinningLeft) {
			console.log('isSpinningLeft');
			return;
		}
		console.log('stop');
		this.stop();
		this.state.leftTorqueAccel = this.state.torqueStart;
		this.isSpinningLeft = true;
		clearTimeout(this.spinLeftTimer);
		let me = this;
		console.log('startSimulation');
		this.startSimulation();
		this.spinLeftTimer = startInterval(function () {
			me.state.leftTorqueAccel += me.state.torqueAccel;
			me.applyTorque(-me.state.leftTorqueAccel);
		}, this.state.torqueInterval);
	};
	
	stopSpinLeft() {
		this.isSpinningLeft = false;
		clearTimeout(this.spinLeftTimer);
	};
	
	toggleSpinRight() {
		if (this.isSpinningLeft) this.stopSpinRight();
		else this.startSpinRight();
	}
	startSpinRight() {
		console.log('startSpinRight');
		if (this.isSpinningRight) {
			console.log('isSpinningRight');
			return;
		}
		this.stop();
		this.state.rightTorqueAccel = this.state.torqueStart;
		this.isSpinningRight = true;
		clearTimeout(this.spinRightTimer);
		let me = this;
		this.startSimulation();
		this.spinRightTimer = startInterval(function () {
			me.state.rightTorqueAccel += me.state.torqueAccel;
			me.applyTorque(me.state.rightTorqueAccel);
		}, this.state.torqueInterval);
	};
	
	stopSpinRight() {
		this.isSpinningRight = false;
		clearTimeout(this.spinRightTimer);
	};
	
	getPosition() {
		return Math.round((this.knob.angle * 32) / (Math.PI * 2));
	};
	
	setPosition(position) {
		console.log('setPosition', position);
		let angle = (position / 32) * (Math.PI * 2);
		Body.rotate(this.knob, angle - this.knob.angle);
		this.update();
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
		// console.log('update');
		let position = this.getPosition();
		
		// round angle down to 4 decimal places because in matterjs it never actually reaches 0.0
		let roundedAngle = Math.round(this.knob.angle * 100) / 100;
		
		// console.log('update', position, this.knob.angle);
		
		let roundedAngularVelocity = Math.round(this.knob.angularVelocity * 1000) / 1000;
		
		if (this.state.angle !== roundedAngle) {
			// console.log('angle', this.state.angle, roundedAngle);
			
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
				// console.log('position CHANGED', position)
				
				let direction = position - this.state.spinPosition > 0 ? 1 : -1;
				changes.spinPosition = position;
				changes.spinDirection = direction;
				this.emit('spin', direction, position);
			}
			else {
				// console.log('position UNCHANGED', position)
			}
			
			this.setState(changes);
			
			// console.log('rotate', this.state.angle);
			this.emit('rotate', this.state.angle, this);
			
			this.idleTimer = setTimeout(() => {
				this.setState({
					angularVelocity: 0,
					isSpinning: false,
					isSpinningLeft: false,
					isSpinningRight: false,
					angle: roundedAngle
				});
				console.log('stopping Simulation');
				this.stopSimulation();
			}, 1000);
		}
		else {
			// console.log('angle is the same', this.knob.angle, roundedAngle)
		}
	};
	
	stopSimulation() {
		if (this._simulationActive) {
			console.log('stopSimulation');
			this._simulationActive = false;
			clearInterval(this.updateInterval);
			this.emit('idle');
			if (this.engine) this.engine._stop();
		}
	};
	
	toggleKnob() {
		if (this.state.knobPushed) this.releaseKnob();
		else this.pushKnob();
	}
	pushKnob() {
		if (this.state.knobHoldToggle) return;
		if (this.state.knobPushed) return;
		this.stop();
		this.setState({
			knobPushed: true
		});
		console.log('emit knob', true);
		this.emit('knob', true);
		
	};
	
	releaseKnob() {
		this.stop();
		this.setState({
			knobPushed: false,
			knobHoldToggle: false
		});
		console.log('emit knob', false);
		this.emit('knob', false);
	};
	
	toggleButton() {
		if (this.state.knobPushed) this.releaseButton();
		else this.pushButton();
	}
	pushButton() {
		if (this.state.buttonHoldToggle) return;
		if (this.state.buttonPushed) return;
		this.setState({
			buttonPushed: true
		});
		console.log('emit button', true);
		this.emit('button', true);
	};
	
	releaseButton() {
		this.setState({
			buttonPushed: false,
			buttonHoldToggle: false
		});
		console.log('emit button', false);
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
		
		if (this.engine) {
			this.engine._start();
		}
	}
}

VirtualSpin.engine = null;

VirtualSpin.createWorldLogos = function (canvas, worldWidth, worldHeight, logoSize, logos) {
	
	let engine = Engine.create();
	
	engine.world.gravity.y = 0;
	
	engine.Vertices = Vertices;
	engine.Bodies = Bodies;
	
	engine.logoSize = logoSize;
	
	engine._active = true;
	
	
	function render() {
		Engine.update(engine, 16);
		
		if (!canvas) {
			if (engine._active) {
				// if (canvas) {
				window.requestAnimationFrame(render);
				// }
			}
			return;
		}
		
		const ctx = canvas.getContext('2d');
		var bodies = Composite.allBodies(engine.world);
		
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		
		let logoSize = engine.logoSize; //150;  //? ??????
		
		let body, img;
		
		if (logos) {
			for (var i = 0; i < bodies.length; i += 1) {
				body = bodies[i];
				
				ctx.save();
				
				// ctx.translate(body.position.x, body.position.y);
				ctx.translate(worldWidth / 2, worldHeight / 2);
				
				// ctx.scale(2, 1);
				
				ctx.rotate(body.angle);
				
				img = logos[i];
				
				ctx.drawImage(img, -logoSize / 2, -logoSize / 2, logoSize, logoSize);
				
				
				ctx.translate(0, 0);
				
				ctx.restore();
				// ctx.fillStyle = '#FFFFFF';
				// ctx.fillRect(body.position.x, body.position.y, 10, 10);
			}
		}
		
		if (engine._active) {
			// if (canvas) {
				window.requestAnimationFrame(render);
			// }
		}
		else {
			
			console.log('engine._active', engine._active);
		}
	}
	
	let renderInterval;
	
	engine._start = function() {
		if (!engine._active) {
			console.log('ENGINE ACTIVE');
			engine._active = true;
			
			// if (!canvas) {
			// 	renderInterval = setInterval(render, 20);
			// }
			// else
				render();
			
		}
	};
	engine._stop = function() {
		console.log('ENGINE INACTIVE');
		engine._active = false;
		clearInterval(renderInterval);
	};
	engine._render = render;
	
	render();
	// engine._start();
	
	return engine;
};

//
// VirtualSpin.createWorld = function (worldWidth, worldHeight, logoSize) {
// 	let engine = Engine.create();
//
// 	engine.world.gravity.y = 0;
//
// 	engine.Vertices = Vertices;
// 	engine.Bodies = Bodies;
//
// 	let render = Render.create({
// 		// element: canvasRef.getContext? canvasRef : canvasRef.current,
// 		engine: engine,
// 		options: {
// 			width: worldWidth,
// 			height: worldHeight,
// 			showVelocity: true,
// 			wireframes: false, // Draw the shapes as solid colors
// 			background: "#000"
// 		}
// 	});
//
// 	Render.run(render);
//
// 	let runner = Runner.create();
// 	Runner.run(runner, engine);
//
// 	setInterval(function() {
// 		Runner.tick(runner, engine);
// 	},20);
//
// 	Render.lookAt(render, {
// 		min: {x: 0, y: 0},
// 		max: {x: worldWidth, y: worldHeight}
// 	});
//
// 	return engine;
// };

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