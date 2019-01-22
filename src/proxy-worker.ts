export function workerEntry(data: any, callback: (err: Error | null, result: any) => void) {
	console.log('Worker is running ' + process.pid + JSON.stringify(data));
	callback(null, { result: 'Hello from worker ' + process.pid });
}
