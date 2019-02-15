import React, {Component} from 'react';
import VirtualSpin, {} from 'jaxcore-virtualspin';

// import Color from 'jaxcore-color';
import Color from './Color';
global.Color = Color;

class VirtualSpinApp extends Component {
	constructor() {
		super();
		
		this.canvasRef = React.createRef();
		
		this.virtualspins = [];
		
		this.state = {
			numberSpins: 2
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
		
		this.forceUpdate();
	}
	
	updateColors() {
		let startColor = new Color(255,0,0);
		let spincolors = [];
		let h;
		for (let s = 0; s < this.state.numberSpins; s++) {
			if (s===0) {
				spincolors[s] = startColor;
			}
			else {
				h = 1 / this.state.numberSpins;
				spincolors[s] = spincolors[s-1].shiftHue(h);
			}
			
			this.virtualspins[s].setColor(spincolors[s]);
			
			// for button flash
			this.virtualspins[s].inverseColor = spincolors[s].invert();
		}
		
		//this.spincolors = spincolors;
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
		
		for (let i = 0; i < 24; i++) {
			virtualspin.ledRefs[i] = React.createRef();
		}
		
		virtualspin.setLeds(virtualspin.ledRefs);
		
		// let inverseColor = this.spininversecolors[s];
		virtualspin.on('spin', (direction, position) => {
			console.log('on spin position = ' + position + ' direction = ' + direction + ' angle = ' + virtualspin.angle);
			var color;
			if (virtualspin.knobPushed) color = virtualspin.color; //[255, 0, 255];
			else if (virtualspin.buttonPushed) color = virtualspin.inverseColor; ///[255, 255];
			else color = virtualspin.color; //virtualspin.color; //[0, 0, 255];
			
			virtualspin.rotateLeds(direction, color.getRGB());
		});
		
		virtualspin.on('knob-pushed', () => {
			console.log('on knob-pushed');
			var color = virtualspin.buttonPushed ? [0, 255, 0] : [255, 0, 0];
			virtualspin.flashColor(color);
		});
		
		virtualspin.on('knob-released', () => {
			console.log('on knob-released');
			virtualspin.ledsOff();
		});
		
		virtualspin.on('button-pushed', () => {
			console.log('on button-pushed');
			virtualspin.ledsOn([0, 0, 255]);
		});
		
		virtualspin.on('button-released', () => {
			console.log('on button-released');
			virtualspin.ledsOff();
		});
		
		// virtualspin.on('print', (data) => {
		// 	console.log('print: ' + data);
		// });
		
		this.virtualspins[s] = virtualspin;
		
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
			r.push((
				<div key={s} className="buttons">
					{s+1}:
					<button onMouseDown={e => this.virtualspins[s].startSpinLeft()}
							onMouseUp={e => this.virtualspins[s].stopSpinLeft()}>+&lt;</button>
					<button onMouseDown={e => this.virtualspins[s].rotateLeft()}>&lt;</button>
					<button onMouseDown={e => this.virtualspins[s].rotateRight()}>&gt;</button>
					<button onMouseDown={e => this.virtualspins[s].startSpinRight()}
							onMouseUp={e => this.virtualspins[s].stopSpinRight()}>&gt;+
					</button>
					<button disabled={this.virtualspins[s]} onMouseDown={e => this.virtualspins[s].pushKnob()}
							onMouseUp={e => this.virtualspins[s].releaseKnob()}>Push Knob
					</button>
					
					<button onMouseDown={e => this.virtualspins[s].pushButton()}
							onMouseUp={e => this.virtualspins[s].releaseButton()}>Push Button
					</button>
					<button id="holdknob" onClick={e => this.virtualspins[s].toggleHoldKnob()}>Hold Knob</button>
					<button id="holdbutton" onClick={e => this.virtualspins[s].toggleHoldButton()}>Hold Button</button>
					<div id="leds">
						{this.renderLeds(s)}
					</div>
				</div>
			));
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
