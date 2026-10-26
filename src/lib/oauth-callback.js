export function oauthCallbackHandoff(location) {
  if (location.pathname !== '/') return null;

  const params = new URLSearchParams(location.search);
  const auth = params.get('auth');
  if (auth === 'admin' || auth === 'denied') return `/#/admin?auth=${auth}`;
  if (!params.get('code')) return null;

  return `/.netlify/functions/auth-callback?${params.toString()}`;
}
