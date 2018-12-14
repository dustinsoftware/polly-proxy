import { Polly } from '@pollyjs/core';
import NodeHttpAdapter from '@pollyjs/adapter-node-http';
import FSPersister from '@pollyjs/persister-fs';
import path from 'path';

Polly.register(NodeHttpAdapter);
Polly.register(FSPersister);

export class PollyService {
	pollyInstance = null;

	initializeTest = async testName => {
		if (this.pollyInstance) {
			await this.stop();
			this.pollyInstance = null;
		}

		this.pollyInstance = new Polly(testName, {
			adapters: ['node-http'],
			persister: 'fs',
			persisterOptions: {
				fs: {
					recordingsDir: path.join(__dirname, 'recordings')
				}
			},
			logging: true,
			recordIfMissing: true,
			matchRequestsBy: {
				headers: false,
				order: false
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
			throw new Error('Polly was not initialized');
		}

		await this.pollyInstance.flush();
		await this.pollyInstance.stop();
		this.pollyInstance = null;
	};
}
