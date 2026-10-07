const test = require('node:test');
const assert = require('node:assert');
const server = require('../src/app');

test('GET /health returns ok', async () => {
  await new Promise(r => server.listen(0, r));
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/health`);
  const body = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(body.status, 'ok');
  server.close();
});
