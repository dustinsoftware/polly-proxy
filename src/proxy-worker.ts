import express from 'express';
import expressPromiseRouter from 'express-promise-router';
import { AddressInfo } from 'net';
import stoppable, { StoppableServer } from 'stoppable';
import { PollyService, PollyServiceOptions } from './polly-service';
import { ProxyService } from './proxy-service';

const router = expressPromiseRouter();

const pollyService = new PollyService();
const proxyService = new ProxyService();
let expressInstance: StoppableServer;
let processDoneCallback: (err: Error | null, result: any) => void;

function closeInstance() {
	const port = (expressInstance.address() as AddressInfo).port;

	proxyService.closeAllProxies();
	console.log(`${new Date().toISOString()} Closed proxy worker listening on ${port}`);
	expressInstance.stop();
	processDoneCallback(null, { port });
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

export function workerEntry(
	data: { port: number },
	callback: (err: Error | null, result: any) => void,
) {
	if (expressInstance != null) {
		throw new Error('expressInstance has already been initialized!');
	}

	expressInstance = stoppable(createExpressInstance().listen(data.port));

	const port = (expressInstance.address() as AddressInfo).port;

	console.log(`${new Date().toISOString()} Worker is listening on ${port}.`);

	setTimeout(closeInstance, 60000);

	processDoneCallback = callback;
}
