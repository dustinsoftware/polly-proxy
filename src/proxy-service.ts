import express from 'express';
import http from 'http';
import httpProxy from 'http-proxy';
import { AddressInfo } from 'net';
const proxy = httpProxy.createProxyServer({});

export interface ProxyInstance {
	port: number | null;
	proxyPath: string | null;
	timer: any;
	expressInstance: { close: () => void } | null;
}

export class ProxyService {
	constructor() {
		this.proxyMap = Array(100)
			.fill(0)
			.map(() => ({
				port: null,
				proxyPath: null,
				timer: null,
				expressInstance: null,
			}));
	}

	static createApiProxy({ url }: { url: string }): http.Server {
		const expressInstance = express().use(async (req, res, next) => {
			try {
				console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);

				proxy.web(
					req,
					res,
					{
						target: url,
						secure: false,
						changeOrigin: true,
					},
					next,
				);
			} catch (e) {
				console.error(e.stack);
				res.status(500).send('Unhandled error while proxying request');
			}
		});

		return expressInstance.listen(null);
	}

	proxyMap: ProxyInstance[];

	createProxy(proxyPath: string) {
		const proxyInstance = this.proxyMap.find(port => port.proxyPath == null);

		if (!proxyInstance) {
			throw new Error('All ports in use!');
		}

		proxyInstance.proxyPath = proxyPath;

		const expressInstance = ProxyService.createApiProxy({
			url: proxyInstance.proxyPath,
		});
		proxyInstance.port = (expressInstance.address() as AddressInfo).port;
		proxyInstance.expressInstance = expressInstance;
		proxyInstance.timer = setTimeout(() => {
			clearTimeout(proxyInstance.timer);
			expressInstance.close();

			proxyInstance.proxyPath = null;

			console.log(`${new Date().toISOString()} Closed ${proxyInstance.port}`);
		}, 120000);

		console.log(`${new Date().toISOString()} Opened ${proxyInstance.port}`);

		return proxyInstance;
	}

	closeAllProxies = () => {
		for (let proxyInstance of this.proxyMap) {
			if (proxyInstance.expressInstance) {
				proxyInstance.expressInstance.close();
				proxyInstance.proxyPath = null;
				clearTimeout(proxyInstance.timer);
			}
		}
	};
}
