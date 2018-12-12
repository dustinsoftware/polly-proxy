const express = require('express');
const yakbak = require('yakbak');

function createApiProxy({ port, url }) {
	const proxyInstance = yakbak(url, {
		dirname: __dirname + '/tapes'
	});
	express()
		.use((req, res) => {
			console.log(`${req.method} ${url}${req.path}`);
			proxyInstance(req, res);
		})
		.listen(port);
}

createApiProxy({ port: 3000, url: 'https://test.sitesapi.faithlife.com' });
createApiProxy({ port: 3001, url: 'http://test.contentapi.logos.com' });
createApiProxy({ port: 3002, url: 'https://test.accountsapi.logos.com' });
createApiProxy({ port: 3003, url: 'https://test.givingapi.faithlife.com' });
createApiProxy({ port: 3004, url: 'https://test.locationsapi.logos.com' });
createApiProxy({ port: 3005, url: 'https://test.soundfaithapi.faithlife.com' });
createApiProxy({ port: 3006, url: 'https://test.api.faithlife.com' });
