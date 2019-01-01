import express from 'express';
import { PollyService } from './polly-service';
import { ProxyService } from './proxy-service';
const pollyService = new PollyService();
const proxyService = new ProxyService();

export const createExpressInstance = () =>
	express()
		.post('/stop', async (req, res) => {
			try {
				await pollyService.stop();
				res.status(200).send();
			} catch (e) {
				res.status(500);
				console.error(e);
			}
		})
		.post('/replay', async (req, res) => {
			try {
				if (!req.query.testName) {
					throw new Error('Empty testName parameter');
				}

				await pollyService.initializeTest(req.query.testName);
				await pollyService.replay();
				res.status(200).send();
			} catch (e) {
				res.status(500);
				console.error(e);
			}
		})
		.post('/addproxy', async (req, res) => {
			try {
				if (!req.query.proxyPath) {
					throw new Error('Empty proxyPath parameter');
				}

				const proxyInstance = proxyService.createProxy(req.query.proxyPath);

				res.status(200).send({
					port: proxyInstance.port,
					proxyPath: proxyInstance.proxyPath,
				});
			} catch (e) {
				res.status(500);
				console.error(e);
			}
		})
		.post('/resetproxies', async (req, res) => {
			try {
				proxyService.closeAllProxies();
				res.status(200).send();
			} catch (e) {
				res.status(500);
				console.error(e);
			}
		});
