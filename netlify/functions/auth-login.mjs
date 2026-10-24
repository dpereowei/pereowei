import { ADMIN_GITHUB_LOGIN, newState, redirect, stateCookie } from './_auth.mjs';

export default async () => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.URL) {
    return new Response('Authentication is not configured.', { status: 503 });
  }

  const state = newState();
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: `${new URL(process.env.URL).origin}/.netlify/functions/auth-callback`,
    state,
    login: ADMIN_GITHUB_LOGIN,
    allow_signup: 'false',
  });

  return redirect(`https://github.com/login/oauth/authorize?${params}`, [stateCookie(state)]);
};
