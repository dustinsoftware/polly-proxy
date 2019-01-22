import express from 'express';
import path from 'path';
import expressPromiseRouter from 'express-promise-router';
import { PollyService, PollyServiceOptions } from './polly-service';
import { ProxyService } from './proxy-service';
import WorkerNodes from 'worker-nodes';

const workerNodes = new WorkerNodes(path.resolve(__dirname, '../dist/proxy-worker'), {
	maxWorkers: 100,
	workerEndurance: 5,
	taskTimeout: 2000,
});

const router = expressPromiseRouter();

const pollyService = new PollyService();
const proxyService = new ProxyService();

export const createExpressInstance = () =>
	express().use(
		router
			.get('/', async (req, res) => {
				res.status(200).send('polly-proxy');
			})
			.get('/worker', async (req, res) => {
				await workerNodes.ready();
				console.log('ready');
				const workerResponse = workerNodes.call.workerEntry({ query: req.query });
				console.log(workerResponse);
				await workerResponse;
				res.status(200).send(workerResponse);
			})
			.post('/stop', async (req, res) => {
				await pollyService.stop();
				res.status(200).send();
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
			.post('/resetproxies', async (req, res) => {
				proxyService.closeAllProxies();
				res.status(200).send();
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
