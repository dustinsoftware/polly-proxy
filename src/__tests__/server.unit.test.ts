import http from 'http';
import express from 'express';
import supertest from 'supertest';
import { createExpressInstance } from '../proxy-worker';
import fetch from 'isomorphic-fetch';
import { AddressInfo } from 'net';
import stoppable, { StoppableServer } from 'stoppable';

jest.mock('../polly-service.ts');

describe('proxy api', () => {
	let app: express.Application, server: StoppableServer;

	beforeAll(done => {
		app = createExpressInstance();
		server = stoppable(http.createServer(app).listen(done));
	});

	afterAll(async () => {
		try {
			expect(
				await supertest(app)
					.post(`/stop`)
					.then(x => x.status),
			).toBe(200);

			await new Promise(resolve => server.stop(resolve));
		} catch (e) {
			console.error(e);
		}
	});

	it('does nothing', () => Promise.resolve());

	it('returns 404', async () => {
		const response = await supertest(app).get('/404');
		expect(response.status).toBe(404);
	});

	it('adds a proxy', async () => {
		let response;

		const sampleHttpServer = stoppable(
			express()
				.get('/', (req, res) => res.status(200).send('hello proxy'))
				.listen(null),
		);

		response = await supertest(app)
			.post(`/addproxy`)
			.query({
				proxyPath: `http://localhost:${(sampleHttpServer.address() as AddressInfo).port}`,
			});
		expect(response.status).toBe(200);
		const startedProxy = JSON.parse(response.text);

		expect(startedProxy.port).toBeGreaterThanOrEqual(3000);

		expect(await fetch(`http://localhost:${startedProxy.port}`).then(x => x.text())).toBe(
			'hello proxy',
		);

		sampleHttpServer.stop();
	});

	it('returns 500 if proxied service is down', async () => {
		let response;

		response = await supertest(app)
			.post(`/addproxy`)
			.query({
				proxyPath: `http://localhost:${12345}`,
			});
		expect(response.status).toBe(200);
		const startedProxy = JSON.parse(response.text);

		expect(startedProxy.port).toBeGreaterThanOrEqual(3000);

		expect(await fetch(`http://localhost:${startedProxy.port}`).then(x => x.status)).toBe(500);
	});

	it('starts and stops a test recording', async () => {
		let response;

		response = await supertest(app)
			.post(`/replay`)
			.query({ testName: 'unit-test' });
		expect(response.status).toBe(200);
	});

	it('returns 400 if required parameters are empty', async () => {
		expect((await supertest(app).post('/record')).status).toBe(400);
		expect((await supertest(app).post('/replay')).status).toBe(400);
		expect((await supertest(app).post('/addproxy')).status).toBe(400);
		expect((await supertest(app).post('/configure')).status).toBe(400);
	});

	it('configures the current proxy instance', async () => {
		let response;

		response = await supertest(app)
			.post(`/replay`)
			.query({ testName: 'unit-test' });
		expect(response.status).toBe(200);

		response = await supertest(app)
			.post(`/configure`)
			.query({ recordFailedRequests: true });
		expect(response.status).toBe(200);
	});
});
