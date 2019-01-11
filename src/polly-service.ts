import { Polly } from '@pollyjs/core';
import NodeHttpAdapter, { PollyRequest } from 'dpm-adapter-node-http';
import FSPersister from '@pollyjs/persister-fs';
import path from 'path';

let parentOnRequest = NodeHttpAdapter.prototype.onRequest;
NodeHttpAdapter.prototype.onRequest = function (request: PollyRequest) {
	request.promise.catch(() => {});

	if (parentOnRequest) {
		return parentOnRequest.call(this, request);
	}
}

Polly.register(NodeHttpAdapter);
Polly.register(FSPersister);

export class PollyService {
	pollyInstance: Polly = null;

	initializeTest = async (testName: string) => {
		if (this.pollyInstance) {
			await this.stop();
			this.pollyInstance = null;
		}
		const recordingsDir = path.join(__dirname, 'recordings');
		console.info(`Recording to ${recordingsDir}`);

		this.pollyInstance = new Polly(testName, {
			adapters: ['node-http'],
			persister: 'fs',
			persisterOptions: {
				fs: {
					recordingsDir,
				},
			},
			logging: false,
			recordIfMissing: true,
			recordFailedRequests: true, // We need to patch polly, otherwise an unhandled exception is thrown...
			matchRequestsBy: {
				headers: headers => {
					return {
						'Authorization': headers['Authorization'],
					};
				},
				order: true,
				url: {
					protocol: false,
				}
			}
		});
	};

	record = async () => {
		if (!this.pollyInstance) {
			throw new Error('Polly was not initialized');
		}

		await this.pollyInstance.record();
	};

	replay = async () => {
		if (!this.pollyInstance) {
			throw new Error('Polly was not initialized');
		}

		await this.pollyInstance.replay();
	};

	stop = async () => {
		if (!this.pollyInstance) {
			return;
		}

		await this.pollyInstance.flush();
		await this.pollyInstance.stop();
		this.pollyInstance = null;
	};
}
