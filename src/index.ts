import express from 'express';
import { PollyService } from './polly-service';
import { ProxyService } from './utils';
const pollyService = new PollyService();
const proxyService = new ProxyService();

express()
	.get('/stop', async (req, res) => {
		try {
			await pollyService.stop();
			res.status(200).send();


		} catch (e) {
			res.status(500).send(e.message);
		}
	})
	.get('/replay', async (req, res) => {
		try {
			if (!req.query.testName) {
				throw new Error('Empty testName parameter');
			}

			await pollyService.initializeTest(req.query.testName);
			await pollyService.replay();
			res.status(200).send();
		} catch (e) {
			res.status(500).send(e.message);
		}
	})
	.get('/addproxy', async (req, res) => {
		try {
			// add a timer to clean up proxy
			// create a proxy, and return the assigned port
			if (!req.query.proxyPath) {
				throw new Error('Empty proxyPath parameter');
			}

			const proxyInstance = proxyService.createProxy(req.query.proxyPath);

			res.status(200).send({ port: proxyInstance.port, proxyPath: proxyInstance.proxyPath,  });
		} catch (e) {
			res.status(500).send(e.message);
		}
	})
	.listen(3000);

