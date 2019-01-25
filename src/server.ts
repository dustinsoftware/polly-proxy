import express from 'express';
import path from 'path';
import expressPromiseRouter from 'express-promise-router';
import workerFarm from 'worker-farm';
import stoppable from 'stoppable';
import { AddressInfo } from 'net';
import fetch from 'isomorphic-fetch';

interface WorkerFarm {
	[x: string]: Workers;
	(callback: WorkerCallback): void;
}

const workerNodes = workerFarm(
	{ maxCallTime: 120000, autoStart: false, maxCallsPerWorker: 1, maxConcurrentCallsPerWorker: 1 },
	path.resolve(__dirname, '../dist/proxy-worker.js'),
	['workerEntry'],
) as WorkerFarm;

const router = expressPromiseRouter();

async function getOpenPort() {
	const expressInstance = stoppable(express().listen(null));

	const port = (expressInstance.address() as AddressInfo).port;
	await new Promise(resolve => expressInstance.stop(resolve));

	return port;
}

export const createExpressInstance = () =>
	express().use(
		router
			.get('/', async (req, res) => {
				res.status(200).send('polly-proxy');
			})
			.post('/worker', async (req, res) => {
				const port = await getOpenPort();
				workerNodes.workerEntry({ port }, (err: any, callbackData: string) => {
					if (err) {
						console.error(err);
					}
				});

				let tries = 0;
				while (true) {
					try {
						await fetch(`http://localhost:${port}`);
						break;
					} catch {
						if (tries++ > 10) {
							throw new Error('Could not reach spawned server.');
						}
						await new Promise(resolve => setTimeout(resolve, 100));
					}
				}

				res.status(200).send({ port: port });
			}),
	);
