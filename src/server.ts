import express from 'express';
import expressPromiseRouter from 'express-promise-router';
import { PollyService } from './polly-service';
import { ProxyService } from './proxy-service';

const router = expressPromiseRouter();

const pollyService = new PollyService();
const proxyService = new ProxyService();

export const createExpressInstance = () =>
	express().use(
		router
			.get('/', async (req, res) => {
				res.status(200).send('polly-proxy');
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
			}),
	);
