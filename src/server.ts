import express from 'express';
import path from 'path';
import expressPromiseRouter from 'express-promise-router';
import workerFarm from 'worker-farm';
import { PollyService, PollyServiceOptions } from './polly-service';
import { ProxyService } from './proxy-service';

const workerNodes = workerFarm(
	{ maxCallTime: 2000 },
	path.resolve(__dirname, '../dist/proxy-worker'),
	['workerEntry'],
);

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
				const workerResponse = new Promise((resolve, reject) =>
					workerNodes.workerEntry({ query: req.query }, (err: any, callbackData: string) => {
						if (err) {
							reject(err);
						}
						resolve(callbackData);
					}),
				);
				res.status(200).send(await workerResponse);
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
