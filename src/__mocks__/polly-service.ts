class Polly {
  constructor(testName, options) {}

  record() {}

  replay() {}

  flush() {}
  stop() {}
}
export class PollyService {
  pollyInstance: Polly;

  initializeTest = async (testName: string) => {
    if (this.pollyInstance) {
      await this.stop();
      this.pollyInstance = null;
    }

    this.pollyInstance = new Polly(testName, {});
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
