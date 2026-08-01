import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

async function startApi(dataFile) {
  const port = await freePort();
  const output = [];
  const child = spawn(process.execPath, ['server/index.mjs'], {
    cwd: rootDir,
    env: {
      ...process.env,
      PORT: String(port),
      DATA_FILE: dataFile,
      SESSION_DAYS: '7',
      MAX_ANALYTICS_EVENTS: '2000',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  child.stdout.on('data', (chunk) => output.push(chunk.toString()));
  child.stderr.on('data', (chunk) => output.push(chunk.toString()));

  const baseUrl = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`API exited during startup.\n${output.join('')}`);
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return { child, baseUrl, output };
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  child.kill('SIGTERM');
  throw new Error(`API did not start.\n${output.join('')}`);
}

async function stopApi(instance) {
  if (!instance?.child || instance.child.exitCode !== null) return;
  instance.child.kill('SIGTERM');
  await Promise.race([
    new Promise((resolve) => instance.child.once('exit', resolve)),
    new Promise((resolve) => setTimeout(resolve, 3000)),
  ]);
  if (instance.child.exitCode === null) instance.child.kill('SIGKILL');
}

async function apiRequest(baseUrl, pathname, { method = 'GET', token = '', body, headers = {} } = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = response.status === 204 ? null : await response.json().catch(() => ({}));
  return { response, payload };
}

test('PawLink API persists profiles, validates media, tracks analytics, and protects link ordering', { concurrency: false }, async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'pawlink-api-'));
  const dataFile = path.join(directory, 'data.json');
  let api;

  try {
    api = await startApi(dataFile);
    const health = await apiRequest(api.baseUrl, '/api/health');
    assert.equal(health.response.status, 200);
    assert.equal(health.payload.version, '4.2.0');

    const signup = await apiRequest(api.baseUrl, '/api/auth/signup', {
      method: 'POST',
      body: {
        email: 'creator@example.com',
        password: 'correct-horse-battery',
        displayName: 'Test Creator',
        username: 'testcreator',
      },
    });
    assert.equal(signup.response.status, 201, JSON.stringify(signup.payload));
    const token = signup.payload.token;
    assert.ok(token);

    const initialProfile = await apiRequest(api.baseUrl, '/api/me', { token });
    assert.equal(initialProfile.response.status, 200);
    assert.equal(initialProfile.payload.profile.fontFamily, 'google');

    const profileUpdate = await apiRequest(api.baseUrl, '/api/profile', {
      method: 'PUT',
      token,
      body: {
        displayName: 'Updated Creator',
        theme: 'custom',
        accent: '#14532d',
        background: '#f0fdf4',
        textColor: '#052e16',
        surfaceColor: '#ffffff',
        borderColor: '#86efac',
        backgroundImageUrl: 'https://example.com/background.webp',
        fontFamily: 'custom',
        customFontName: 'Brand Sans',
        customFontUrl: 'https://example.com/brand.woff2',
        cardRadius: 0,
        cardBorderWidth: 2,
      },
    });
    assert.equal(profileUpdate.response.status, 200, JSON.stringify(profileUpdate.payload));
    assert.equal(profileUpdate.payload.profile.cardRadius, 0);
    assert.equal(profileUpdate.payload.profile.theme, 'custom');

    const unsafeAvatar = await apiRequest(api.baseUrl, '/api/profile', {
      method: 'PUT',
      token,
      body: { avatarUrl: 'javascript:alert(1)' },
    });
    assert.equal(unsafeAvatar.response.status, 400);

    const badFont = await apiRequest(api.baseUrl, '/api/profile', {
      method: 'PUT',
      token,
      body: { fontFamily: 'custom', customFontUrl: 'https://example.com/fonts.css' },
    });
    assert.equal(badFont.response.status, 400);

    const newLink = await apiRequest(api.baseUrl, '/api/links', {
      method: 'POST',
      token,
      body: { title: 'Portfolio', url: 'https://example.com/portfolio', icon: 'globe' },
    });
    assert.equal(newLink.response.status, 201);

    const meBeforeReorder = await apiRequest(api.baseUrl, '/api/me', { token });
    assert.equal(meBeforeReorder.response.status, 200);
    const ids = meBeforeReorder.payload.links.map((link) => link.id);
    assert.ok(ids.length >= 3);

    const invalidReorder = await apiRequest(api.baseUrl, '/api/links/reorder', {
      method: 'POST',
      token,
      body: { ids: ids.map(() => ids[0]) },
    });
    assert.equal(invalidReorder.response.status, 400);

    const validReorder = await apiRequest(api.baseUrl, '/api/links/reorder', {
      method: 'POST',
      token,
      body: { ids: [...ids].reverse() },
    });
    assert.equal(validReorder.response.status, 200);
    assert.deepEqual(validReorder.payload.links.map((link) => link.id), [...ids].reverse());

    const publicPage = await apiRequest(api.baseUrl, '/api/public/testcreator');
    assert.equal(publicPage.response.status, 200);
    assert.equal(publicPage.payload.profile.displayName, 'Updated Creator');
    assert.equal(publicPage.payload.profile.customFontUrl, 'https://example.com/brand.woff2');

    const visitorHeaders = { 'x-paw-visitor': 'integration-test-visitor' };
    await apiRequest(api.baseUrl, '/api/track/view', { method: 'POST', headers: visitorHeaders, body: { username: 'testcreator' } });
    await apiRequest(api.baseUrl, '/api/track/view', { method: 'POST', headers: visitorHeaders, body: { username: 'testcreator' } });
    await apiRequest(api.baseUrl, '/api/track/click', { method: 'POST', headers: visitorHeaders, body: { username: 'testcreator', linkId: ids[0] } });

    const analytics = await apiRequest(api.baseUrl, '/api/me', { token });
    assert.equal(analytics.payload.analytics.totals.views, 1);
    assert.equal(analytics.payload.analytics.totals.clicks, 1);

    await stopApi(api);
    api = null;

    const persisted = JSON.parse(await readFile(dataFile, 'utf8'));
    assert.equal(persisted.schemaVersion, 2);
    assert.equal(persisted.profiles[0].displayName, 'Updated Creator');

    api = await startApi(dataFile);
    const afterRestart = await apiRequest(api.baseUrl, '/api/me', { token });
    assert.equal(afterRestart.response.status, 200);
    assert.equal(afterRestart.payload.profile.displayName, 'Updated Creator');
    assert.equal(afterRestart.payload.analytics.totals.views, 1);
  } finally {
    await stopApi(api);
    await rm(directory, { recursive: true, force: true });
  }
});

test('invalid JSON database is preserved before recovery', { concurrency: false }, async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'pawlink-corrupt-'));
  const dataFile = path.join(directory, 'data.json');
  let api;
  try {
    await writeFile(dataFile, '{not valid json', 'utf8');
    api = await startApi(dataFile);
    const files = await readdir(directory);
    assert.ok(files.some((name) => name.startsWith('data.json.corrupt-')));
    const recovered = JSON.parse(await readFile(dataFile, 'utf8'));
    assert.equal(recovered.schemaVersion, 2);
    assert.deepEqual(recovered.users, []);
  } finally {
    await stopApi(api);
    await rm(directory, { recursive: true, force: true });
  }
});
