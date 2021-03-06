import React, {Component} from 'react';
import VirtualSpin from 'jaxcore-virtualspin';

class Logo extends Component {
	constructor(props) {
		super(props);
		
		this.canvasRef = React.createRef();
		this.virtualspin = null;
		this.logo = null;
		
		global.logo = this;
	}
	
	componentDidMount() {
		this.loadLogo((logoSVG) => {
			this.createWorld(logoSVG);
		});
	}
	
	loadLogo(callback) {
		var oReq = new XMLHttpRequest();
		oReq.addEventListener("load", function () {
			callback(this.responseText);
		});
		oReq.open("GET", "logo.svg");
		oReq.send();
	}
	
	createColoredLogo(data, color) {
		data = data.replace(/#000000/g, color);
		var img = new Image();
		img.src = 'data:image/svg+xml;base64,' + btoa(data);
		return img;
	}
	
	createWorld(logoSVG) {
		this.logoSVG = logoSVG;
		
		this.logo = this.createColoredLogo(this.logoSVG, '#FFF');
		
		let canvas = this.canvasRef.current;
		let ctx = canvas.getContext('2d');
		// canvas.width = window.innerWidth;
		// canvas.height = window.innerHeight;
		// this.engine = VirtualSpin.createWorldLogos(ctx, window.innerWidth, window.innerHeight, 132, this.logos);
		
		// console.log(logo);
		
		this.engine = VirtualSpin.createWorldLogos(canvas, this.props.width, this.props.height, this.props.logoSize, [this.logo]);
		
		this.virtualspin = this.createVirtualSpin();
		this.virtualspin.startSimulation();
		
		
		this.props.events.on('rotate', (diff) => {
			console.log('r', diff);
			this.virtualspin.applyTorque(diff*0.42812);
		});
	}
	
	createVirtualSpin() {
		let virtualspin = new VirtualSpin({
			engine: this.engine,
			canvasRef: this.canvasRef,
			x: 0,
			y: 0,
			bodySize: 85,
			width: 90,
			height: 90
		});
		
		virtualspin.setEngine(this.engine);
		
		virtualspin.on('spin', (direction, position) => {
			console.log('spin', direction);
		});
		
		virtualspin.on('knob', (pushed) => {
			console.log('knob pushed=' + pushed);
		});
		
		virtualspin.on('button', (pushed) => {
			console.log('button pushed=' + pushed);
		});
		
		virtualspin.on('update', (changes) => {
			console.log('update', changes);
		});
		
		return virtualspin;
	}
	
	render() {
		return (
			<canvas className="virtual-spin-logo" width={this.props.width} height={this.props.height} ref={this.canvasRef}/>
		);
	}
}

export default Logo;
