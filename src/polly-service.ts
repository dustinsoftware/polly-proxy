import { Polly } from '@pollyjs/core';
import NodeHttpAdapter from '@pollyjs/adapter-node-http';
import FSPersister from '@pollyjs/persister-fs';
import path from 'path';

Polly.register(NodeHttpAdapter);
Polly.register(FSPersister);

export interface PollyServiceOptions {
	recordIfMissing: boolean | undefined;
	recordFailedRequests?: boolean;
	order?: boolean;
}

export interface PollyHostTransform {
	from: string;
	to: string;
}

export class PollyService {
	constructor(recordingDirectory: string, hostTransforms: PollyHostTransform | null) {
		this._recordingDirectory = recordingDirectory;
		this._hostTransform = hostTransforms;
	}

	private _recordingDirectory: string;

	private _pollyInstance: Polly | null = null;

	private _hostTransform: PollyHostTransform | null;

	isInitialized = () => this._pollyInstance != null;

	initializeTest = async (testName: string) => {
		if (this._pollyInstance) {
			await this.stop();
			this._pollyInstance = null;
		}
		const recordingsDir = path.resolve(this._recordingDirectory);

		console.info(`Recording to ${recordingsDir}`);

		this._pollyInstance = new Polly(testName, {
			adapters: ['node-http'],
			persister: 'fs',
			persisterOptions: {
				keepUnusedRequests: true,
				fs: {
					recordingsDir,
				},
			},
			logging: false,
			recordIfMissing: false,
			recordFailedRequests: true,
			matchRequestsBy: {
				headers: headers => {
					return {
						Authorization: headers['Authorization'],
					};
				},
				order: true,
				url: {
					protocol: false,
					hostname: host => {
						if (this._hostTransform == null) {
							return host;
						}

						if (host === this._hostTransform.from) {
							return this._hostTransform.to;
						}

						return host;
					},
					port: false,
				},
			},
		});
	};

	configure = async (options: PollyServiceOptions) => {
		if (!this._pollyInstance) {
			throw new Error('Polly was not initialized');
		}

		this._pollyInstance.configure({
			matchRequestsBy: {
				order: options.order,
			},
			recordIfMissing: options.recordIfMissing,
			recordFailedRequests: options.recordFailedRequests,
		});
	};

	record = async () => {
		if (!this._pollyInstance) {
			throw new Error('Polly was not initialized');
		}

		this._pollyInstance.record();
	};

	replay = async () => {
		if (!this._pollyInstance) {
			throw new Error('Polly was not initialized');
		}

		this._pollyInstance.replay();
	};

	stop = async () => {
		if (!this._pollyInstance) {
			return;
		}

		await this._pollyInstance.flush();
		await this._pollyInstance.stop();
		this._pollyInstance = null;
	};
}
