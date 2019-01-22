export function workerEntry(data: any) {
	console.log('Worker is running ' + process.pid + JSON.stringify(data));
	return 'Hello from worker ' + process.pid;
}
