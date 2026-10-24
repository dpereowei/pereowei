import { clearSessionCookie } from './_auth.mjs';

export default async () => new Response(JSON.stringify({ authenticated: false }), {
  status: 200,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Set-Cookie': clearSessionCookie(),
  },
});
