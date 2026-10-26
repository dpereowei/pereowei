export function oauthCallbackHandoff(location) {
  if (location.pathname !== '/') return null;

  const params = new URLSearchParams(location.search);
  if (!params.get('code') || !params.get('state')) return null;

  return `/.netlify/functions/auth-callback?${params.toString()}`;
}
