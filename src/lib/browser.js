const memoryStorage = new Map();

export function safeStorageGet(key) {
  try {
    return window.localStorage.getItem(key) || memoryStorage.get(key) || '';
  } catch {
    return memoryStorage.get(key) || '';
  }
}

export function safeStorageSet(key, value) {
  const text = String(value ?? '');
  if (text) memoryStorage.set(key, text);
  else memoryStorage.delete(key);
  try {
    if (text) window.localStorage.setItem(key, text);
    else window.localStorage.removeItem(key);
  } catch {
    // The in-memory fallback keeps the current tab usable when storage is blocked.
  }
}

export function randomBrowserId(prefix = '') {
  const uuid = globalThis.crypto?.randomUUID?.();
  return `${prefix}${uuid || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
}

function configuredPublicOrigin() {
  const configured = String(import.meta.env.VITE_PUBLIC_BASE_URL || '').trim();
  if (!configured) return '';
  try {
    const parsed = new URL(configured);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.origin : '';
  } catch {
    return '';
  }
}

export function publicOrigin() {
  return configuredPublicOrigin() || window.location.origin;
}


export function publicProfilePrefixLabel() {
  try {
    return `${new URL(publicOrigin()).host}/p/`;
  } catch {
    return 'p/';
  }
}

export function publicProfileUrl(username = '') {
  const safeUsername = String(username).trim();
  return `${publicOrigin()}/p/${encodeURIComponent(safeUsername)}`;
}

export function publicProfileLabel(username = '') {
  try {
    const url = new URL(publicProfileUrl(username));
    return `${url.host}/p/${String(username).trim()}`;
  } catch {
    return `p/${String(username).trim()}`;
  }
}

export async function copyText(text) {
  const value = String(text ?? '');
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('Copy is not supported in this browser.');
}
