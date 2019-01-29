import stoppable from 'stoppable';
import program from 'commander';
import path from 'path';
import { createExpressInstance, ServerOptions } from './server';

program
	.option('-r, --recordingDir <recordingDir>', 'Recording directory', 'recordings')
	.option(
		'-h, --hostRewrite <hostRewrite>',
		'Rewrite the request host, comma separated. Eg source,target',
	)
	.parse(process.argv);

process.on('unhandledRejection', exception => {
	throw exception;
});

const port = 3000;

const serverOptions: ServerOptions = {
	recordingDirectory: path.resolve(program.recordingDir as string),
	hostRewrite: program.hostRewrite as string,
	handleStop,
};

const expressInstance = stoppable(createExpressInstance(serverOptions).listen(port));

console.log(
	`Server listening on port ${port}. Recordings saved to ${
		serverOptions.recordingDirectory
	}. See the docs for how to use: https://github.com/dustinsoftware/polly-proxy`,
);

function handleStop() {
	console.log('Stop request received.');
	expressInstance.stop(() => process.exit(0));
}

process.on('SIGTERM', () => {
	console.log('SIGTERM received');
	expressInstance.stop(() => process.exit(0));
});

process.on('SIGINT', () => {
	console.log('SIGINT received');
	expressInstance.stop(() => process.exit(0));
});
