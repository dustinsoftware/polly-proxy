import { createExpressInstance } from './server';
process.on('unhandledRejection', exception => {
	throw exception;
});

createExpressInstance().listen(3000);
