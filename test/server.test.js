// Minimal smoke test: boots the server against a throwaway DB file,
// exercises validation, insert, and listing over HTTP, then exits non-zero on failure.
const fs = require('fs');
const path = require('path');
const http = require('http');

const TEST_DB = path.join(__dirname, 'test.db');
for (const suffix of ['', '-wal', '-shm', '-journal']) {
  fs.rmSync(TEST_DB + suffix, { force: true });
}
process.env.DB_PATH = TEST_DB;
process.env.PORT = 0;

const server = require('../server.js');

function request(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const { port } = server.address();
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        method,
        host: 'localhost',
        port,
        path: urlPath,
        headers: data
          ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
          : {},
      },
      (res) => {
        let chunks = '';
        res.on('data', (c) => (chunks += c));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(chunks);
          } catch (_) {}
          resolve({ status: res.statusCode, body: json });
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error('FAIL: ' + message);
  }
  console.log('ok - ' + message);
}

async function main() {
  await new Promise((resolve) => server.once('listening', resolve));

  const empty = await request('GET', '/api/entries');
  assert(empty.status === 200, 'GET /api/entries returns 200');
  assert(Array.isArray(empty.body) && empty.body.length === 0, 'starts with no entries');

  const missing = await request('POST', '/api/entries', { name: '', message: '' });
  assert(missing.status === 400, 'rejects empty name/message');

  const tooLong = await request('POST', '/api/entries', {
    name: 'a'.repeat(200),
    message: 'hello',
  });
  assert(tooLong.status === 400, 'rejects overlong name');

  const created = await request('POST', '/api/entries', {
    name: 'Ada',
    message: 'Hello <script>alert(1)</script> world',
  });
  assert(created.status === 201, 'creates a valid entry');
  assert(created.body.name === 'Ada', 'stores name verbatim (escaping happens on render)');
  assert(
    created.body.message.includes('<script>'),
    'stores raw message in DB (client renders via textContent, not innerHTML)'
  );

  const listed = await request('GET', '/api/entries');
  assert(listed.body.length === 1, 'newly created entry is listed');
  assert(listed.body[0].name === 'Ada', 'listed entry matches submission');

  console.log('All tests passed.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
