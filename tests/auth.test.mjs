import assert from 'node:assert/strict';
import test from 'node:test';

process.env.URL = 'https://pereowei.weidantech.com';
process.env.SESSION_SECRET = 'test-secret-that-is-long-enough-for-a-signature';

const { parseCookies, sessionCookie, sessionFromRequest } = await import('../netlify/functions/_auth.mjs');

test('creates and verifies an authorised signed session', () => {
  const setCookie = sessionCookie('dpereowei');
  const request = new Request('https://pereowei.weidantech.com/.netlify/functions/auth-session', {
    headers: { cookie: setCookie.split(';')[0] },
  });
  assert.equal(sessionFromRequest(request).login, 'dpereowei');
});

test('rejects a session whose signature has been modified', () => {
  const value = parseCookies(sessionCookie('dpereowei'))['__Host-pereowei_session'];
  const request = new Request('https://pereowei.weidantech.com/.netlify/functions/auth-session', {
    headers: { cookie: `__Host-pereowei_session=${value.slice(0, -1)}x` },
  });
  assert.equal(sessionFromRequest(request), null);
});

test('rejects a valid session for a different GitHub account', () => {
  const setCookie = sessionCookie('another-account');
  const request = new Request('https://pereowei.weidantech.com/.netlify/functions/auth-session', {
    headers: { cookie: setCookie.split(';')[0] },
  });
  assert.equal(sessionFromRequest(request), null);
});
