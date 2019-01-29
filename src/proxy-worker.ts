import express from 'express';
import expressPromiseRouter from 'express-promise-router';
import { AddressInfo } from 'net';
import stoppable, { StoppableServer } from 'stoppable';
import { PollyService, PollyServiceOptions, PollyHostTransform } from './polly-service';
import { ProxyService } from './proxy-service';

const router = expressPromiseRouter();

let pollyService: PollyService;
let proxyService: ProxyService;
let expressInstance: StoppableServer;
let processDoneCallback: (err: Error | null, result: any) => void;

function closeInstance() {
	proxyService.closeAllProxies();

	if (expressInstance != null) {
		const port = (expressInstance.address() as AddressInfo).port;

		console.log(`${new Date().toISOString()} Closed proxy worker listening on ${port}`);
		new Promise(resolve => expressInstance.stop(resolve)).then(() => {
			// Warning: Invoking this callback will kill the current process!
			processDoneCallback(null, { port });
		});
	}
}

export const createExpressInstance = () =>
	express().use(
		router
			.get('/', async (req, res) => {
				res.status(200).send('polly-proxy');
			})
			.post('/stop', async (req, res) => {
				await pollyService.stop();
				res.status(200).send();
				closeInstance();
			})
			.post('/replay', async (req, res) => {
				if (!req.query.testName) {
					res.status(400).send({ error: 'Empty testName parameter' });
					return;
				}

				await pollyService.initializeTest(req.query.testName);
				await pollyService.replay();
				res.status(200).send();
			})
			.post('/record', async (req, res) => {
				if (!req.query.testName) {
					res.status(400).send({ error: 'Empty testName parameter' });
					return;
				}

				await pollyService.initializeTest(req.query.testName);
				await pollyService.record();
				res.status(200).send();
			})
			.post('/addproxy', async (req, res) => {
				if (!req.query.proxyPath) {
					res.status(400).send({ error: 'Empty proxyPath parameter' });
					return;
				}

				const proxyInstance = proxyService.createProxy(req.query.proxyPath);

				res.status(200).send({
					port: proxyInstance.port,
					proxyPath: proxyInstance.proxyPath,
				});
			})
			.post('/configure', async (req, res) => {
				const configuration: PollyServiceOptions = {
					recordFailedRequests:
						req.query.recordFailedRequests == null
							? undefined
							: Boolean(req.query.recordFailedRequests),
					order: req.query.order == null ? undefined : Boolean(req.query.order),
					recordIfMissing:
						req.query.recordIfMissing == null ? undefined : Boolean(req.query.recordIfMissing),
				};

				if (!pollyService.isInitialized()) {
					res
						.status(400)
						.send({ error: 'Polly must be initialized with /record or /replay first.' });
				} else if (Object.values(configuration).filter(x => x != null).length === 0) {
					res.status(400).send({
						error:
							'At least one valid configuration option must be specified as a query parameter.',
					});
				} else {
					await pollyService.configure(configuration);
					res.status(200).send();
				}
			}),
	);

export interface WorkerEntryOptions {
	port: number;
	recordingDirectory: string;
	hostRewrite: PollyHostTransform | null;
}

export function workerEntry(
	data: WorkerEntryOptions,
	callback: (err: Error | null, result: any) => void,
) {
	if (expressInstance != null) {
		throw new Error('expressInstance has already been initialized!');
	}

	pollyService = new PollyService(data.recordingDirectory, data.hostRewrite);
	proxyService = new ProxyService();

	expressInstance = stoppable(createExpressInstance().listen(data.port));

	const port = (expressInstance.address() as AddressInfo).port;

	console.log(`${new Date().toISOString()} Worker is listening on ${port}.`);

	setTimeout(closeInstance, 60000);

	processDoneCallback = callback;
}

export function testEntry(recordingDirectory: string) {
	pollyService = new PollyService(recordingDirectory, null);
	proxyService = new ProxyService();
}
