import express from 'express';
import httpProxy from 'http-proxy';
import http from 'http';
import { PollyService } from './polly-service';

const proxy = httpProxy.createProxyServer({});
const pollyService = new PollyService();

express()
	.get('/record', async (req, res) => {
		try {
			if (!req.query.testName) {
				throw new Error('Empty testName parameter');
			}

			await pollyService.initializeTest(req.query.testName);
			await pollyService.record();
			res.status(200).send();
		} catch (e) {
			res.status(500).send(e.message);
		}
	})
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
			res.send(500).send(e.message);
		}
	})
	.listen(3001);

express()
	.use(async (req, res) => {
		try {
			console.log(`${req.method} ${req.url}`);

			proxy.web(req, res, {
				target: 'https://test.sitesapi.faithlife.com/',
				secure: false,
				changeOrigin: true
			});
		} catch (e) {
			console.error(e.stack);
			res.status(500).send('Error :/');
		}
	})
	.listen(3000);

// createApiProxy({ port: 3000, url: 'https://test.sitesapi.faithlife.com' });
// createApiProxy({ port: 3001, url: 'http://test.contentapi.logos.com' });
// createApiProxy({ port: 3002, url: 'https://test.accountsapi.logos.com' });
// createApiProxy({ port: 3003, url: 'https://test.givingapi.faithlife.com' });
// createApiProxy({ port: 3004, url: 'https://test.locationsapi.logos.com' });
// createApiProxy({ port: 3005, url: 'https://test.soundfaithapi.faithlife.com' });
// createApiProxy({ port: 3006, url: 'https://test.api.faithlife.com' });
