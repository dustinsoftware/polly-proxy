const http = require('http');
const supertest = require('supertest');
import { createExpressInstance } from '../server';

jest.mock('../polly-service.ts');

describe('proxy api', () => {
  let app, server;

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
    const response = await supertest(app).get('/');
    expect(response.status).toBe(404);
  });

  it('adds a proxy', async () => {
    let response;

    response = await supertest(app)
      .post(`/replay`)
      .query({ testName: 'unit-test' });
    expect(response.status).toBe(200);

    response = await supertest(app)
      .post(`/addproxy`)
      .query({ proxyPath: 'http://example.com' });
    expect(response.status).toBe(200);

    response = await supertest(app).post(`/stop`);
    expect(response.status).toBe(200);

    response = await supertest(app).post('/resetproxies');
    expect(response.status).toBe(200);
  });
});
