import stoppable from 'stoppable';
import program from 'commander';
import path from 'path';
import { createExpressInstance } from './server';

program
	.option('-r, --recordingDir <recordingDir>', 'Recording directory', 'recordings')
	.parse(process.argv);

process.on('unhandledRejection', exception => {
	throw exception;
});

const port = 3000;

const expressInstance = stoppable(
	createExpressInstance({
		recordingDirectory: path.resolve(program.recordingDir as string),
	}).listen(port),
);

console.log(
	`Server listening on port ${port}. Recordings saved to ${path.resolve(
		program.recordingDir as string,
	)}. See the docs for how to use: https://github.com/dustinsoftware/polly-proxy`,
);

process.on('SIGTERM', () => {
	console.log('SIGTERM received');
	expressInstance.stop(() => process.exit(0));
});

process.on('SIGINT', () => {
	console.log('SIGINT received');
	expressInstance.stop(() => process.exit(0));
});
