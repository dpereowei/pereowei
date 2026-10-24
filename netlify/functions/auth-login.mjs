import { newState, redirect, stateCookie } from './_auth.mjs';

export default async () => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.SITE_URL || !process.env.ADMIN_GITHUB_LOGIN) {
    return new Response('Authentication is not configured.', { status: 503 });
  }

  const state = newState();
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: `${new URL(process.env.SITE_URL).origin}/.netlify/functions/auth-callback`,
    state,
    login: process.env.ADMIN_GITHUB_LOGIN,
    allow_signup: 'false',
  });

  return redirect(`https://github.com/login/oauth/authorize?${params}`, [stateCookie(state)]);
};
