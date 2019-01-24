import { createExpressInstance } from './server';
import stoppable from 'stoppable';

process.on('unhandledRejection', exception => {
	throw exception;
});

const port = 3000;

const expressInstance = stoppable(createExpressInstance().listen(port));

console.log(
	`Server listening on port ${port}. See the docs for how to use: https://github.com/dustinsoftware/polly-proxy`,
);

process.on('SIGTERM', () => {
	console.log('SIGTERM received');
	expressInstance.stop(() => process.exit(0));
});

process.on('SIGINT', () => {
	console.log('SIGINT received');
	expressInstance.stop(() => process.exit(0));
});
