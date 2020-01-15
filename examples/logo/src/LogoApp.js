import React, {Component} from 'react';
import Logo from './Logo';
import EventEmitter from 'events';

class LogoApp extends Component {
	constructor() {
		super();
		
		this.state = {
		};
		
		this.events = new EventEmitter();
		
		global.app = this;
	}
	
	render() {
		return (
			<div>
				{this.renderControlPanel()}
				
				<Logo events={this.events} width={100} height={100} logoSize={89}/>
			</div>
		);
	}
	
	renderControlPanel() {
		return (
			<div className="buttons">
				<button onClick={e => this.rotate(-1)}>&lt;</button>
				<button onClick={e => this.rotate(32*1)}>&gt;</button>
			</div>
		);
	}
	
	rotate(n) {
		this.events.emit('rotate', n);
	}
	
}

export default LogoApp;
