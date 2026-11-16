import { randomUUID } from 'node:crypto';
import { getStore } from '@netlify/blobs';
import { json, sessionFromRequest } from './_auth.mjs';
import { posts as seeds } from '../../src/content/posts.js';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const mediaPattern = /^([a-z0-9]+(?:-[a-z0-9]+)*)\/[0-9a-f-]{36}\.(png|jpg|webp|gif)$/;
const mediaUrl = (key) => `/.netlify/functions/blog-media?key=${encodeURIComponent(key)}`;
const fail = (message, status = 400) => Object.assign(new Error(message), { status });

export function storeName(kind) {
  const suffix = process.env.CONTEXT === 'production' ? '' : `-${process.env.DEPLOY_ID || 'local'}`;
  return `portfolio-blog-${kind}${suffix}`;
}

export async function readLimited(request, limit) {
  const reader = request.body?.getReader();
  if (!reader) throw fail('Request body is required.');
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) { await reader.cancel(); throw fail('This upload is too large.', 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks);
}

export function validateDraft(input) {
  const fields = { title: 180, slug: 100, tag: 60, excerpt: 500, body: 100000 };
  const draft = {};
  for (const [key, max] of Object.entries(fields)) {
    if (typeof input?.[key] !== 'string' || input[key].length > max) throw fail(`Invalid ${key}.`);
    draft[key] = key === 'body' ? input[key] : input[key].trim();
  }
  if (!draft.title || !slugPattern.test(draft.slug)) throw fail('A title and valid URL slug are required.');
  return draft;
}

export function imageType(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return ['png', 'image/png'];
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return ['jpg', 'image/jpeg'];
  if (['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString())) return ['gif', 'image/gif'];
  if (bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP') return ['webp', 'image/webp'];
  throw fail('Use a PNG, JPEG, WebP or GIF image.');
}

export function createBlogApi({ documents, media, session = sessionFromRequest, clock = () => new Date() }) {
  const requireAdmin = (request) => {
    if (!session(request)) throw fail('Please sign in with GitHub again.', 401);
    if (request.method !== 'GET' && request.headers.get('origin') !== new URL(request.url).origin) {
      throw fail('This request must come from this site.', 403);
    }
  };
  const entries = async () => {
    const { blobs } = await documents().list();
    return (await Promise.all(blobs.map(({ key }) => documents().getWithMetadata(key, { type: 'json' }))))
      .filter(Boolean).map(({ data, etag }) => ({ ...data, etag }));
  };
  const wrap = (handler) => async (request) => {
    try { return await handler(request); }
    catch (error) { return json({ error: error.status ? error.message : 'Publishing storage is unavailable. Your local draft is safe.' }, error.status || 503); }
  };

  return {
    admin: wrap(async (request) => {
      requireAdmin(request);
      if (request.method === 'GET') return json({ documents: await entries() });
      if (request.method !== 'POST') throw fail('Method not allowed.', 405);
      let input;
      try { input = JSON.parse((await readLimited(request, 120000)).toString()); }
      catch (error) { if (error.status) throw error; throw fail('Invalid article data.'); }
      if (!['draft', 'publish', 'unpublish'].includes(input.action)) throw fail('Invalid publishing action.');
      const draft = validateDraft(input.draft);
      if (input.action === 'publish' && (!draft.body.trim() || !draft.excerpt)) throw fail('Add an excerpt and article body before publishing.');
      const current = await documents().getWithMetadata(draft.slug, { type: 'json' });
      const seed = seeds.find((post) => post.slug === draft.slug);
      if ((current?.etag || (seed ? 'seed' : null)) !== (input.etag || null)) throw fail('This article changed elsewhere or the URL is already in use. Open its saved version before saving again.', 409);
      const timestamp = clock().toISOString();
      const previousPublished = current ? current.data.published : seed || null;
      const published = input.action === 'publish' ? {
        ...draft,
        date: previousPublished?.date || timestamp.slice(0, 10),
        readTime: `${Math.max(1, Math.ceil(draft.body.split(/\s+/).filter(Boolean).length / 200))} min read`,
      } : input.action === 'unpublish' ? null : previousPublished;
      const document = { draft, published, status: input.action === 'publish' ? 'published' : 'draft', updatedAt: timestamp };
      // Null is intentional: suppress a bundled seed when explicitly unpublished.
      document.suppressed = Boolean((seed && input.action === 'unpublish') || (current?.data.suppressed && !published));
      const result = await documents().setJSON(draft.slug, document, current ? { onlyIfMatch: current.etag } : { onlyIfNew: true });
      if (!result.modified) throw fail('This article changed elsewhere. Reload its saved version before saving again.', 409);
      return json({ document: { ...document, etag: result.etag } });
    }),
    media: wrap(async (request) => {
      const url = new URL(request.url);
      if (request.method === 'GET') {
        const key = url.searchParams.get('key') || '';
        if (!mediaPattern.test(key)) throw fail('Image not found.', 404);
        const slug = key.split('/')[0];
        const article = await documents().get(slug, { type: 'json' });
        if (!session(request) && !article?.published?.body?.includes(mediaUrl(key))) throw fail('Image not found.', 404);
        const stored = await media().getWithMetadata(key, { type: 'arrayBuffer' });
        if (!stored) throw fail('Image not found.', 404);
        return new Response(stored.data, { headers: {
          'Content-Type': stored.metadata.contentType, 'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'private, no-store', 'Content-Security-Policy': "default-src 'none'",
        } });
      }
      requireAdmin(request);
      if (request.method !== 'POST') throw fail('Method not allowed.', 405);
      const slug = url.searchParams.get('slug') || '';
      if (!slugPattern.test(slug) || slug.length > 100 || !await documents().get(slug)) throw fail('Save this draft before uploading an image.');
      const bytes = await readLimited(request, 3 * 1024 * 1024);
      const [extension, contentType] = imageType(bytes);
      const key = `${slug}/${randomUUID()}.${extension}`;
      await media().set(key, bytes, { metadata: { contentType } });
      return json({ url: mediaUrl(key) }, 201);
    }),
    publicState: wrap(async (request) => {
      if (request.method !== 'GET') throw fail('Method not allowed.', 405);
      const records = await entries();
      return json({ posts: records.filter((record) => record.published).map((record) => record.published), suppressed: records.filter((record) => record.suppressed).map((record) => record.draft.slug) });
    }),
  };
}

export const blogApi = createBlogApi({
  documents: () => getStore({ name: storeName('documents'), consistency: 'strong' }),
  media: () => getStore({ name: storeName('media'), consistency: 'strong' }),
});
