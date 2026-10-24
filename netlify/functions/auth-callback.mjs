import { clearStateCookie, cookies, parseCookies, redirect, sessionCookie } from './_auth.mjs';

export default async (request) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const expectedState = parseCookies(request.headers.get('cookie') || '')[cookies.STATE_COOKIE];

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirect('/#/admin?auth=denied', [clearStateCookie()]);
  }

  try {
    const callbackUrl = `${new URL(process.env.SITE_URL || '').origin}/.netlify/functions/auth-callback`;
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID || '',
        client_secret: process.env.GITHUB_CLIENT_SECRET || '',
        code,
        redirect_uri: callbackUrl,
      }),
    });
    const token = await tokenResponse.json();
    if (!token.access_token) throw new Error('Token exchange failed');

    const profileResponse = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token.access_token}`, Accept: 'application/vnd.github+json' },
    });
    const profile = await profileResponse.json();
    if (!profileResponse.ok || profile.login !== process.env.ADMIN_GITHUB_LOGIN) throw new Error('Unauthorised account');

    return redirect('/#/admin', [clearStateCookie(), sessionCookie(profile.login)]);
  } catch {
    return redirect('/#/admin?auth=denied', [clearStateCookie()]);
  }
};
