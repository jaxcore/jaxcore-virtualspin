const path = require('path')

module.exports = function(env) {
	return {
		entry: './jaxcore-virtualspin.js',
		output: {
			filename: 'jaxcore-virtualspin-min.js',
			path: path.resolve(__dirname, 'dist')
		}
	};
};