import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const appVersion = '4.2.0';
const schemaVersion = 2;

function envInteger(name, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}.`);
  }
  return value;
}

const configuredDataPath = process.env.DATA_FILE || './server/data.json';
const dataPath = path.isAbsolute(configuredDataPath) ? configuredDataPath : path.resolve(rootDir, configuredDataPath);
const distDir = path.join(rootDir, 'dist');
const port = envInteger('PORT', 4174, { min: 1, max: 65535 });
const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--production');
const sessionDays = envInteger('SESSION_DAYS', 30, { min: 1, max: 365 });
const maxBodyBytes = 6_000_000;
const maxEmbeddedImageBytes = 220_000;
const maxEmbeddedAvatarBytes = 300_000;
const maxEmbeddedBackgroundBytes = 900_000;
const maxEmbeddedFontBytes = 700_000;
const maxEvents = envInteger('MAX_ANALYTICS_EVENTS', 50_000, { min: 1_000, max: 1_000_000 });

const emptyDb = () => ({ schemaVersion, users: [], sessions: [], profiles: [], links: [], events: [] });
let db = emptyDb();
let writeQueue = Promise.resolve();
const rateBuckets = new Map();

function normalizeDbShape(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    schemaVersion,
    users: Array.isArray(source.users) ? source.users : [],
    sessions: Array.isArray(source.sessions) ? source.sessions : [],
    profiles: Array.isArray(source.profiles) ? source.profiles : [],
    links: Array.isArray(source.links) ? source.links : [],
    events: Array.isArray(source.events) ? source.events : [],
  };
}

function pruneExpiredSessions() {
  const now = Date.now();
  db.sessions = db.sessions.filter((session) => Number.isFinite(new Date(session.expiresAt).getTime()) && new Date(session.expiresAt).getTime() > now);
}

function pruneEvents() {
  if (db.events.length < maxEvents) return;
  db.events = db.events
    .filter((event) => event && typeof event.createdAt === 'string')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(-(maxEvents - 1));
}

async function quarantineCorruptDatabase(error) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${dataPath}.corrupt-${stamp}`;
  try {
    await fs.rename(dataPath, backupPath);
  } catch (renameError) {
    if (renameError.code === 'ENOENT') return;
    try {
      await fs.copyFile(dataPath, backupPath);
      await fs.unlink(dataPath);
    } catch (copyError) {
      console.error('Could not preserve the invalid database file:', copyError);
    }
  }
  console.error(`Database was invalid and moved to ${backupPath}:`, error.message);
}

async function loadDb() {
  try {
    const raw = await fs.readFile(dataPath, 'utf8');
    db = normalizeDbShape(JSON.parse(raw));
  } catch (error) {
    if (error.code !== 'ENOENT') await quarantineCorruptDatabase(error);
    db = emptyDb();
  }

  pruneExpiredSessions();
  pruneEvents();
  db.profiles = db.profiles.map(migrateProfileShape);
  db.links = db.links.map((link, index) => ({
    ...link,
    id: normalizeText(link?.id, 100) || randomId('link_'),
    icon: normalizeIconName(link?.icon, 'link'),
    iconUrl: normalizeImageSource(link?.iconUrl),
    position: Number.isFinite(Number(link?.position)) ? Number(link.position) : index,
  }));
  await persistDb();
}

async function replaceFile(tempPath, targetPath) {
  try {
    await fs.rename(tempPath, targetPath);
    return;
  } catch (error) {
    if (!['EEXIST', 'EPERM', 'ENOTEMPTY'].includes(error.code)) throw error;
  }

  const backupPath = `${targetPath}.replace-backup`;
  await fs.rm(backupPath, { force: true }).catch(() => {});
  let hadOriginal = false;
  try {
    await fs.rename(targetPath, backupPath);
    hadOriginal = true;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  try {
    await fs.rename(tempPath, targetPath);
    if (hadOriginal) await fs.rm(backupPath, { force: true });
  } catch (error) {
    if (hadOriginal) await fs.rename(backupPath, targetPath).catch(() => {});
    throw error;
  }
}

function persistDb() {
  const snapshot = JSON.stringify({ ...db, schemaVersion }, null, 2);
  const operation = writeQueue.then(async () => {
    await fs.mkdir(path.dirname(dataPath), { recursive: true });
    const tempPath = `${dataPath}.${process.pid}.${crypto.randomBytes(5).toString('hex')}.tmp`;
    try {
      await fs.writeFile(tempPath, snapshot, 'utf8');
      await replaceFile(tempPath, dataPath);
    } finally {
      await fs.rm(tempPath, { force: true }).catch(() => {});
    }
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

function securityHeaders() {
  return {
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'cross-origin-opener-policy': 'same-origin',
  };
}

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    ...securityHeaders(),
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  });
  res.end(body);
}

function noContent(res) {
  res.writeHead(204, { ...securityHeaders(), 'cache-control': 'no-store' });
  res.end();
}

function normalizeText(value, max = 120) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function normalizeUsername(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 24);
}

function validUsername(value) {
  return /^[a-z0-9][a-z0-9._-]{2,23}$/.test(value);
}

function normalizeUrl(value) {
  const text = String(value ?? '').trim().slice(0, 2000);
  if (!text) return '';
  try {
    const candidate = /^https?:\/\//i.test(text) ? text : `https://${text}`;
    const parsed = new URL(candidate);
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    if (parsed.username || parsed.password) return '';
    return parsed.toString();
  } catch {
    return '';
  }
}

function normalizeAvatar(value) {
  const text = String(value ?? '').trim().slice(0, 2000);
  if (!text) return '';
  try {
    const parsed = new URL(text);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : '';
  } catch {
    return '';
  }
}

function normalizeImageSource(value, maxEmbeddedBytes = maxEmbeddedImageBytes) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  if (/^data:image\/(png|jpeg|webp|gif);base64,/i.test(text)) {
    const comma = text.indexOf(',');
    const encoded = text.slice(comma + 1);
    if (!/^[a-z0-9+/=\s]+$/i.test(encoded)) return '';
    const bytes = Math.floor(encoded.replace(/\s/g, '').length * 0.75);
    return bytes <= maxEmbeddedBytes ? text : '';
  }
  if (text.length > 2000) return '';
  try {
    const parsed = new URL(text);
    const localHttp = parsed.protocol === 'http:' && ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
    if (parsed.protocol !== 'https:' && !localHttp) return '';
    parsed.username = '';
    parsed.password = '';
    return parsed.toString();
  } catch {
    return '';
  }
}

function normalizeFontSource(value) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  if (/^data:(font\/(woff2?|ttf|otf)|application\/(font-woff|x-font-ttf|vnd\.ms-opentype));base64,/i.test(text)) {
    const comma = text.indexOf(',');
    const encoded = text.slice(comma + 1);
    if (!/^[a-z0-9+/=\s]+$/i.test(encoded)) return '';
    const bytes = Math.floor(encoded.replace(/\s/g, '').length * 0.75);
    return bytes <= maxEmbeddedFontBytes ? text : '';
  }
  if (text.length > 2400) return '';
  try {
    const parsed = new URL(text);
    const localHttp = parsed.protocol === 'http:' && ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
    if (parsed.protocol !== 'https:' && !localHttp) return '';
    if (parsed.username || parsed.password) return '';
    if (!/\.(woff2?|ttf|otf)$/i.test(parsed.pathname)) return '';
    return parsed.toString();
  } catch {
    return '';
  }
}

function normalizeActionUrl(value) {
  const text = String(value ?? '').trim().slice(0, 2000);
  if (!text) return '';
  if (/^mailto:/i.test(text)) {
    const email = text.slice(7).split('?')[0].trim();
    return /^\S+@\S+\.\S+$/.test(email) ? `mailto:${email}` : '';
  }
  return normalizeUrl(text);
}

function normalizeIconName(value, fallback = 'link') {
  const raw = String(value ?? '').trim();
  const legacy = {
    '🔗': 'link', '✨': 'star', '✦': 'star', '▶': 'play', '▶️': 'play',
    '🛍': 'shop', '🛍️': 'shop', '💬': 'message', '🎵': 'music', '📸': 'camera',
    '☕': 'coffee', '📅': 'calendar', '💌': 'mail', '✉': 'mail', '✉️': 'mail',
    ig: 'instagram', tk: 'tiktok', yt: 'youtube', f: 'facebook',
  };
  const mapped = legacy[raw] || raw.toLowerCase();
  return /^[a-z0-9-]{1,24}$/.test(mapped) ? mapped : fallback;
}

function legacySocialUrl(type, value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (/^https?:\/\//i.test(text) || /^mailto:/i.test(text)) return normalizeActionUrl(text);
  const clean = text.replace(/^@/, '');
  if (type === 'instagram') return normalizeActionUrl(`https://instagram.com/${clean}`);
  if (type === 'tiktok') return normalizeActionUrl(`https://tiktok.com/@${clean}`);
  if (type === 'youtube') return normalizeActionUrl(`https://youtube.com/@${clean}`);
  if (type === 'email') return normalizeActionUrl(`mailto:${clean}`);
  return '';
}

function sanitizeSocialLinks(value, fallback = []) {
  const rows = Array.isArray(value) ? value : fallback;
  if (!Array.isArray(rows)) return [];
  const usedIds = new Set();
  return rows.slice(0, 12).map((row, index) => {
    const label = normalizeText(row?.label, 40);
    const url = normalizeActionUrl(row?.url);
    const rawUrl = String(row?.url || '').trim();
    const rawIconUrl = String(row?.iconUrl || '').trim();
    const iconUrl = normalizeImageSource(rawIconUrl);
    if (!label && !rawUrl && !rawIconUrl) return null;
    if (!label) throw Object.assign(new Error(`Social link ${index + 1} needs a label.`), { status: 400 });
    if (!url) throw Object.assign(new Error(`Social link “${label}” needs a valid http(s) or mailto URL.`), { status: 400 });
    if (rawIconUrl && !iconUrl) throw Object.assign(new Error(`Social link “${label}” has an unsafe or oversized icon.`), { status: 400 });
    const requestedId = String(row?.id || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
    let id = requestedId || randomId('social_');
    if (usedIds.has(id)) id = randomId('social_');
    usedIds.add(id);
    return {
      id,
      label,
      url,
      icon: normalizeIconName(row?.icon, 'link'),
      iconUrl,
      enabled: row?.enabled !== false,
    };
  }).filter(Boolean);
}

function migrateProfileShape(value) {
  const profile = value && typeof value === 'object' ? value : {};
  const legacy = profile.socials && typeof profile.socials === 'object' ? profile.socials : {};
  const legacyRows = [
    ['instagram', 'Instagram', 'instagram'],
    ['tiktok', 'TikTok', 'tiktok'],
    ['youtube', 'YouTube', 'youtube'],
    ['email', 'Email', 'mail'],
  ].map(([type, label, icon]) => {
    const url = legacySocialUrl(type, legacy[type]);
    return url ? { id: `legacy_${type}`, label, url, icon, iconUrl: '', enabled: true } : null;
  }).filter(Boolean);
  let socialLinks = [];
  try {
    socialLinks = sanitizeSocialLinks(profile.socialLinks, legacyRows);
  } catch {
    socialLinks = legacyRows;
  }
  const { animal, customAnimalUrl, customAnimalAlt, avatarEmoji, ...cleanProfile } = profile;
  return {
    backgroundStyle: 'glow',
    fontStyle: 'modern',
    fontFamily: 'google',
    customFontName: '',
    customFontUrl: '',
    backgroundImageUrl: '',
    backgroundImageOpacity: 100,
    backgroundImageBlur: 0,
    backgroundImageFit: 'cover',
    backgroundImagePosition: 'center',
    surfaceColor: '#ffffff',
    borderColor: '#ded8f1',
    cardRadius: 18,
    cardBorderWidth: 1,
    cardOpacity: 94,
    cardShadow: 'soft',
    linkLayout: 'stacked',
    socialLinks,
    ...cleanProfile,
    id: normalizeText(profile.id, 100) || randomId('profile_'),
    userId: normalizeText(profile.userId, 100),
    username: normalizeUsername(profile.username),
    displayName: normalizeText(profile.displayName, 60) || normalizeUsername(profile.username) || 'PawLink user',
    bio: normalizeText(profile.bio, 180),
    avatarUrl: normalizeImageSource(profile.avatarUrl, maxEmbeddedAvatarBytes),
    theme: ['berry', 'mint', 'sky', 'sunset', 'sand', 'mono', 'night', 'ocean', 'custom'].includes(profile.theme) ? profile.theme : 'berry',
    accent: /^#[0-9a-f]{6}$/i.test(String(profile.accent)) ? profile.accent : '#6d5dfc',
    background: /^#[0-9a-f]{6}$/i.test(String(profile.background)) ? profile.background : '#f5f1ff',
    textColor: /^#[0-9a-f]{6}$/i.test(String(profile.textColor)) ? profile.textColor : '#241f33',
    buttonStyle: ['soft', 'solid', 'outline', 'pill'].includes(profile.buttonStyle) ? profile.buttonStyle : 'soft',
    published: profile.published !== false,
    backgroundStyle: ['solid', 'gradient', 'glow'].includes(profile.backgroundStyle) ? profile.backgroundStyle : 'glow',
    fontStyle: ['modern', 'rounded', 'editorial'].includes(profile.fontStyle) ? profile.fontStyle : 'modern',
    fontFamily: ['google', 'system', 'sans', 'rounded', 'serif', 'mono', 'khmer', 'custom'].includes(profile.fontFamily) ? profile.fontFamily : 'google',
    customFontName: normalizeText(profile.customFontName, 40),
    customFontUrl: normalizeFontSource(profile.customFontUrl),
    backgroundImageUrl: normalizeImageSource(profile.backgroundImageUrl, maxEmbeddedBackgroundBytes),
    backgroundImageOpacity: Math.min(100, Math.max(10, Number(profile.backgroundImageOpacity) || 100)),
    backgroundImageBlur: Math.min(20, Math.max(0, Number(profile.backgroundImageBlur) || 0)),
    backgroundImageFit: ['cover', 'contain'].includes(profile.backgroundImageFit) ? profile.backgroundImageFit : 'cover',
    backgroundImagePosition: ['center', 'top', 'bottom', 'left', 'right'].includes(profile.backgroundImagePosition) ? profile.backgroundImagePosition : 'center',
    surfaceColor: /^#[0-9a-f]{6}$/i.test(String(profile.surfaceColor)) ? profile.surfaceColor : '#ffffff',
    borderColor: /^#[0-9a-f]{6}$/i.test(String(profile.borderColor)) ? profile.borderColor : '#ded8f1',
    cardRadius: Math.min(36, Math.max(0, Number.isFinite(Number(profile.cardRadius)) ? Number(profile.cardRadius) : 18)),
    cardBorderWidth: Math.min(4, Math.max(0, Number.isFinite(Number(profile.cardBorderWidth)) ? Number(profile.cardBorderWidth) : 1)),
    cardOpacity: Math.min(100, Math.max(45, Number(profile.cardOpacity) || 94)),
    cardShadow: ['none', 'soft', 'strong'].includes(profile.cardShadow) ? profile.cardShadow : 'soft',
    linkLayout: ['stacked', 'compact'].includes(profile.linkLayout) ? profile.linkLayout : 'stacked',
    socialLinks,
  };
}

function scryptBuffer(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

async function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = await scryptBuffer(password, salt);
  return `${salt}:${hash.toString('hex')}`;
}

async function verifyPassword(password, stored) {
  try {
    const [salt, expectedHex, extra] = String(stored || '').split(':');
    if (!salt || !expectedHex || extra || !/^[a-f0-9]+$/i.test(expectedHex)) return false;
    const actual = await scryptBuffer(password, salt);
    const expected = Buffer.from(expectedHex, 'hex');
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function randomId(prefix = '') {
  return `${prefix}${crypto.randomUUID()}`;
}

function makeToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0])?.trim() || req.socket.remoteAddress || 'unknown';
}

function rateLimit(req, key, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  if (rateBuckets.size > 5_000) {
    for (const [bucket, value] of rateBuckets) {
      if (value.resetAt <= now) rateBuckets.delete(bucket);
    }
  }
  const bucketKey = `${key}:${clientIp(req)}`;
  const current = rateBuckets.get(bucketKey);
  if (!current || current.resetAt <= now) {
    rateBuckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return true;
  }
  current.count += 1;
  return current.count <= limit;
}

async function readJson(req) {
  let total = 0;
  const chunks = [];
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBodyBytes) throw Object.assign(new Error('Request body is too large.'), { status: 413 });
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw Object.assign(new Error('Invalid JSON body.'), { status: 400 });
  }
}

function getBearer(req) {
  const auth = req.headers.authorization || '';
  return auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
}

function authUser(req) {
  pruneExpiredSessions();
  const token = getBearer(req);
  if (!token) return null;
  const tokenHash = hashToken(token);
  const session = db.sessions.find((item) => item.tokenHash === tokenHash && new Date(item.expiresAt).getTime() > Date.now());
  return session ? db.users.find((user) => user.id === session.userId) || null : null;
}

function requireUser(req, res) {
  const user = authUser(req);
  if (!user) {
    json(res, 401, { error: 'Please sign in again.' });
    return null;
  }
  return user;
}

function profileFor(userId) {
  return db.profiles.find((profile) => profile.userId === userId);
}

function linksFor(userId) {
  return db.links.filter((link) => link.userId === userId).sort((a, b) => a.position - b.position);
}

function publicProfile(profile) {
  return {
    username: profile.username,
    displayName: profile.displayName,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    theme: profile.theme,
    accent: profile.accent,
    background: profile.background,
    textColor: profile.textColor,
    buttonStyle: profile.buttonStyle,
    backgroundStyle: profile.backgroundStyle || 'glow',
    fontStyle: profile.fontStyle || 'modern',
    fontFamily: profile.fontFamily || 'google',
    customFontName: profile.customFontName || '',
    customFontUrl: profile.customFontUrl || '',
    backgroundImageUrl: profile.backgroundImageUrl || '',
    backgroundImageOpacity: profile.backgroundImageOpacity ?? 100,
    backgroundImageBlur: profile.backgroundImageBlur ?? 0,
    backgroundImageFit: profile.backgroundImageFit || 'cover',
    backgroundImagePosition: profile.backgroundImagePosition || 'center',
    surfaceColor: profile.surfaceColor || '#ffffff',
    borderColor: profile.borderColor || '#ded8f1',
    cardRadius: profile.cardRadius ?? 18,
    cardBorderWidth: profile.cardBorderWidth ?? 1,
    cardOpacity: profile.cardOpacity ?? 94,
    cardShadow: profile.cardShadow || 'soft',
    linkLayout: profile.linkLayout || 'stacked',
    socialLinks: Array.isArray(profile.socialLinks) ? profile.socialLinks : [],
    socials: profile.socials,
  };
}

function analyticsFor(userId) {
  const events = db.events.filter((event) => event.userId === userId);
  const views = events.filter((event) => event.type === 'view');
  const clicks = events.filter((event) => event.type === 'click');
  const last7 = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - offset);
    const key = date.toISOString().slice(0, 10);
    last7.push({
      date: key,
      views: views.filter((event) => event.createdAt.slice(0, 10) === key).length,
      clicks: clicks.filter((event) => event.createdAt.slice(0, 10) === key).length,
    });
  }
  const clickByLink = new Map();
  for (const event of clicks) clickByLink.set(event.linkId, (clickByLink.get(event.linkId) || 0) + 1);
  const topLinks = linksFor(userId).map((link) => ({ id: link.id, title: link.title, clicks: clickByLink.get(link.id) || 0 })).sort((a, b) => b.clicks - a.clicks);
  const sources = {};
  const devices = {};
  for (const event of views) {
    sources[event.source || 'Direct'] = (sources[event.source || 'Direct'] || 0) + 1;
    devices[event.device || 'Desktop'] = (devices[event.device || 'Desktop'] || 0) + 1;
  }
  return {
    totals: { views: views.length, clicks: clicks.length, ctr: views.length ? Math.round((clicks.length / views.length) * 1000) / 10 : 0 },
    last7,
    topLinks,
    sources,
    devices,
  };
}

function sourceFrom(req, suppliedReferrer = '') {
  const raw = String(suppliedReferrer || req.headers.referer || '');
  if (!raw) return 'Direct';
  try {
    const host = new URL(raw).hostname.toLowerCase();
    if (host.includes('instagram')) return 'Instagram';
    if (host.includes('tiktok')) return 'TikTok';
    if (host.includes('facebook')) return 'Facebook';
    if (host.includes('youtube')) return 'YouTube';
    if (host.includes('google')) return 'Google';
    return host;
  } catch {
    return 'Direct';
  }
}

function deviceFrom(req) {
  const ua = String(req.headers['user-agent'] || '').toLowerCase();
  if (/ipad|tablet/.test(ua)) return 'Tablet';
  if (/mobile|android|iphone/.test(ua)) return 'Mobile';
  return 'Desktop';
}

function createDefaultProfile(userId, email, username, displayName) {
  return {
    id: randomId('profile_'),
    userId,
    username,
    displayName: displayName || username,
    bio: 'Creator, maker, and collector of good ideas.',
    avatarUrl: '',
    theme: 'berry',
    accent: '#6d5dfc',
    background: '#f5f1ff',
    textColor: '#241f33',
    buttonStyle: 'soft',
    backgroundStyle: 'glow',
    fontStyle: 'modern',
    fontFamily: 'google',
    customFontName: '',
    customFontUrl: '',
    backgroundImageUrl: '',
    backgroundImageOpacity: 100,
    backgroundImageBlur: 0,
    backgroundImageFit: 'cover',
    backgroundImagePosition: 'center',
    surfaceColor: '#ffffff',
    borderColor: '#ded8f1',
    cardRadius: 18,
    cardBorderWidth: 1,
    cardOpacity: 94,
    cardShadow: 'soft',
    linkLayout: 'stacked',
    socials: { instagram: '', tiktok: '', youtube: '', email },
    socialLinks: [{ id: randomId('social_'), label: 'Email', url: `mailto:${email}`, icon: 'mail', iconUrl: '', enabled: true }],
    published: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function seedLinks(userId) {
  const now = new Date().toISOString();
  return [
    { id: randomId('link_'), userId, title: 'My latest work', subtitle: 'See what I have been creating', url: 'https://example.com', icon: 'star', iconUrl: '', enabled: true, position: 0, createdAt: now, updatedAt: now },
    { id: randomId('link_'), userId, title: 'Join my community', subtitle: 'News, updates, and friendly people', url: 'https://example.com/community', icon: 'message', iconUrl: '', enabled: true, position: 1, createdAt: now, updatedAt: now },
  ];
}

function sanitizeProfilePatch(body, current) {
  const username = normalizeUsername(body.username ?? current.username);
  if (!validUsername(username)) throw Object.assign(new Error('Username must be 3–24 characters and use letters, numbers, dots, underscores, or hyphens.'), { status: 400 });
  const duplicate = db.profiles.find((profile) => profile.username === username && profile.userId !== current.userId);
  if (duplicate) throw Object.assign(new Error('That username is already taken.'), { status: 409 });
  const themeOptions = ['berry', 'mint', 'sky', 'sunset', 'sand', 'mono', 'night', 'ocean', 'custom'];
  const buttonOptions = ['soft', 'solid', 'outline', 'pill'];
  const backgroundOptions = ['solid', 'gradient', 'glow'];
  const fontOptions = ['modern', 'rounded', 'editorial'];
  const fontFamilyOptions = ['google', 'system', 'sans', 'rounded', 'serif', 'mono', 'khmer', 'custom'];
  const layoutOptions = ['stacked', 'compact'];
  const imageFitOptions = ['cover', 'contain'];
  const imagePositionOptions = ['center', 'top', 'bottom', 'left', 'right'];
  const shadowOptions = ['none', 'soft', 'strong'];
  const numberInRange = (value, fallback, min, max) => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
  };
  const hex = (value, fallback) => /^#[0-9a-f]{6}$/i.test(String(value)) ? String(value) : fallback;
  const socials = body.socials && typeof body.socials === 'object' ? body.socials : current.socials;
  const socialLinks = sanitizeSocialLinks(body.socialLinks, current.socialLinks || []);
  const rawAvatarUrl = String(body.avatarUrl ?? current.avatarUrl ?? '').trim();
  const avatarUrl = normalizeImageSource(rawAvatarUrl, maxEmbeddedAvatarBytes);
  if (rawAvatarUrl && !avatarUrl) throw Object.assign(new Error('The profile image is unsafe or too large.'), { status: 400 });
  const rawBackgroundImageUrl = String(body.backgroundImageUrl ?? current.backgroundImageUrl ?? '').trim();
  const backgroundImageUrl = normalizeImageSource(rawBackgroundImageUrl, maxEmbeddedBackgroundBytes);
  if (rawBackgroundImageUrl && !backgroundImageUrl) throw Object.assign(new Error('The background image is unsafe or too large.'), { status: 400 });
  const rawCustomFontUrl = String(body.customFontUrl ?? current.customFontUrl ?? '').trim();
  const customFontUrl = normalizeFontSource(rawCustomFontUrl);
  if (rawCustomFontUrl && !customFontUrl) throw Object.assign(new Error('Use a direct HTTPS WOFF2, WOFF, TTF, or OTF font URL, or import a font file.'), { status: 400 });
  const nextFontFamily = fontFamilyOptions.includes(body.fontFamily) ? body.fontFamily : (current.fontFamily || 'google');
  if (nextFontFamily === 'custom' && !customFontUrl) throw Object.assign(new Error('Import a font file or add a direct font URL before using the custom font option.'), { status: 400 });
  return {
    ...current,
    username,
    displayName: normalizeText(body.displayName ?? current.displayName, 60) || username,
    bio: normalizeText(body.bio ?? current.bio, 180),
    avatarUrl,
    theme: themeOptions.includes(body.theme) ? body.theme : current.theme,
    accent: hex(body.accent, current.accent),
    background: hex(body.background, current.background),
    textColor: hex(body.textColor, current.textColor),
    buttonStyle: buttonOptions.includes(body.buttonStyle) ? body.buttonStyle : current.buttonStyle,
    backgroundStyle: backgroundOptions.includes(body.backgroundStyle) ? body.backgroundStyle : (current.backgroundStyle || 'glow'),
    fontStyle: fontOptions.includes(body.fontStyle) ? body.fontStyle : (current.fontStyle || 'modern'),
    fontFamily: nextFontFamily,
    customFontName: normalizeText(body.customFontName ?? current.customFontName, 40),
    customFontUrl,
    backgroundImageUrl,
    backgroundImageOpacity: numberInRange(body.backgroundImageOpacity, current.backgroundImageOpacity ?? 100, 10, 100),
    backgroundImageBlur: numberInRange(body.backgroundImageBlur, current.backgroundImageBlur ?? 0, 0, 20),
    backgroundImageFit: imageFitOptions.includes(body.backgroundImageFit) ? body.backgroundImageFit : (current.backgroundImageFit || 'cover'),
    backgroundImagePosition: imagePositionOptions.includes(body.backgroundImagePosition) ? body.backgroundImagePosition : (current.backgroundImagePosition || 'center'),
    surfaceColor: hex(body.surfaceColor, current.surfaceColor || '#ffffff'),
    borderColor: hex(body.borderColor, current.borderColor || '#ded8f1'),
    cardRadius: numberInRange(body.cardRadius, current.cardRadius ?? 18, 0, 36),
    cardBorderWidth: numberInRange(body.cardBorderWidth, current.cardBorderWidth ?? 1, 0, 4),
    cardOpacity: numberInRange(body.cardOpacity, current.cardOpacity ?? 94, 45, 100),
    cardShadow: shadowOptions.includes(body.cardShadow) ? body.cardShadow : (current.cardShadow || 'soft'),
    linkLayout: layoutOptions.includes(body.linkLayout) ? body.linkLayout : (current.linkLayout || 'stacked'),
    published: typeof body.published === 'boolean' ? body.published : current.published,
    socials: {
      instagram: normalizeText(socials?.instagram, 80),
      tiktok: normalizeText(socials?.tiktok, 80),
      youtube: normalizeText(socials?.youtube, 120),
      email: normalizeText(socials?.email, 120),
    },
    socialLinks,
    updatedAt: new Date().toISOString(),
  };
}

async function handleApi(req, res, url) {
  const method = req.method || 'GET';

  if (method === 'GET' && url.pathname === '/api/health') return json(res, 200, { ok: true, service: 'pawlink-api', version: appVersion, schemaVersion });

  if (method === 'POST' && url.pathname === '/api/auth/signup') {
    if (!rateLimit(req, 'signup', 8, 10 * 60_000)) return json(res, 429, { error: 'Too many signup attempts. Try again later.' });
    const body = await readJson(req);
    const email = normalizeText(body.email, 160).toLowerCase();
    const password = String(body.password || '');
    const displayName = normalizeText(body.displayName, 60);
    const username = normalizeUsername(body.username || email.split('@')[0]);
    if (!/^\S+@\S+\.\S+$/.test(email)) return json(res, 400, { error: 'Enter a valid email address.' });
    if (password.length < 8 || password.length > 128) return json(res, 400, { error: 'Password must be 8–128 characters.' });
    if (!validUsername(username)) return json(res, 400, { error: 'Choose a username with 3–24 valid characters.' });
    if (db.users.some((user) => user.email === email)) return json(res, 409, { error: 'An account already uses this email.' });
    if (db.profiles.some((profile) => profile.username === username)) return json(res, 409, { error: 'That username is already taken.' });
    const user = { id: randomId('user_'), email, passwordHash: await hashPassword(password), createdAt: new Date().toISOString() };
    db.users.push(user);
    db.profiles.push(createDefaultProfile(user.id, email, username, displayName));
    db.links.push(...seedLinks(user.id));
    const token = makeToken();
    pruneExpiredSessions();
    db.sessions.push({ id: randomId('session_'), userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + sessionDays * 86_400_000).toISOString(), createdAt: new Date().toISOString() });
    await persistDb();
    return json(res, 201, { token });
  }

  if (method === 'POST' && url.pathname === '/api/auth/login') {
    if (!rateLimit(req, 'login', 12, 10 * 60_000)) return json(res, 429, { error: 'Too many login attempts. Try again later.' });
    const body = await readJson(req);
    const email = normalizeText(body.email, 160).toLowerCase();
    const password = String(body.password || '');
    const user = db.users.find((item) => item.email === email);
    if (!user || !(await verifyPassword(password, user.passwordHash))) return json(res, 401, { error: 'Email or password is incorrect.' });
    const token = makeToken();
    pruneExpiredSessions();
    db.sessions = db.sessions.filter((session) => session.userId !== user.id);
    db.sessions.push({ id: randomId('session_'), userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + sessionDays * 86_400_000).toISOString(), createdAt: new Date().toISOString() });
    await persistDb();
    return json(res, 200, { token });
  }

  if (method === 'POST' && url.pathname === '/api/auth/logout') {
    const token = getBearer(req);
    if (token) db.sessions = db.sessions.filter((session) => session.tokenHash !== hashToken(token));
    await persistDb();
    return noContent(res);
  }

  if (method === 'GET' && url.pathname === '/api/me') {
    const user = requireUser(req, res); if (!user) return;
    let profile = profileFor(user.id);
    if (!profile) {
      let username = normalizeUsername(user.email?.split('@')[0]) || 'user';
      let suffix = 1;
      while (!validUsername(username) || db.profiles.some((item) => item.username === username)) {
        username = `${normalizeUsername(user.email?.split('@')[0]) || 'user'}${suffix}`.slice(0, 24);
        suffix += 1;
      }
      profile = createDefaultProfile(user.id, user.email, username, username);
      db.profiles.push(profile);
      await persistDb();
    }
    return json(res, 200, { user: { id: user.id, email: user.email }, profile, links: linksFor(user.id), analytics: analyticsFor(user.id) });
  }

  if (method === 'PUT' && url.pathname === '/api/profile') {
    const user = requireUser(req, res); if (!user) return;
    const body = await readJson(req);
    const current = profileFor(user.id);
    if (!current) return json(res, 404, { error: 'Profile not found. Reload the dashboard to repair it.' });
    const next = sanitizeProfilePatch(body, current);
    db.profiles = db.profiles.map((profile) => profile.userId === user.id ? next : profile);
    await persistDb();
    return json(res, 200, { profile: next });
  }

  if (method === 'POST' && url.pathname === '/api/links') {
    const user = requireUser(req, res); if (!user) return;
    const body = await readJson(req);
    const urlValue = normalizeUrl(body.url);
    const title = normalizeText(body.title, 80);
    if (!title) return json(res, 400, { error: 'Link title is required.' });
    if (!urlValue) return json(res, 400, { error: 'Enter a valid http or https URL.' });
    if (linksFor(user.id).length >= 50) return json(res, 400, { error: 'You can add up to 50 links.' });
    const rawIconUrl = String(body.iconUrl || '').trim();
    const iconUrl = normalizeImageSource(rawIconUrl);
    if (rawIconUrl && !iconUrl) return json(res, 400, { error: 'The link icon is unsafe or too large.' });
    const now = new Date().toISOString();
    const link = { id: randomId('link_'), userId: user.id, title, subtitle: normalizeText(body.subtitle, 120), url: urlValue, icon: normalizeIconName(body.icon, 'link'), iconUrl, enabled: body.enabled !== false, position: linksFor(user.id).length, createdAt: now, updatedAt: now };
    db.links.push(link);
    await persistDb();
    return json(res, 201, { link });
  }

  const linkMatch = url.pathname.match(/^\/api\/links\/([^/]+)$/);
  if (linkMatch && method === 'PUT') {
    const user = requireUser(req, res); if (!user) return;
    const current = db.links.find((link) => link.id === linkMatch[1] && link.userId === user.id);
    if (!current) return json(res, 404, { error: 'Link not found.' });
    const body = await readJson(req);
    const nextUrl = body.url === undefined ? current.url : normalizeUrl(body.url);
    const nextTitle = body.title === undefined ? current.title : normalizeText(body.title, 80);
    if (!nextTitle || !nextUrl) return json(res, 400, { error: 'A valid title and URL are required.' });
    const rawIconUrl = body.iconUrl === undefined ? String(current.iconUrl || '') : String(body.iconUrl || '').trim();
    const nextIconUrl = normalizeImageSource(rawIconUrl);
    if (rawIconUrl && !nextIconUrl) return json(res, 400, { error: 'The link icon is unsafe or too large.' });
    const next = { ...current, title: nextTitle, subtitle: body.subtitle === undefined ? current.subtitle : normalizeText(body.subtitle, 120), url: nextUrl, icon: body.icon === undefined ? current.icon : normalizeIconName(body.icon, 'link'), iconUrl: nextIconUrl, enabled: typeof body.enabled === 'boolean' ? body.enabled : current.enabled, updatedAt: new Date().toISOString() };
    db.links = db.links.map((link) => link.id === current.id ? next : link);
    await persistDb();
    return json(res, 200, { link: next });
  }

  if (linkMatch && method === 'DELETE') {
    const user = requireUser(req, res); if (!user) return;
    const exists = db.links.some((link) => link.id === linkMatch[1] && link.userId === user.id);
    if (!exists) return json(res, 404, { error: 'Link not found.' });
    db.links = db.links.filter((link) => !(link.id === linkMatch[1] && link.userId === user.id));
    linksFor(user.id).forEach((link, index) => { link.position = index; });
    await persistDb();
    return noContent(res);
  }

  if (method === 'POST' && url.pathname === '/api/links/reorder') {
    const user = requireUser(req, res); if (!user) return;
    const body = await readJson(req);
    const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
    const owned = linksFor(user.id);
    const ownedIds = new Set(owned.map((link) => link.id));
    const uniqueIds = new Set(ids);
    if (ids.length !== owned.length || uniqueIds.size !== ids.length || ids.some((id) => !ownedIds.has(id))) return json(res, 400, { error: 'Invalid link order.' });
    ids.forEach((id, index) => { const link = db.links.find((item) => item.id === id); link.position = index; });
    await persistDb();
    return json(res, 200, { links: linksFor(user.id) });
  }

  const publicMatch = url.pathname.match(/^\/api\/public\/([a-z0-9._-]+)$/);
  if (publicMatch && method === 'GET') {
    const publicUsername = normalizeUsername(publicMatch[1]);
    const profile = db.profiles.find((item) => item.username === publicUsername && item.published);
    if (!profile) return json(res, 404, { error: 'This page is not available.' });
    return json(res, 200, { profile: publicProfile(profile), links: linksFor(profile.userId).filter((link) => link.enabled).map(({ userId, ...link }) => link) });
  }

  if (method === 'POST' && url.pathname === '/api/track/view') {
    if (!rateLimit(req, 'track-view', 120, 60_000)) return noContent(res);
    const body = await readJson(req);
    const profile = db.profiles.find((item) => item.username === normalizeUsername(body.username) && item.published);
    if (!profile) return noContent(res);
    const visitor = normalizeText(req.headers['x-paw-visitor'], 80) || crypto.createHash('sha256').update(clientIp(req)).digest('hex').slice(0, 24);
    const today = new Date().toISOString().slice(0, 10);
    const duplicate = db.events.some((event) => event.type === 'view' && event.userId === profile.userId && event.visitor === visitor && event.createdAt.startsWith(today));
    if (!duplicate) {
      pruneEvents();
      db.events.push({ id: randomId('event_'), userId: profile.userId, type: 'view', visitor, source: sourceFrom(req, body.referrer), device: deviceFrom(req), createdAt: new Date().toISOString() });
      await persistDb();
    }
    return noContent(res);
  }

  if (method === 'POST' && url.pathname === '/api/track/click') {
    if (!rateLimit(req, 'track-click', 180, 60_000)) return noContent(res);
    const body = await readJson(req);
    const profile = db.profiles.find((item) => item.username === normalizeUsername(body.username) && item.published);
    const link = profile && db.links.find((item) => item.id === String(body.linkId) && item.userId === profile.userId && item.enabled);
    if (!profile || !link) return noContent(res);
    const visitor = normalizeText(req.headers['x-paw-visitor'], 80) || 'anonymous';
    pruneEvents();
    db.events.push({ id: randomId('event_'), userId: profile.userId, linkId: link.id, type: 'click', visitor, source: sourceFrom(req), device: deviceFrom(req), createdAt: new Date().toISOString() });
    await persistDb();
    return noContent(res);
  }

  return json(res, 404, { error: 'API route not found.' });
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf',
};

async function serveStatic(req, res, url) {
  let requestPath;
  try {
    requestPath = decodeURIComponent(url.pathname);
  } catch {
    return json(res, 400, { error: 'Invalid URL encoding.' });
  }
  if (requestPath === '/') requestPath = '/index.html';
  const candidate = path.normalize(path.join(distDir, requestPath));
  if (candidate !== distDir && !candidate.startsWith(`${distDir}${path.sep}`)) return json(res, 403, { error: 'Forbidden.' });
  try {
    const stat = await fs.stat(candidate);
    if (stat.isFile()) {
      const body = await fs.readFile(candidate);
      const ext = path.extname(candidate);
      const immutableAsset = requestPath.startsWith('/assets/');
      res.writeHead(200, {
        ...securityHeaders(),
        'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
        'content-type': mimeTypes[ext] || 'application/octet-stream',
        'content-length': body.length,
        'cache-control': ext === '.html' ? 'no-cache' : immutableAsset ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
      });
      return res.end(body);
    }
  } catch { /* SPA fallback below */ }
  try {
    const body = await fs.readFile(path.join(distDir, 'index.html'));
    res.writeHead(200, { ...securityHeaders(), 'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'", 'content-type': 'text/html; charset=utf-8', 'content-length': body.length, 'cache-control': 'no-cache' });
    return res.end(body);
  } catch {
    return json(res, 503, { error: 'Frontend is not built. Run npm run build first.' });
  }
}

await loadDb();

if (isProduction) {
  try {
    await fs.access(path.join(distDir, 'index.html'));
  } catch {
    throw new Error('Production frontend is missing. Run npm run build before npm start.');
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  try {
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    if (isProduction) return await serveStatic(req, res, url);
    return json(res, 404, { error: 'Use the Vite development server at http://localhost:5173.' });
  } catch (error) {
    if (!error.status || error.status >= 500) console.error(error);
    return json(res, error.status || 500, { error: error.status ? error.message : 'Unexpected server error.' });
  }
});

server.on('error', (error) => {
  console.error('PawLink API failed:', error);
  process.exitCode = 1;
});

server.listen(port, () => console.log(`PawLink API v${appVersion} listening on http://localhost:${port}`));

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n${signal} received. Saving data and closing the server…`);
  const forceTimer = setTimeout(() => process.exit(1), 8_000);
  forceTimer.unref();
  try {
    await writeQueue;
    await new Promise((resolve) => server.close(resolve));
    process.exitCode = 0;
  } catch (error) {
    console.error('Graceful shutdown failed:', error);
    process.exitCode = 1;
  } finally {
    clearTimeout(forceTimer);
  }
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
