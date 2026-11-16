import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createBlogApi, imageType, validateDraft, storeName } from '../netlify/functions/_blog.mjs';
import { markdownHeadings, mergePosts, postMarkdown } from '../src/lib/blog.js';

function memoryStore() {
  const data = new Map();
  let version = 0;
  return {
    list: async () => ({ blobs: [...data.keys()].map((key) => ({ key })) }),
    get: async (key) => data.get(key)?.data || null,
    getWithMetadata: async (key) => data.get(key) || null,
    setJSON: async (key, value, options) => {
      const prior = data.get(key);
      if ((options.onlyIfNew && prior) || (options.onlyIfMatch && prior?.etag !== options.onlyIfMatch)) return { modified: false };
      const etag = String(++version);
      data.set(key, { data: structuredClone(value), etag });
      return { modified: true, etag };
    },
    set: async (key, value, { metadata }) => data.set(key, { data: value, metadata }),
  };
}

const draft = { title: 'A real note', slug: 'a-real-note', tag: 'Reliability', excerpt: 'A useful summary.', body: '## Context\n\nA **real** article with a [link](https://example.com).' };
const endpoint = 'https://portfolio.example/.netlify/functions/';
function request(name, { method = 'GET', data, admin = true, origin = 'https://portfolio.example', body } = {}) {
  return new Request(endpoint + name, { method, headers: { ...(admin ? { cookie: 'admin=yes' } : {}), ...(method !== 'GET' ? { origin } : {}), 'Content-Type': 'application/json' }, body: body || (data ? JSON.stringify(data) : undefined) });
}
function setup() {
  const documents = memoryStore(); const media = memoryStore();
  return createBlogApi({ documents: () => documents, media: () => media, session: (req) => req.headers.get('cookie') === 'admin=yes', clock: () => new Date('2026-11-16T12:00:00Z') });
}
async function save(api, action = 'draft', etag = null, value = draft) {
  const response = await api.admin(request('blog-admin', { method: 'POST', data: { action, etag, draft: value } }));
  return { status: response.status, ...await response.json() };
}

test('requires an admin session and same-origin writes', async () => {
  const api = setup();
  assert.equal((await api.admin(request('blog-admin', { admin: false }))).status, 401);
  assert.equal((await api.admin(request('blog-admin', { method: 'POST', origin: 'https://attacker.example', data: {} }))).status, 403);
  assert.equal((await api.media(request('blog-media', { method: 'POST', admin: false, body: 'x' }))).status, 401);
});

test('drafts persist for the admin but never appear in the public feed', async () => {
  const api = setup();
  assert.equal((await save(api)).status, 200);
  const privateData = await (await api.admin(request('blog-admin'))).json();
  assert.equal(privateData.documents[0].draft.body, draft.body);
  const publicData = await (await api.publicState(request('blog-posts', { admin: false }))).json();
  assert.deepEqual(publicData, { posts: [], suppressed: [] });
});

test('unpublishing a never-published draft does not expose its slug', async () => {
  const api = setup();
  const saved = await save(api);
  await save(api, 'unpublish', saved.document.etag);
  assert.deepEqual(await (await api.publicState(request('blog-posts', { admin: false }))).json(), { posts: [], suppressed: [] });
});

test('isolates preview storage from persistent production storage', () => {
  const context = process.env.CONTEXT; const deploy = process.env.DEPLOY_ID;
  try {
    process.env.CONTEXT = 'production';
    assert.equal(storeName('documents'), 'portfolio-blog-documents');
    process.env.CONTEXT = 'deploy-preview'; process.env.DEPLOY_ID = 'test-deploy';
    assert.equal(storeName('documents'), 'portfolio-blog-documents-test-deploy');
  } finally {
    if (context === undefined) delete process.env.CONTEXT; else process.env.CONTEXT = context;
    if (deploy === undefined) delete process.env.DEPLOY_ID; else process.env.DEPLOY_ID = deploy;
  }
});

test('publishes immediately, keeps later drafts private, and rejects stale saves', async () => {
  const api = setup();
  const published = await save(api, 'publish');
  assert.equal(published.status, 200);
  assert.equal(published.document.published.date, '2026-11-16');
  const updated = await save(api, 'draft', published.document.etag, { ...draft, body: 'Private unfinished changes' });
  assert.equal(updated.status, 200);
  const publicData = await (await api.publicState(request('blog-posts', { admin: false }))).json();
  assert.equal(publicData.posts[0].body, draft.body);
  assert.equal(JSON.stringify(publicData).includes('Private unfinished'), false);
  assert.equal((await save(api, 'publish', published.document.etag)).status, 409);
});

test('unpublishes seed posts without resurrecting them on the next draft save', async () => {
  const api = setup();
  const seedDraft = { ...draft, slug: 'building-fabricops-under-lfdt' };
  assert.equal((await save(api, 'publish', null, seedDraft)).status, 409);
  const hidden = await save(api, 'unpublish', 'seed', seedDraft);
  const saved = await save(api, 'draft', hidden.document.etag, seedDraft);
  assert.equal(saved.document.published, null);
  const publicData = await (await api.publicState(request('blog-posts', { admin: false }))).json();
  assert.ok(publicData.suppressed.includes(seedDraft.slug));
  assert.deepEqual(mergePosts([{ ...seedDraft, date: '2026-01-01' }], publicData.posts, publicData.suppressed), []);
});

test('rejects malformed, empty published, and oversized content', async () => {
  const api = setup();
  assert.throws(() => validateDraft({ ...draft, slug: '../escape' }));
  assert.throws(() => validateDraft({ ...draft, body: 'x'.repeat(100001) }));
  assert.equal((await save(api, 'publish', null, { ...draft, body: '' })).status, 400);
  assert.equal((await api.admin(request('blog-admin', { method: 'POST', body: 'x'.repeat(120001) }))).status, 413);
});

test('reports a conditional-write conflict instead of claiming the draft was saved', async () => {
  const documents = memoryStore();
  documents.setJSON = async () => ({ modified: false });
  const api = createBlogApi({ documents: () => documents, media: () => memoryStore(), session: () => true });
  assert.equal((await save(api)).status, 409);
});

test('validates image signatures, limits size, and protects unpublished uploads', async () => {
  assert.throws(() => imageType(Buffer.from('<svg onload="alert(1)"/>')));
  const api = setup();
  const saved = await save(api);
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]);
  const uploaded = await api.media(request(`blog-media?slug=${draft.slug}`, { method: 'POST', body: png }));
  assert.equal(uploaded.status, 201);
  const { url } = await uploaded.json();
  const path = url.split('/.netlify/functions/')[1];
  assert.equal((await api.media(request(path, { admin: false }))).status, 404);
  assert.equal((await api.media(request(path))).headers.get('content-type'), 'image/png');
  await save(api, 'publish', saved.document.etag, { ...draft, body: `![Diagram](${url})` });
  assert.equal((await api.media(request(path, { admin: false }))).status, 200);
  assert.equal((await api.media(request('blog-media?key=../../secrets', { admin: false }))).status, 404);
  assert.equal((await api.media(request(`blog-media?slug=${draft.slug}`, { method: 'POST', body: Buffer.alloc(3 * 1024 * 1024 + 1) }))).status, 413);
});

test('renders GFM links, images and formatting without raw HTML or script URLs', () => {
  const markup = renderToStaticMarkup(React.createElement(ReactMarkdown, { skipHtml: true, remarkPlugins: [remarkGfm] },
    '**Bold**\n\n[Good](https://example.com)\n\n![Alt](/image.png)\n\n[Bad](javascript:alert%281%29)\n\n<script>alert(1)</script>\n\n- Item'));
  assert.match(markup, /<strong>Bold<\/strong>/);
  assert.match(markup, /href="https:\/\/example.com"/);
  assert.match(markup, /alt="Alt"/);
  assert.match(markup, /<li>Item<\/li>/);
  assert.doesNotMatch(markup, /<script|javascript:/);
});

test('builds matching unique heading anchors and preserves legacy articles', () => {
  assert.deepEqual(markdownHeadings('## A **heading**\n\n## A heading'), [
    { title: 'A heading', id: 'a-heading', depth: 2 }, { title: 'A heading', id: 'a-heading-1', depth: 2 },
  ]);
  assert.equal(postMarkdown({ sections: [{ heading: 'Old heading', body: 'Old content' }] }), '## Old heading\n\nOld content');
});
