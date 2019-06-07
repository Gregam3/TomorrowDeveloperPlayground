// Transpile all code following this line with babel and use 'env' (aka ES6) preset.
require('babel-polyfill');

require('@babel/register')({
	presets: ['@babel/preset-env'],
	plugins: [
		'@babel/plugin-syntax-dynamic-import'
	]
});

// Import the rest of our application.
module.exports = require('./server.js');
