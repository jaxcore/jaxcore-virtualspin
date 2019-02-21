import React, {Component} from 'react';
import Jaxcore from 'jaxcore-client';
import VirtualSpin, {} from 'jaxcore-virtualspin';

// import Color from 'jaxcore-color';
import Color from './Color';
global.Color = Color;

class VirtualSpinApp extends Component {
	constructor() {
		super();
		
		this.canvasRef = React.createRef();
		
		this.virtualspins = [];
		this.realspins = {};
		
		this.state = {
			connectedExtension: false,
			numberSpins: 1,
			virtualSpinStates: {},
			realSpinStates: {},
			spinMappings: []
		};
		
		global.app = this;
	}
	
	componentWillMount() {
	
	}
	
	componentDidMount() {
		this.engine = VirtualSpin.createWorld(this.canvasRef, window.innerWidth, window.innerHeight);
		
		for (let s = 0; s < this.state.numberSpins; s++) {
			this.createVirtualSpin(s);
		}
		
		this.updateColors();
		
		// this.forceUpdate();
		
		// let jx = Jaxcore;
		
		
		Jaxcore.subscribe((jaxcoreState) => {
			const {state} = this;
			state.connectedExtension = jaxcoreState.connectedExtension;
			this.setState(state);
		});
		
		Jaxcore.connectSpins(spin => {
			console.log('spin connected', spin);
			
			if (this.realspins[spin.id]) {
				console.log('destroy', spin);
				debugger;
				this.realspins[spin.id].destroy();
			}
			
			this.realspins[spin.id] = spin;
			
			if (this.state.spinMappings.indexOf(spin.id) > -1) {
				console.log('already in');
				debugger;
				return;
			}
			
			let vspinIndex = this.state.spinMappings.length;
			
			// this.state.spinMappings[vspinIndex] = spin.id;
			let spinMappings = this.state.spinMappings;
			spinMappings[vspinIndex] = spin.id;
			this.setState({
				spinMappings
			});
			
			this.spinCount = 0;
			
			spin.on('spin', (direction) => {
				// debugger;
				
				this.spinCount += direction;
				
				console.log('spin', direction, this.spinCount, spin.state.spinPosition);
				//console.log('spin', direction, spin.state.spinPosition);
				
				this.virtualspins[vspinIndex].stop();
				if (direction === -1) this.virtualspins[vspinIndex].rotateLeft();
				else this.virtualspins[vspinIndex].rotateRight();
			});
			spin.on('button', (pushed) => {
				console.log('x button', pushed);
				
				if (pushed) this.virtualspins[vspinIndex].pushButton();
				else this.virtualspins[vspinIndex].releaseButton();
			});
			spin.on('knob', (pushed) => {
				console.log('knob', pushed);
				
				if (pushed) this.virtualspins[vspinIndex].pushKnob();
				else this.virtualspins[vspinIndex].releaseKnob();
			});
			
			// spin.on('update', (pushed) => {
			// 	console.log('vs spin update', pushed);
			// });
			
		});
	}
	
	
	updateColors() {
		let startColor = new Color(255,0,0);
		let spincolors = [];
		let h, color, inverseColor;
		// if (this.state.numberSpins === 1) {
		// 	spincolors[0] = new Color(255,255,255);
		// 	this.virtualspins[0].setColor(spincolors[0]);
		// }
		// else {
			for (let s = 0; s < this.state.numberSpins; s++) {
				if (this.state.numberSpins === 1) {
					color = new Color(255,255,255);
					inverseColor = new Color(255,0,0);
				}
				else if (s===0) {
					color = startColor;
					inverseColor = startColor.invert();
				}
				else {
					h = 1 / this.state.numberSpins;
					// spincolors[s] = spincolors[s-1].shiftHue(h);
					color = this.virtualspins[s-1].color.shiftHue(h);
					inverseColor = color.invert();
					
				}
				
				this.virtualspins[s].color = color; //spincolors[s];
				this.virtualspins[s].inverseColor = inverseColor; //spincolors[s].invert();
				
				this.virtualspins[s].setStrokeColor(color);
				//this.virtualspins[s].inverseColor = spincolors[s].invert();
			}
		// }
	}
	
	createVirtualSpin(s) {
		if (this.virtualspins[s]) return;
		
		//this.state.numberSpins
		let numColumns = Math.floor(window.innerWidth / 200);
		
		let column = s<numColumns? s : s % numColumns; //; //row<1? s : s % row;
		let row = Math.floor(s / numColumns); //Math.ceil(s / numColumns);
		
		let size = 200;
		
		let x = size*column + size/2;
		let y = size*row + size/2;
		
		console.log('spin', s, 'col='+column, 'row='+row, 'x='+x, 'y='+y);
		let virtualspin = new VirtualSpin({
			engine: this.engine,
			canvasRef: this.canvasRef,
			x,
			y
			// ledRefs: this.ledRefs[s],
			// width: 400,
			// height: 400
		});
		
		this.virtualspins[s] = virtualspin;
		
		let _s = s;
		
		const virtualSpinStates = this.state.virtualSpinStates;
		virtualSpinStates[_s] = virtualspin.state;
		this.setState({
			virtualSpinStates
		});
		
		for (let i = 0; i < 24; i++) {
			virtualspin.ledRefs[i] = React.createRef();
		}
		
		virtualspin.setLeds(virtualspin.ledRefs);
		
		// let inverseColor = this.spininversecolors[s];
		virtualspin.on('spin', (direction, position) => {
			//console.log('on spin position = ' + position + ' direction = ' + direction + ' angle = ' + virtualspin.angle);
			// var color;
			// if (virtualspin.knobPushed) color = virtualspin.color; //[255, 0, 255];
			// else if (virtualspin.buttonPushed) color = virtualspin.inverseColor; ///[255, 255];
			// else color = virtualspin.color; //virtualspin.color; //[0, 0, 255];
			
			virtualspin.rotateLeds(direction, virtualspin.color.getRGB());
		});
		
		virtualspin.on('knob', (pushed) => {
			console.log('knob pushed='+pushed);
			if (pushed) virtualspin.ledsOn(virtualspin.color.getRGB());
			else virtualspin.ledsOff();
		});
		
		virtualspin.on('button', (pushed) => {
			console.log('button pushed='+pushed);
			if (pushed) virtualspin.ledsOn(virtualspin.inverseColor.getRGB());
			else virtualspin.ledsOff();
		});
		
		
		virtualspin.on('update', (changes) => {
			// console.log('update', changes);
			
			const virtualSpinStates = this.state.virtualSpinStates;
			virtualSpinStates[_s] = virtualspin.state;
			this.setState({
				virtualSpinStates
			});
		});
		
		virtualspin.startSimulation();
		
		
		return virtualspin;
	}
	
	componentDidUpdate() {

	}
	
	render() {
		return (
			<div>
				<button onClick={e=>this.addVirtualSpin()}>Add</button>
				
				{this.renderControlPanels()}
				
				<div id="canvas" ref={this.canvasRef} />
			</div>
		);
	}
	
	renderControlPanels() {
		if (!this.state.numberSpins) return;
		let r = [];
		for (let s = 0; s < this.state.numberSpins; s++) {
			if (this.virtualspins[s]) {
				r.push((
					<div key={s} className="buttons">
						{s + 1}:
						<button onMouseDown={e => this.virtualspins[s].spinLeftMax()}>&lt;&lt;</button>
						<button onMouseDown={e => this.virtualspins[s].startSpinLeft()}
								onMouseUp={e => this.virtualspins[s].stopSpinLeft()}>+&lt;</button>
						<button onMouseDown={e => this.virtualspins[s].rotateLeft()}>&lt;</button>
						<button onMouseDown={e => this.virtualspins[s].rotateRight()}>&gt;</button>
						<button onMouseDown={e => this.virtualspins[s].startSpinRight()}
								onMouseUp={e => this.virtualspins[s].stopSpinRight()}>&gt;+
						</button>
						<button onMouseDown={e => this.virtualspins[s].spinRightMax()}>&gt;&gt;</button>
						
						<button disabled={this.state.virtualSpinStates[s].knobHoldToggle}
								onMouseDown={e => this.virtualspins[s].pushKnob()}
								onMouseUp={e => this.virtualspins[s].releaseKnob()}>
							Knob
						</button>
						
						<button disabled={this.state.virtualSpinStates[s].buttonHoldToggle}
								onMouseDown={e => this.virtualspins[s].pushButton()}
								onMouseUp={e => this.virtualspins[s].releaseButton()}>
							Button
						</button>
						<button id="holdknob" onClick={e => this.virtualspins[s].toggleHoldKnob()}>
							{this.state.virtualSpinStates[s].knobHoldToggle? 'Release':'Hold'} Knob
						</button>
						<button id="holdbutton" onClick={e => this.virtualspins[s].toggleHoldButton()}>
							{this.state.virtualSpinStates[s].buttonHoldToggle? 'Release':'Hold'} Button
						</button>
						<div id="leds">
							{this.renderLeds(s)}
						</div>
					</div>
				));
			}
		}
		return r;
	}
	
	addVirtualSpin() {
		let numberSpins = this.state.numberSpins+1;
		for (let s = 0; s < numberSpins; s++) {
			this.createVirtualSpin(s);
		}
		
		this.setState({
			numberSpins
		}, () => {
			this.updateColors();
		});
	}
	
	renderLeds(s) {
		let leds = [];
		for (var i = 0; i < 24; i++) {
			if (this.virtualspins[s]) {
				leds.push(<div key={s+'_'+i} ref={this.virtualspins[s].ledRefs[i]}/>);
			}
		}
		return leds;
	}
}

export default VirtualSpinApp;
