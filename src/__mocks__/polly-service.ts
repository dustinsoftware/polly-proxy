class Polly {
	constructor(testName: string, options: any) {}

	record() {}

	replay() {}

	flush() {}
	stop() {}
}
export class PollyService {
	_pollyInstance: Polly | null = null;

	isInitialized = () => this._pollyInstance != null;

	initializeTest = async (testName: string) => {
		if (this._pollyInstance) {
			await this.stop();
			this._pollyInstance = null;
		}

		this._pollyInstance = new Polly(testName, {});
	};

	configure = async (options: any) => {};

	record = async () => {
		if (!this._pollyInstance) {
			throw new Error('Polly was not initialized');
		}

		await this._pollyInstance.record();
	};

	replay = async () => {
		if (!this._pollyInstance) {
			throw new Error('Polly was not initialized');
		}

		await this._pollyInstance.replay();
	};

	stop = async () => {
		if (!this._pollyInstance) {
			throw new Error('Polly was not initialized');
		}

		await this._pollyInstance.flush();
		await this._pollyInstance.stop();
		this._pollyInstance = null;
	};
}
