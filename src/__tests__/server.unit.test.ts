import http from 'http';
import express from 'express';
import supertest from 'supertest';
import { createExpressInstance } from '../server';
import fetch from 'isomorphic-fetch';
import { AddressInfo } from 'net';

jest.mock('../polly-service.ts');

describe('proxy api', () => {
	let app: express.Application, server: http.Server;

	beforeAll(done => {
		app = createExpressInstance();
		server = http.createServer(app);
		server.listen(done);
	});

	afterAll(async () => {
		await server.close();
	});

	it('does nothing', () => Promise.resolve());

	it('returns 404', async () => {
		const response = await supertest(app).get('/404');
		expect(response.status).toBe(404);
	});

	it('adds a proxy', async () => {
		let response;

		const sampleHttpServer = express()
			.get('/', (req, res) => res.status(200).send('hello proxy'))
			.listen(null);

		response = await supertest(app)
			.post(`/addproxy`)
			.query({
				proxyPath: `http://localhost:${
					(sampleHttpServer.address() as AddressInfo).port
				}`,
			});
		expect(response.status).toBe(200);
		const startedProxy = JSON.parse(response.text);

		expect(startedProxy.port).toBeGreaterThanOrEqual(3000);

		expect(
			await fetch(`http://localhost:${startedProxy.port}`).then(x => x.text()),
		).toBe('hello proxy');

		sampleHttpServer.close();

		response = await supertest(app).post('/resetproxies');
		expect(response.status).toBe(200);
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

		expect(
			await fetch(`http://localhost:${startedProxy.port}`).then(x => x.status),
		).toBe(500);

		response = await supertest(app).post('/resetproxies');
		expect(response.status).toBe(200);
	});

	it('starts and stops a test recording', async () => {
		let response;

		response = await supertest(app)
			.post(`/replay`)
			.query({ testName: 'unit-test' });
		expect(response.status).toBe(200);

		response = await supertest(app).post(`/stop`);
		expect(response.status).toBe(200);
	});
});
