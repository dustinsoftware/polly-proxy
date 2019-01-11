import Adapter from '@pollyjs/adapter';

interface PollyRequest {
	promise: Promise<void>
}

export default class NodeHttpAdapter extends Adapter {
	onRequest: (request: PollyRequest) => any;
}
