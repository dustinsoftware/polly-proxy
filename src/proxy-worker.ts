export function workerEntry() {
	console.log('Worker is running ' + process.pid);
	return 'Hello from worker ' + process.pid;
}
