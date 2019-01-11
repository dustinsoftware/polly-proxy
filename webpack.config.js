const path = require('path');
const NodemonPlugin = require('nodemon-webpack-plugin');

module.exports = {
	entry: './src/server-start.ts',
	target: 'node',
	mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/
			}
		]
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js']
	},
	node: {
		__dirname: true
	},
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist')
	},
	plugins: [new NodemonPlugin({ nodeArgs: ['--inspect'] })]
};
