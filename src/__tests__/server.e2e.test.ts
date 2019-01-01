import http from 'http';
import express from 'express';
import fetch from 'isomorphic-fetch';
import { AddressInfo } from 'net';

describe('server e2e', () => {
  let server: http.Server;

  let counter: number;

  beforeAll(async () => {
    server = await express()
      .get('/counter', (req, res) => {
        res.set('Connection', 'close').json({ counter: counter++ });
      })
      .listen(3001);
  });

  beforeEach(async () => {
    counter = 5;

    let pollyResponse: string;
    pollyResponse = await fetch(
      'http://localhost:3000/stop?testName=server-e2e',
      {
        method: 'POST',
      },
    ).then(x => x.text());

    expect(pollyResponse).toBe('');
  });

  afterAll(async () => {
    await server.close();
  });

  it('does nothing', () => Promise.resolve());

  it("doesn't persist requests before recording begins", async () => {
    const random = Math.random();
    const response = await fetch(
      `http://localhost:3000/addproxy?proxyPath=${encodeURIComponent(
        `http://localhost:${(server.address() as AddressInfo).port}`,
      )}`,
      {
        method: 'POST',
      },
    ).then(x => x.json());
    expect(response.port).toBeGreaterThan(3000);

    // should be a cache miss
    expect(
      (await fetch(
        `http://localhost:${response.port}/counter?random=${random}`,
      ).then(x => x.json())).counter,
    ).toBe(5);

    // should still be a cache miss
    expect(
      (await fetch(
        `http://localhost:${response.port}/counter?random=${random}`,
      ).then(x => x.json())).counter,
    ).toBe(6);
  });

  it('record API calls', async () => {
    const response = await fetch(
      `http://localhost:3000/addproxy?proxyPath=${encodeURIComponent(
        `http://localhost:${(server.address() as AddressInfo).port}`,
      )}`,
      {
        method: 'POST',
      },
    ).then(x => x.json());
    expect(response.port).toBeGreaterThan(3000);

    let replayResponse: string;
    replayResponse = await fetch(
      'http://localhost:3000/replay?testName=server-e2e',
      {
        method: 'POST',
      },
    ).then(x => x.text());

    expect(replayResponse).toBe('');

    let random = Math.random();

		let cacheMissResponse = (await fetch(
      `http://localhost:${response.port}/counter?random=${random}`,
    ).then(x => x.json())).counter;

    // should be a cache miss
    expect(cacheMissResponse).toBe(5);

    await fetch('http://localhost:3000/stop?testName=server-e2e').then(x =>
      x.text(),
    );

    // "rewind" the recording
    replayResponse = await fetch(
      'http://localhost:3000/replay?testName=server-e2e',
      {
        method: 'POST',
      },
    ).then(x => x.text());

    expect(replayResponse).toBe('');

    // should be a cache hit
    expect(
      (await fetch(
        `http://localhost:${response.port}/counter?random=${random}`,
      ).then(x => x.json())).counter,
    ).toBe(5);
  });
});
