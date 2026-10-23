import assert from 'node:assert/strict';
import test from 'node:test';
import type { Server } from 'node:http';
import { createApp } from '../server/app';
import { ApiError, parsePhoto, safeProviderUrl, YouCamClient } from '../server/youcam';

const bytes = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), Buffer.alloc(24)]);
const photo = { data: bytes.toString('base64'), contentType: 'image/png' as const, name: 'test.png' };
const input = { person: photo, garment: photo, category: 'outer', consent: true };
async function serve(t: { after: (fn: () => Promise<void>) => void }, config: Parameters<typeof createApp>[0]) {
  const server: Server = await new Promise(resolve => { const server = createApp(config).listen(0, '127.0.0.1', () => resolve(server)); });
  t.after(() => new Promise<void>(resolve => { server.close(() => resolve()); server.closeAllConnections(); }));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  return `http://127.0.0.1:${address.port}`;
}
const post = (base: string, body: unknown, origin = 'http://127.0.0.1:5193') => fetch(base + '/api/tryons', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(body) });

test('sample mode never invokes a provider and exposes only safe readiness metadata', async t => {
  let called = false;
  const fake = { create: async () => { called = true; } } as unknown as YouCamClient;
  const base = await serve(t, { client: fake });
  const health = await (await fetch(base + '/api/health')).json();
  assert.equal(health.liveEnabled, false);
  assert.equal(JSON.stringify(health).includes('key'), false);
  assert.equal((await post(base, input)).status, 503);
  assert.equal(called, false);
});

test('origin, consent, MIME and category are validated before the provider is called', async t => {
  let calls = 0;
  const client = { create: async () => { calls++; return 'provider-id'; } } as unknown as YouCamClient;
  const base = await serve(t, { key: 'test-only', liveEnabled: true, client });
  assert.equal((await post(base, input, 'https://unrelated.example')).status, 403);
  assert.equal((await post(base, { ...input, consent: false })).status, 400);
  assert.equal((await post(base, { ...input, category: 'other' })).status, 400);
  assert.equal((await post(base, { ...input, person: { ...photo, contentType: 'image/svg+xml' } })).status, 400);
  assert.equal(calls, 0);
});

test('live task uses local opaque ID, caches terminal result, and enforces its session cap', async t => {
  let statusCalls = 0;
  const client = { create: async () => 'private-provider-task', status: async () => { statusCalls++; return { status: 'success', imageUrl: 'https://cdn.makeupar.com/result.jpg' }; } } as unknown as YouCamClient;
  const base = await serve(t, { key: 'test-only', liveEnabled: true, maxTasks: 1, client });
  const createdResponse = await post(base, input);
  assert.equal(createdResponse.status, 202);
  const created = await createdResponse.json();
  assert.equal(created.provenance, 'youcam-live');
  assert.notEqual(created.id, 'private-provider-task');
  assert.equal((await post(base, input)).status, 429);
  const first = await (await fetch(`${base}/api/tryons/${created.id}`)).json();
  const second = await (await fetch(`${base}/api/tryons/${created.id}`)).json();
  assert.equal(first.status, 'success'); assert.equal(second.status, 'success'); assert.equal(statusCalls, 1);
  assert.equal((await fetch(base + '/api/tryons/unknown')).status, 404);
});

test('provider integration follows file → binary upload → V4 task contract without sending key to storage', async () => {
  const requests: { url: string; init?: RequestInit }[] = [];
  let fileCount = 0;
  const mockFetch = (async (url: string | URL | Request, init?: RequestInit) => {
    requests.push({ url: String(url), init });
    if (String(url).endsWith('/file')) { fileCount++; return Response.json({ data: { files: [{ file_id: `file-${fileCount}`, requests: [{ method: 'PUT', url: `https://yce-us.s3-accelerate.amazonaws.com/upload-${fileCount}`, headers: { 'Content-Type': 'image/png' } }] }] } }); }
    if (String(url).includes('s3-accelerate')) return new Response('', { status: 200 });
    return Response.json({ data: { task_id: 'task-contract' } });
  }) as typeof fetch;
  const client = new YouCamClient('test-only-key', mockFetch);
  assert.equal(await client.create(photo, photo, 'shoes'), 'task-contract');
  assert.equal(requests.length, 5);
  const task = JSON.parse(String(requests[4].init?.body));
  assert.deepEqual(task, { src_file_id: 'file-1', ref_file_id: 'file-2', garment_category: 'shoes', change_shoes: true, filter_multi_person: 'strict' });
  assert.ok(requests[4].url.endsWith('/s2s/v2.0/task/cloth-v4'));
  for (const upload of requests.filter(request => request.url.includes('s3-accelerate'))) assert.equal(new Headers(upload.init?.headers).has('Authorization'), false);
});

test('unsafe provider URLs and mismatched image signatures are rejected', () => {
  for (const url of ['http://127.0.0.1/image', 'https://evil.example/image', 'https://makeupar.com.evil.example/image', 'https://user:pass@cdn.makeupar.com/image']) assert.throws(() => safeProviderUrl(url), ApiError);
  assert.equal(safeProviderUrl('https://cdn.makeupar.com/image.jpg'), 'https://cdn.makeupar.com/image.jpg');
  assert.throws(() => parsePhoto({ ...photo, contentType: 'image/jpeg' }), ApiError);
  assert.throws(() => parsePhoto({ ...photo, data: '<svg>not-an-image</svg>' }), ApiError);
});

test('provider errors are sanitized and malformed successful responses never become previews', async () => {
  const denied = new YouCamClient('private-test-key', (async () => new Response('private-test-key account details', { status: 401 })) as typeof fetch);
  await assert.rejects(() => denied.create(photo, photo, 'outer'), error => error instanceof ApiError && error.code === 'API_CONFIGURATION' && !error.message.includes('private-test-key'));
  const malformed = new YouCamClient('private-test-key', (async () => Response.json({ data: { task_status: 'success', results: { url: 'http://localhost/admin' } } })) as typeof fetch);
  await assert.rejects(() => malformed.status('opaque'), error => error instanceof ApiError && error.code === 'PROVIDER_RESPONSE');
});

test('encrypted task receipt resumes in another server instance and rejects tampering', async t => {
  const client = { create: async () => 'private-provider-id', status: async (id: string) => { assert.equal(id, 'private-provider-id'); return { status: 'success', imageUrl: 'https://cdn.makeupar.com/result.jpg' }; } } as unknown as YouCamClient;
  const config = { key: 'shared-server-secret', liveEnabled: true, client, allowedOrigins: ['https://firstfit.example'] };
  const first = await serve(t, config), second = await serve(t, config);
  const response = await post(first, input, 'https://firstfit.example');
  assert.equal(response.status, 202);
  const { id } = await response.json();
  assert.equal(Buffer.from(id, 'base64url').toString('utf8').includes('private-provider-id'), false);
  const resumed = await fetch(`${second}/api/tryons/${id}`);
  assert.equal(resumed.status, 200); assert.equal((await resumed.json()).status, 'success');
  const tampered = (id[0] === 'A' ? 'B' : 'A') + id.slice(1);
  assert.equal((await fetch(`${second}/api/tryons/${tampered}`)).status, 404);
  const wrongKey = await serve(t, { ...config, key: 'different-secret' });
  assert.equal((await fetch(`${wrongKey}/api/tryons/${id}`)).status, 404);
});
