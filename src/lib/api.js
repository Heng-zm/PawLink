import { randomBrowserId, safeStorageGet, safeStorageSet } from './browser.js';

const tokenKey = 'pawlink_token';
const visitorKey = 'pawlink_visitor';
const defaultTimeoutMs = 15_000;

function getVisitorId() {
  let value = safeStorageGet(visitorKey);
  if (!value) {
    value = randomBrowserId('visitor_');
    safeStorageSet(visitorKey, value);
  }
  return value;
}

export function getToken() {
  return safeStorageGet(tokenKey);
}

export function setToken(token) {
  safeStorageSet(tokenKey, token || '');
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body !== undefined && !headers['content-type']) headers['content-type'] = 'application/json';
  const token = getToken();
  if (token) headers.authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timeoutMs = Number(options.timeoutMs) || defaultTimeoutMs;
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(path, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
    if (response.status === 204) return null;
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error || `Request failed with status ${response.status}.`);
      error.status = response.status;
      throw error;
    }
    return payload;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('The server took too long to respond. Please try again.');
    if (error instanceof TypeError) throw new Error('Could not reach the server. Check that the API is running.');
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

function sendTracking(path, payload) {
  const body = JSON.stringify(payload);
  const headers = { 'content-type': 'application/json', 'x-paw-visitor': getVisitorId() };
  return request(path, { method: 'POST', keepalive: true, timeoutMs: 5_000, headers, body });
}

export const api = {
  signup: (body) => request('/api/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  me: () => request('/api/me'),
  saveProfile: (body) => request('/api/profile', { method: 'PUT', body: JSON.stringify(body) }),
  addLink: (body) => request('/api/links', { method: 'POST', body: JSON.stringify(body) }),
  updateLink: (id, body) => request(`/api/links/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteLink: (id) => request(`/api/links/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  reorderLinks: (ids) => request('/api/links/reorder', { method: 'POST', body: JSON.stringify({ ids }) }),
  publicProfile: (username) => request(`/api/public/${encodeURIComponent(username)}`),
  trackView: (username) => sendTracking('/api/track/view', { username, referrer: document.referrer || '' }),
  trackClick: (username, linkId) => sendTracking('/api/track/click', { username, linkId }),
};
