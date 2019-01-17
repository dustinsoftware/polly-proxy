import { createExpressInstance } from './server';
process.on('unhandledRejection', exception => {
	throw exception;
});

const port = 3000;

createExpressInstance().listen(port);

console.log(
	`Server listening on port ${port}. See the docs for how to use: https://github.com/dustinsoftware/polly-proxy`,
);
