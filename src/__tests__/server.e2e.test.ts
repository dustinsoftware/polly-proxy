import express from 'express';
import fetch from 'isomorphic-fetch';
import { AddressInfo } from 'net';
import stoppable, { StoppableServer } from 'stoppable';

describe('server e2e', () => {
	let server: StoppableServer;

	let counter: number;

	let proxyInstanceUrl: string;

	beforeAll(async () => {
		server = stoppable(
			express()
				.get('/counter', (req, res) => {
					res.json({ counter: counter++ });
				})
				.listen(3001),
		);
	});

	beforeEach(async () => {
		counter = 5;

		const createProxyResponse: { port: number } = JSON.parse(
			await fetch(`http://localhost:3000/worker`, {
				method: 'POST',
			}).then(x => x.text()),
		);

		proxyInstanceUrl = `http://localhost:${createProxyResponse.port}/`;
	});

	afterEach(async () => {
		expect(
			await fetch(`${proxyInstanceUrl}stop?testName=server-e2e`, {
				method: 'POST',
			}).then(x => x.text()),
		).toBe('');
	});

	afterAll(async () => {
		await new Promise(resolve => server.stop(resolve));
	});

	it('does nothing', () => Promise.resolve());

	it("doesn't persist requests before recording begins", async () => {
		const random = Math.random();
		const response = await fetch(
			`${proxyInstanceUrl}addproxy?proxyPath=${encodeURIComponent(
				`http://localhost:${(server.address() as AddressInfo).port}`,
			)}`,
			{
				method: 'POST',
			},
		).then(x => x.json());
		expect(response.port).toBeGreaterThan(3000);

		// should be a cache miss
		expect(
			(await fetch(`http://localhost:${response.port}/counter?random=${random}`).then(x =>
				x.json(),
			)).counter,
		).toBe(5);

		// should still be a cache miss
		expect(
			(await fetch(`http://localhost:${response.port}/counter?random=${random}`).then(x =>
				x.json(),
			)).counter,
		).toBe(6);
	});

	it('record API calls', async () => {
		const response = await fetch(
			`${proxyInstanceUrl}addproxy?proxyPath=${encodeURIComponent(
				`http://localhost:${(server.address() as AddressInfo).port}`,
			)}`,
			{
				method: 'POST',
			},
		).then(x => x.json());
		expect(response.port).toBeGreaterThan(3000);

		let replayResponse: string;
		replayResponse = await fetch(`${proxyInstanceUrl}record?testName=server-e2e`, {
			method: 'POST',
		}).then(x => x.text());

		expect(replayResponse).toBe('');

		let random = Math.random();

		let cacheMissResponse = (await fetch(
			`http://localhost:${response.port}/counter?random=${random}`,
		).then(x => x.json())).counter;

		// should be a cache miss
		expect(cacheMissResponse).toBe(5);

		await fetch(`${proxyInstanceUrl}stop?testName=server-e2e`).then(x => x.text());

		// "rewind" the recording
		replayResponse = await fetch(`${proxyInstanceUrl}replay?testName=server-e2e`, {
			method: 'POST',
		}).then(x => x.text());

		expect(replayResponse).toBe('');

		// should be a cache hit
		expect(
			(await fetch(`http://localhost:${response.port}/counter?random=${random}`).then(x =>
				x.json(),
			)).counter,
		).toBe(5);
	});

	it('returns 400 if required parameters are empty', async () => {
		expect((await fetch(`${proxyInstanceUrl}record`, { method: 'POST' })).status).toBe(400);
		expect((await fetch(`${proxyInstanceUrl}replay`, { method: 'POST' })).status).toBe(400);
		expect((await fetch(`${proxyInstanceUrl}addproxy`, { method: 'POST' })).status).toBe(400);
		expect((await fetch(`${proxyInstanceUrl}configure`, { method: 'POST' })).status).toBe(400);
	});

	it('configures the current proxy instance', async () => {
		let response;

		response = await fetch(`${proxyInstanceUrl}replay?testName=server-e2e`, { method: 'POST' });
		expect(response.status).toBe(200);

		response = await fetch(`${proxyInstanceUrl}configure?recordFailedRequests=1`, {
			method: 'POST',
		});
		expect(response.status).toBe(200);
	});
});
