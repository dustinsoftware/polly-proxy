const path = require('path');
const NodemonPlugin = require('nodemon-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

const baseConfig = {
	target: 'node',
	externals: [nodeExternals()],
	mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
	},
	node: {
		__dirname: false,
	},
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'dist'),
	},
};

module.exports = [
	{
		...baseConfig,
		entry: {
			'server-start': './src/server-start.ts',
		},
		plugins: [new NodemonPlugin({ nodeArgs: ['--inspect'] })],
	},
	{
		...baseConfig,
		entry: {
			'proxy-worker': './src/proxy-worker.ts',
		},
		output: {
			...baseConfig.output,
			libraryTarget: 'commonjs',
		},
	},
];
