import React, {Component} from 'react';
import VirtualSpin, {} from 'jaxcore-virtualspin';



class VirtualSpinApp extends Component {
	constructor() {
		super();
		
		this.canvasRef = React.createRef();
		this.ledRefs = [];
		for (var i = 0; i < 24; i++) {
			this.ledRefs[i] = React.createRef();
		}
		
		this.state = {
		
		};
	}
	
	componentDidMount() {
		this.engine = VirtualSpin.createWorld(this.canvasRef, 600, 400);
		
		this.virtualspin = new VirtualSpin({
			engine: this.engine,
			canvasRef: this.canvasRef,
			ledRefs: this.ledRefs,
			// width: 400,
			// height: 400
		});
		
		this.virtualspin.on('spin', (direction, position) => {
			console.log('on spin position = ' + position + ' direction = ' + direction + ' angle = ' + this.virtualspin.angle);
			var color;
			if (this.virtualspin.knobPushed) color = [255, 0, 255];
			else if (this.virtualspin.buttonPushed) color = [255, 255];
			else color = [0, 0, 255];
			this.virtualspin.rotateLeds(direction, color);
		});
		
		this.virtualspin.on('knob-pushed', () => {
			console.log('on knob-pushed');
			var color = this.virtualspin.buttonPushed ? [0, 255, 0] : [255, 0, 0];
			this.virtualspin.flashColor(color);
		});
		
		this.virtualspin.on('knob-released', () => {
			console.log('on knob-released');
			this.virtualspin.ledsOff();
		});
		
		this.virtualspin.on('button-pushed', () => {
			console.log('on button-pushed');
			this.virtualspin.ledsOn([0, 0, 255]);
		});
		
		this.virtualspin.on('button-released', () => {
			console.log('on button-released');
			this.virtualspin.ledsOff();
		});
		
		// this.virtualspin.on('print', (data) => {
		// 	console.log('print: ' + data);
		// });
		
		this.virtualspin.startSimulation();
	}
	
	render() {
		return (
			<div>
				<div id="buttons">
					<button onMouseDown={e => this.virtualspin.startSpinLeft()}
							onMouseUp={e => this.virtualspin.stopSpinLeft()}>+&lt;</button>
					<button onMouseDown={e => this.virtualspin.rotateLeft()}>&lt;</button>
					<button onMouseDown={e => this.virtualspin.rotateRight()}>&gt;</button>
					<button onMouseDown={e => this.virtualspin.startSpinRight()}
							onMouseUp={e => this.virtualspin.stopSpinRight()}>&gt;+
					</button>
					<button disabled={this.virtualspin} onMouseDown={e => this.virtualspin.pushKnob()}
							onMouseUp={e => this.virtualspin.releaseKnob()}>Push Knob</button>
					
					<button onMouseDown={e => this.virtualspin.pushButton()}
							onMouseUp={e => this.virtualspin.releaseButton()}>Push Button
					</button>
					<button id="holdknob" onClick={e => this.virtualspin.toggleHoldKnob()}>Hold Knob</button>
					<button id="holdbutton" onClick={e => this.virtualspin.toggleHoldButton()}>Hold Button</button>
					<div id="leds">
						{this.renderLeds()}
					</div>
				</div>
				
				<div id="canvas" ref={this.canvasRef} />
			</div>
		);
	}
	
	renderLeds() {
		let leds = [];
		for (var i = 0; i < 24; i++) {
			leds.push(<div key={i} ref={this.ledRefs[i]} />);
		}
		return leds;
	}
}

export default VirtualSpinApp;
