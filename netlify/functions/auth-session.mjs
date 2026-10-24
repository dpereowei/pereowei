import { json, sessionFromRequest } from './_auth.mjs';

export default async (request) => {
  const session = sessionFromRequest(request);
  return json(session
    ? { authenticated: true, provider: 'github', login: session.login }
    : { authenticated: false });
};
