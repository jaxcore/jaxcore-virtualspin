import EventEmitter from 'events';

class ES6Client extends EventEmitter {
	setStore(store, singleton) {
		if (singleton) {
			this.store = null;
			this.state = store;
		}
		else {
			this.store = store;
		}
	}
	
	setState(data) {
		if (typeof arguments[0] === 'string') {
			var type = arguments[0];
			data = arguments[1];
			var d = Object.assign({}, this.state[type]);
			this.state[type] = d;
			
			var changes = {};
			changes[type] = {};
			for (var name in data) {
				if (d[name] !== data[name]) {
					d[name] = data[name];
					changes[type][name] = data[name];
				}
			}
			return changes;
		}
		else {
			if (this.store) {
				var id = this.state ? this.state.id : data.id;
				var changes = this.store.set(id, data);
				this.state = this.store[id];
				return changes;
			}
			else {
				return this._setState(data);
			}
		}
	}
	
	_setState(data) {
		const changes = {};
		let hasChanges = false;
		const s = this.state;
		for (let i in data) {
			if (typeof data[i] === 'object' || s[i] !== data[i]) {
				hasChanges = true;
				changes[i] = data[i];
				this.state[i] = data[i];
			}
		}
		if (hasChanges) {
			//this.state = Object.assign({}, this.state, changes);
			//console.log('emit update', changes);
			this.emit('update', this.state, changes);
			return changes;
		}
		else {
			//if (callback) callback();
			return null;
		}
	}
	
	getState() {
		return (this.state.id in this.store) ? this.store[this.state.id] : {};
	}
}

export default ES6Client;