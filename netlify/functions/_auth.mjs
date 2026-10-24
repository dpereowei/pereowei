import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const SESSION_COOKIE = '__Host-pereowei_session';
const STATE_COOKIE = '__Host-pereowei_oauth_state';
const SESSION_TTL_SECONDS = 60 * 60 * 12;
const STATE_TTL_SECONDS = 60 * 10;
export const ADMIN_GITHUB_LOGIN = 'dpereowei';

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left || '');
  const rightBuffer = Buffer.from(right || '');
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export function siteUrl() {
  const url = new URL(required('URL'));
  if (url.protocol !== 'https:') throw new Error('Netlify URL must use HTTPS');
  return url.origin;
}

export function parseCookies(header = '') {
  return Object.fromEntries(
    header
      .split(';')
      .map((entry) => {
        const index = entry.indexOf('=');
        return index < 0 ? ['', ''] : [entry.slice(0, index).trim(), decodeURIComponent(entry.slice(index + 1))];
      })
      .filter(([name]) => name)
  );
}

function cookie(name, value, maxAge) {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

export function stateCookie(state) {
  return cookie(STATE_COOKIE, state, STATE_TTL_SECONDS);
}

export function clearStateCookie() {
  return cookie(STATE_COOKIE, '', 0);
}

export function sessionCookie(login) {
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(JSON.stringify({ login, exp: now + SESSION_TTL_SECONDS }));
  const signature = createHmac('sha256', required('SESSION_SECRET')).update(payload).digest('base64url');
  return cookie(SESSION_COOKIE, `${payload}.${signature}`, SESSION_TTL_SECONDS);
}

export function clearSessionCookie() {
  return cookie(SESSION_COOKIE, '', 0);
}

export function sessionFromRequest(request) {
  const token = parseCookies(request.headers.get('cookie') || '')[SESSION_COOKIE];
  if (!token) return null;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expected = createHmac('sha256', required('SESSION_SECRET')).update(payload).digest('base64url');
  if (!safeEqual(signature, expected)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const isExpired = !session.exp || session.exp < Math.floor(Date.now() / 1000);
    return isExpired || session.login !== ADMIN_GITHUB_LOGIN ? null : session;
  } catch {
    return null;
  }
}

export function newState() {
  return randomBytes(32).toString('base64url');
}

export function redirect(path, cookies = []) {
  const headers = new Headers({ Location: `${siteUrl()}${path}`, 'Cache-Control': 'no-store' });
  cookies.forEach((value) => headers.append('Set-Cookie', value));
  return new Response(null, { status: 302, headers });
}

export function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export const cookies = { STATE_COOKIE };
